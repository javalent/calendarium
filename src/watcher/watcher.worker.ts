import type { CachedMetadata, FrontMatterCache } from "obsidian";
import type {
    Calendar,
    CalEvent,
    CalEventCategory,
    Nullable,
} from "src/@types";
import { CalEventHelper } from "src/events/event.helper";
import type {
    OptionsMessage,
    CalendarsMessage,
    QueueMessage,
    SaveMessage,
    FileCacheMessage,
    GetFileCacheMessage,
    DeleteEventMessage,
    UpdateEventMessage,
    NewCategoryMessage,
} from "./watcher.types";

const ctx: Worker = self as any;
class Parser {
    queue: string[] = [];
    parsing: boolean = false;
    defaultCalendar: string;
    calendars: Calendar[];
    format: string;
    parseTitle: boolean = false;
    addToDefaultIfMissing: boolean;
    debug: boolean;
    eventHelpers = new Map();
    paths: [string, string][];
    inlineEventsTag: string | null = null;

    constructor() {
        //Register Options Changer
        ctx.addEventListener(
            "message",
            (event: MessageEvent<OptionsMessage>) => {
                if (event.data.type == "options") {
                    const {
                        defaultCalendar,
                        addToDefaultIfMissing,
                        format,
                        parseTitle,
                        debug,
                        inlineEventsTag,
                        paths,
                    } = event.data;
                    this.addToDefaultIfMissing = addToDefaultIfMissing;
                    this.defaultCalendar = defaultCalendar;
                    this.format = format;
                    this.parseTitle = parseTitle;
                    this.inlineEventsTag = inlineEventsTag;

                    this.debug = debug;

                    /** Paths should always be sorted, but... just in case. */
                    this.paths = paths.sort((a, b) => {
                        return a[0].localeCompare(b[0]);
                    });

                    if (this.debug) {
                        console.debug("Received calendars message");
                    }

                    if (this.debug) {
                        console.debug("Received options message");
                    }
                }
            }
        );
        //Register Calendars Changer
        ctx.addEventListener(
            "message",
            (event: MessageEvent<CalendarsMessage>) => {
                if (event.data.type == "calendars") {
                    const { calendars } = event.data;
                    this.calendars = [...calendars];
                }
            }
        );

        //Add Files to Queue
        ctx.addEventListener("message", (event: MessageEvent<QueueMessage>) => {
            if (event.data.type == "queue") {
                this.add(...event.data.paths);
                if (this.debug) {
                    console.debug(
                        `Received queue message for ${event.data.paths.length} paths`
                    );
                }
            }
        });
    }
    add(...paths: string[]) {
        if (this.debug) {
            console.debug(`Adding ${paths.length} paths to queue`);
        }
        this.queue.push(...paths);
        if (!this.parsing) this.parse();
    }
    async parse() {
        this.parsing = true;
        while (this.queue.length) {
            const path = this.queue.shift();
            if (this.debug) {
                console.debug(
                    `Parsing ${path} for calendar events (${this.queue.length} to go)`
                );
            }
            if (!path) break;
            await this.getFileData(path);
        }
        this.parsing = false;
        if (this.debug) {
            console.info(`Parsing complete`);
        }

        ctx.postMessage<SaveMessage>({ type: "save" });
    }
    async getFileData(path: string): Promise<void> {
        let self = this;
        return new Promise((resolve) => {
            function resolution(
                event: MessageEvent<FileCacheMessage | QueueMessage>
            ) {
                if (event.data.type == "queue") {
                    ctx.removeEventListener("message", resolution);
                    resolve();
                    return;
                }
                if (event.data.type != "file") return;
                if (event.data.path != path) return;

                ctx.removeEventListener("message", resolution);
                const { data, cache, allTags, file } = event.data;
                if (path.endsWith(".md")) {
                    self.parseFileForEvents(data, cache, allTags, file);
                }
                resolve();
            }
            setTimeout(() => resolve(), 500);
            ctx.addEventListener("message", resolution);
            ctx.postMessage<GetFileCacheMessage>({ path, type: "get" });
        });
    }
    removeEventsFromFile(path: string) {
        for (const calendar of this.calendars) {
            ctx.postMessage<DeleteEventMessage>({
                path,
                id: calendar.id,
                type: "delete",
            });
        }
    }
    parseFileForEvents(
        data: string,
        cache: CachedMetadata,
        allTags: string[],
        file: { path: string; basename: string }
    ) {
        const { frontmatter } = cache ?? {};

        // Always clear existing events for a changed file
        this.removeEventsFromFile(file.path);

        const eventHelper = this.createEventHandler(frontmatter, file);
        if (!eventHelper) {
            return; // no calendar for this file, events removed
        }

        let fEvents = 0;
        let tEvents = 0;

        eventHelper.parseFrontmatterEvent(
            frontmatter,
            file,
            (event: CalEvent) => {
                ctx.postMessage<UpdateEventMessage>({
                    type: "update",
                    id: eventHelper.calendar.id,
                    index: -1,
                    event,
                    original: undefined,
                });
                fEvents++;
            }
        );

        if (
            this.inlineEventsTag != null &&
            allTags &&
            (allTags.includes(this.inlineEventsTag) ||
                allTags.includes(`#${this.inlineEventsTag}`))
        ) {
            eventHelper.parseInlineEvents(
                data,
                file,
                (event: CalEvent) => {
                    ctx.postMessage<UpdateEventMessage>({
                        type: "update",
                        id: eventHelper.calendar.id,
                        index: -1,
                        event,
                        original: undefined,
                    });
                    tEvents++;
                },
                (calendar, element) => {
                    //found a span event on a different calendar

                    //get helper for that calendar
                    const otherHelper = this.getHelperByName(calendar);
                    //no calendar was found
                    if (!otherHelper) return;
                    const event = otherHelper.parseEventElement(element, file);
                    if (!event) return;
                    if (this.debug) {
                        console.info(
                            `Found inline event registered to a different calendar.`
                        );
                    }
                    ctx.postMessage<UpdateEventMessage>({
                        type: "update",
                        id: otherHelper.calendar.id,
                        index: -1,
                        event,
                        original: undefined,
                    });
                }
            );
        }

        if (this.debug && fEvents + tEvents > 0) {
            console.info(
                `${fEvents} frontmatter and ${tEvents} inline event operations completed on ${eventHelper.calendar.name} for ${file.basename}`
            );
        }
    }
    createEventHandler(
        frontmatter: FrontMatterCache | undefined,
        file: { path: string; basename: string }
    ): Nullable<CalEventHelper> {
        if (!frontmatter?.["fc-ignore"]) {
            let name = frontmatter?.["fc-calendar"];
            if (!name || !name.length) {
                // did we get here because a calendar looks for events in this path?
                const match = this.paths.find((p2n) =>
                    file.path.startsWith(p2n[0])
                );
                if (match) {
                    name = match[1];
                }
            }
            if (this.addToDefaultIfMissing && (!name || !name.length)) {
                name = this.defaultCalendar;
            }

            name = name?.trim().toLowerCase();
            if (name) {
                return this.getHelperByName(name);
            } else if (this.debug) {
                console.info(
                    `Could not find calendar ${name} associated with file ${file.basename}`
                );
            }
        }
        return null;
    }
    getHelperByName(name: string) {
        let helper = this.eventHelpers.get(name);

        if (helper) {
            return helper;
        } else {
            if (this.debug) console.info("Finding calendar for", name);
            const calendar = this.calendars.find(
                (calendar) => name.toLowerCase() == calendar.name.toLowerCase()
            );
            if (calendar) {
                if (this.debug)
                    console.info(
                        "creating event helper for calendar",
                        calendar
                    );
                helper = new CalEventHelper(calendar, this.parseTitle);

                helper.onNewCategory = (category: CalEventCategory) => {
                    ctx.postMessage<NewCategoryMessage>({
                        type: "category",
                        id: helper.calendar.id,
                        category,
                    });
                };

                this.eventHelpers.set(name, helper);
                return helper;
            }
        }
    }
}
new Parser();
