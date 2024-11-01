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
import CalWorker from "./watcher.worker";
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
import { SettingsService } from "src/settings/settings.service";

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
        return SettingsService.getCalendars();
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

    get metadataCache() {
        return this.plugin.app.metadataCache;
    }
    get vault() {
        return this.plugin.app.vault;
    }
    constructor(public plugin: Calendarium) {
        super();
    }

    worker: Worker = new CalWorker();
    onload() {
        /** Rescan for events for all calendars */
        this.plugin.addCommand({
            id: "rescan-events",
            name: "Rescan events",
            callback: () => {
                if (SettingsService.getData().debug) {
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
                        if (SettingsService.getData().debug) {
                            console.info(
                                "Beginning full rescan for calendar events for calendar " +
                                    modal.chosen.name
                            );
                        }
                        this.start({ ...modal.chosen });
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
                    calendars: SettingsService.getCalendars(),
                });
            })
        );

        this.registerEvent(
            this.plugin.app.workspace.on("calendarium-settings-change", () => {
                this.worker.postMessage<OptionsMessage>({
                    type: "options",
                    parseTitle: SettingsService.getData().parseDates,
                    format: this.plugin.format,
                    defaultCalendar: this.plugin.defaultCalendar?.name,
                    paths: SettingsService.getData().paths,
                    debug: SettingsService.getData().debug,
                    inlineEventsTag: SettingsService.getData().inlineEventsTag,
                });
            })
        );

        /** Metadata for a file has changed and the file should be checked. */
        this.registerEvent(
            this.metadataCache.on("changed", (file) => {
                /** Already being parsed. */
                if (this.queue.has(file.path)) return;
                this.parseFiles(file);
            })
        );
        /** A file has been renamed and should be checked for events.
         */
        this.registerEvent(
            this.vault.on("rename", async (abstractFile, oldPath) => {
                if (!SettingsService.getCalendars().length) return;
                if (!(abstractFile instanceof TFile)) return;
                if (this.pathContainsFile(oldPath)) {
                    for (const calendar of SettingsService.getCalendars()) {
                        const store = this.plugin.getStoreByCalendar(calendar);
                        if (!store) continue;
                        store.eventStore.removeEventsFromFile(oldPath);
                    }
                    this.worker.postMessage<CalendarsMessage>({
                        type: "calendars",
                        calendars: SettingsService.getCalendars(),
                    });
                    this.parseFiles(abstractFile);
                }
            })
        );
        /** A file has been deleted and should be checked for events to unlink. */
        this.registerEvent(
            this.vault.on("delete", async (abstractFile) => {
                if (!(abstractFile instanceof TFile)) return;
                let updated = false;
                for (let calendar of SettingsService.getCalendars()) {
                    const store = this.plugin.getStoreByCalendar(calendar);
                    if (!store) continue;
                    store.eventStore.removeEventsFromFile(abstractFile.path);
                    updated = true;
                }
                if (updated) await SettingsService.save({ calendar: true });
            })
        );

        //worker messages
        /** Send the worker the calendars so I don't have to with every message. */
        this.worker.postMessage<CalendarsMessage>({
            type: "calendars",
            calendars: SettingsService.getCalendars(),
        });

        /** Send the workers the options so I don't have to with every message. */
        this.worker.postMessage<OptionsMessage>({
            type: "options",
            parseTitle: SettingsService.getData().parseDates,
            format: this.plugin.format,
            defaultCalendar: this.plugin.defaultCalendar?.name,
            inlineEventsTag: SettingsService.getData().inlineEventsTag,
            paths: SettingsService.getData().paths,
            debug: SettingsService.getData().debug,
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
                            allTags: allTags ?? [],
                            data,
                        });
                    } else if (file instanceof TFolder) {
                        this.worker.postMessage<Partial<FileCacheMessage>>({
                            type: "file",
                            path,
                        });
                        for (const child of file.children) {
                            this.parseFiles(child);
                        }
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
                    const calendar = SettingsService.getCalendars().find(
                        (c) => c.id == id
                    );

                    if (!calendar) return;
                    const store = this.plugin.getStore(calendar.id);
                    if (!store) return;

                    if (SettingsService.getData().debug) {
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
                    const calendar = SettingsService.getCalendars().find(
                        (c) => c.id == id
                    );
                    if (!calendar) return;
                    const store = this.plugin.getStore(calendar.id);
                    if (!store) return;
                    if (store.hasCategory(category.id)) return;
                    store.addCategory(category);
                    await SettingsService.save({ calendar: true });
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
                    const calendar = SettingsService.getCalendars().find(
                        (c) => c.id == id
                    );
                    if (!calendar) return;
                    if (SettingsService.getData().debug)
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
                    if (SettingsService.getData().debug) {
                        console.debug("Received save event from file watcher");
                    }
                }
            }
        );

        this.plugin.app.workspace.onLayoutReady(() => {
            this.start();
        });
    }
    pathContainsFile(filePath: string) {
        const paths = SettingsService.getData().paths;
        if (!paths.length || paths.some((path) => path[0] === "/")) return true;

        for (const path of paths) {
            if (filePath.startsWith(path[0])) return true;
        }
        return false;
    }
    start(calendar?: Calendar) {
        if (!SettingsService.getData().autoParse) return;

        const calendars = calendar
            ? [calendar]
            : SettingsService.getCalendars();
        if (!calendars.length) return;

        const folders = [];
        for (const [path] of SettingsService.getData().paths) {
            const folder = this.vault.getAbstractFileByPath(path);
            if (!folder || !(folder instanceof TFolder)) return;
            folders.push(folder);
        }
        if (!folders.length) return;

        if (SettingsService.getData().debug) {
            if (calendar) {
                console.info(`Starting rescan for ${calendar.name}`);
            } else {
                console.info(
                    `Starting rescan for ${calendars.length} calendars`
                );
                console.info(`Looking at ${folders.length} paths`);
            }
        }

        this.parseFiles(...folders);
    }
    getFiles(abstract: TAbstractFile): string[] {
        let files = [];
        if (
            abstract instanceof TFolder ||
            (abstract instanceof TFile && abstract.extension === "md")
        ) {
            files.push(abstract.path);
        }
        return files;
    }

    parseFiles(...folders: TAbstractFile[]) {
        const parsing: Set<string> = new Set();
        for (const folder of folders) {
            for (const path of this.getFiles(folder)) {
                parsing.add(path);
            }
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
    }
}
