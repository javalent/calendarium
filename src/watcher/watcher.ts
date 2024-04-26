import {
    Component,
    TFile,
    TFolder,
    getAllTags,
    FuzzySuggestModal,
    TAbstractFile,
} from "obsidian";
import type { Calendar } from "src/@types";
import type Calendarium from "src/main";
//have to ignore until i fix typing issue
//@ts-expect-error
import Worker from "./watcher.worker";
import type {
    CalendarsMessage,
    GetFileCacheMessage,
    FileCacheMessage,
    OptionsMessage,
    QueueMessage,
    UpdateEventMessage,
    SaveMessage,
    DeleteEventMessage,
    NewCategoryMessage,
} from "./watcher.types";

declare global {
    interface Worker {
        postMessage<T>(message: T, transfer?: Transferable[]): void;
    }
}

export type CalendarEventTree = Map<string, Set<number>>;

class CalendarPickerModal extends FuzzySuggestModal<Calendar> {
    chosen: Calendar;
    constructor(public plugin: Calendarium) {
        super(plugin.app);
    }
    getItems() {
        return this.plugin.data.calendars;
    }
    getItemText(item: Calendar) {
        return item.name;
    }
    onChooseItem(item: Calendar, evt: MouseEvent | KeyboardEvent): void {
        this.chosen = item;
        this.close();
    }
}

export class Watcher extends Component {
    queue: Set<string> = new Set();
    paths: Set<string> = new Set();
    get calendars() {
        return this.plugin.data.calendars;
    }
    get metadataCache() {
        return this.plugin.app.metadataCache;
    }
    get vault() {
        return this.plugin.app.vault;
    }
    constructor(public plugin: Calendarium) {
        super();
    }

    worker = new Worker();
    onload() {
        /** Rescan for events for all calendars */
        this.plugin.addCommand({
            id: "rescan-events",
            name: "Rescan events",
            callback: () => {
                if (this.plugin.data.debug) {
                    console.info("Beginning full rescan for calendar events");
                }
                this.start();
            },
        });

        /** Rescan for events for a specific calendar. */
        this.plugin.addCommand({
            id: "rescan-events-for-calendar",
            name: "Rescan events for calendar",
            callback: () => {
                const modal = new CalendarPickerModal(this.plugin);
                modal.onClose = () => {
                    if (modal.chosen) {
                        if (this.plugin.data.debug) {
                            console.info(
                                "Beginning full rescan for calendar events for calendar " +
                                    modal.chosen.name
                            );
                        }
                        this.start({ ...modal.chosen, autoParse: true });
                    }
                };
                modal.open();
            },
        });

        /** Plugin's saveCalendars method was called (calendar settings updated). */
        this.registerEvent(
            this.plugin.app.workspace.on("calendarium-updated", () => {
                this.worker.postMessage<CalendarsMessage>({
                    type: "calendars",
                    calendars: this.calendars,
                });
            })
        );

        this.registerEvent(
            this.plugin.app.workspace.on("calendarium-settings-change", () => {
                this.worker.postMessage<OptionsMessage>({
                    type: "options",
                    parseTitle: this.plugin.data.parseDates,
                    addToDefaultIfMissing:
                        this.plugin.data.addToDefaultIfMissing,
                    format: this.plugin.format,
                    defaultCalendar: this.plugin.defaultCalendar?.name,
                    paths: this.plugin.data.paths,
                    debug: this.plugin.data.debug,
                });
            })
        );

        /** Metadata for a file has changed and the file should be checked. */
        this.registerEvent(
            this.metadataCache.on("changed", (file) => {
                /** Already being parsed. */
                if (this.queue.has(file.path)) return;
                this.parseFile(file);
            })
        );
        /** A file has been renamed and should be checked for events.
         */
        this.registerEvent(
            this.vault.on("rename", async (abstractFile, oldPath) => {
                if (!this.calendars.length) return;
                if (!(abstractFile instanceof TFile)) return;
                for (const calendar of this.calendars) {
                    const store = this.plugin.getStoreByCalendar(calendar);
                    if (!store) continue;
                    store.eventStore.removeEventsFromFile(oldPath);
                }
                this.worker.postMessage<CalendarsMessage>({
                    type: "calendars",
                    calendars: this.calendars,
                });
                this.parseFile(abstractFile);
            })
        );
        /** A file has been deleted and should be checked for events to unlink. */
        this.registerEvent(
            this.vault.on("delete", async (abstractFile) => {
                if (!(abstractFile instanceof TFile)) return;
                let updated = false;
                for (let calendar of this.calendars) {
                    const store = this.plugin.getStoreByCalendar(calendar);
                    if (!store) continue;
                    store.eventStore.removeEventsFromFile(abstractFile.path);
                    updated = true;
                }
                if (updated) await this.plugin.saveCalendars();
            })
        );

        //worker messages
        /** Send the worker the calendars so I don't have to with every message. */
        this.worker.postMessage<CalendarsMessage>({
            type: "calendars",
            calendars: this.calendars,
        });

        /** Send the workers the options so I don't have to with every message. */
        this.worker.postMessage<OptionsMessage>({
            type: "options",
            parseTitle: this.plugin.data.parseDates,
            addToDefaultIfMissing: this.plugin.data.addToDefaultIfMissing,
            format: this.plugin.format,
            defaultCalendar: this.plugin.defaultCalendar?.name,
            inlineEventsTag: this.plugin.data.inlineEventsTag,
            paths: this.plugin.data.paths,
            debug: this.plugin.data.debug,
        });

        /** The worker will ask for file information from files in its queue here */
        this.worker.addEventListener(
            "message",
            async (event: MessageEvent<GetFileCacheMessage>) => {
                if (event.data.type == "get") {
                    const { path } = event.data;
                    this.queue.delete(path);
                    const file =
                        this.plugin.app.vault.getAbstractFileByPath(path);
                    if (file instanceof TFile) {
                        const cache =
                            this.metadataCache.getFileCache(file) ?? {};
                        const allTags = getAllTags(cache);
                        const data = await this.vault.cachedRead(file);
                        this.worker.postMessage<FileCacheMessage>({
                            type: "file",
                            path,
                            cache,
                            file: { path: file.path, basename: file.basename },
                            allTags,
                            data,
                        });
                    } else if (file instanceof TFolder) {
                        this.parseFile(file);
                    }
                }
            }
        );

        /** The worker has found an event that should be updated. */
        this.worker.addEventListener(
            "message",
            async (evt: MessageEvent<UpdateEventMessage>) => {
                if (evt.data.type == "update") {
                    const { id, index, event, original } = evt.data;

                    const calendar = this.calendars.find((c) => c.id == id);

                    if (!calendar) return;
                    const store = this.plugin.getStore(calendar.id);
                    if (!store) return;

                    if (this.plugin.data.debug) {
                        if (index == -1) {
                            console.debug(
                                `Adding '${event.name}' to ${calendar.name}`
                            );
                        } else {
                            console.debug(
                                `Updating '${event.name}' in calendar ${calendar.name}`
                            );
                        }
                    }

                    store.eventStore.insertEventsFromFile(event.note!, event);
                }
            }
        );

        this.worker.addEventListener(
            "message",
            async (evt: MessageEvent<NewCategoryMessage>) => {
                if (evt.data.type == "category") {
                    const { id, category } = evt.data;
                    const calendar = this.calendars.find((c) => c.id == id);
                    if (!calendar) return;
                    const store = this.plugin.getStore(calendar.id);
                    if (!store) return;
                    if (store.hasCategory(category.id)) return;
                    store.addCategory(category);
                    await this.plugin.saveCalendars();
                }
            }
        );

        /** An event needs to be removed. */
        this.worker.addEventListener(
            "message",
            async (evt: MessageEvent<DeleteEventMessage>) => {
                if (evt.data.type == "delete") {
                    const { id, path } = evt.data;
                    if (!path) return;
                    const calendar = this.calendars.find((c) => c.id == id);
                    if (!calendar) return;
                    if (this.plugin.data.debug)
                        console.debug(
                            `Removing events for ${path} from ${calendar.name}`
                        );
                    const store = this.plugin.getStore(calendar.id);
                    if (!store) return;
                    store.eventStore.removeEventsFromFile(path);
                }
            }
        );

        /** The worker has parsed all files in its queue. */
        this.worker.addEventListener(
            "message",
            async (evt: MessageEvent<SaveMessage>) => {
                if (evt.data.type == "save") {
                    if (this.plugin.data.debug) {
                        console.debug("Received save event from file watcher");
                    }
                }
            }
        );

        this.plugin.app.workspace.onLayoutReady(() => {
            this.start();
        });
    }
    start(calendar?: Calendar) {
        const calendars = calendar ? [calendar] : this.calendars;
        if (!calendars.length) return;

        const folder = this.vault.getRoot();
        if (!folder || !(folder instanceof TFolder)) return;

        if (this.plugin.data.debug) {
            if (calendar) {
                console.info(`Starting rescan for ${calendar.name}`);
            } else {
                console.info(
                    `Starting rescan for ${calendars.length} calendars`
                );
            }
        }

        this.parseFile(folder);
    }
    getFiles(folder: TAbstractFile): string[] {
        let files = [];
        if (folder instanceof TFolder) {
            for (const child of folder.children) {
                files.push(child.path);
            }
        }

        if (folder instanceof TFile && folder.extension === "md") {
            files.push(folder.path);
        }
        return files;
    }
    parseFile(folder: TAbstractFile) {
        const parsing: Set<string> = new Set();
        for (const path of this.getFiles(folder)) {
            parsing.add(path);
        }

        this.startParsing([...parsing]);
    }
    startParsing(paths: string[]) {
        for (const path of paths) {
            this.queue.add(path);
        }
        this.worker.postMessage<QueueMessage>({
            type: "queue",
            paths,
        });
    }

    onunload() {
        this.worker.terminate();
        this.worker = null;
    }
}
