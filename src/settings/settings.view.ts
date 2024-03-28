import {
    addIcon,
    ButtonComponent,
    Notice,
    Platform,
    PluginSettingTab,
    setIcon,
    Setting,
    TextComponent,
    ExtraButtonComponent,
    DropdownComponent,
    TFolder,
    normalizePath,
} from "obsidian";

import copy from "fast-copy";

import type Calendarium from "../main";
import Importer from "./import/importer";

import type { Calendar, PresetCalendar } from "src/@types";
import { SyncBehavior } from "src/schemas";

import {
    confirmDeleteCalendar,
    ConfirmExitModal,
    confirmWithModal,
} from "./modals/confirm";
import { CalendariumModal } from "./modals/modal";
import { get } from "svelte/store";
import createStore, { type CreatorStore } from "./creator/stores/calendar";
import { DEFAULT_CALENDAR } from "./settings.constants";
import { nanoid } from "src/utils/functions";
import SettingsService from "./settings.service";
import { RestoreCalendarModal } from "./modals/restore";
import { FolderInputSuggest } from "obsidian-utilities";
import { getPresetCalendar } from "./preset";
import CreatorController from "./creator/CreatorController.svelte";
import {
    ADD,
    CHECK,
    CLOSE,
    COLLAPSE,
    CUSTOM_CREATOR,
    EDIT,
    IMPORT,
    QUICK_CREATOR,
    RESET,
    RESTORE,
    TRASH,
    WARNING,
} from "src/utils/icons";

export enum Recurring {
    none = "None",
    monthly = "Monthly",
    yearly = "Yearly",
}
interface Context {
    store: CreatorStore;
    plugin: Calendarium;
}
declare module "svelte" {
    function setContext<K extends keyof Context>(
        key: K,
        value: Context[K]
    ): void;
    function getContext<K extends keyof Context>(key: K): Context[K];
}
declare module "obsidian" {
    interface App {
        internalPlugins: {
            getPluginById(id: "daily-notes"): {
                _loaded: boolean;
                instance: {
                    options: {
                        format: string;
                    };
                };
            };
            getPluginById(id: "sync"): {
                _loaded: boolean;
                instance: Events & {
                    getStatus():
                        | "error"
                        | "paused"
                        | "syncing"
                        | "uninitialized"
                        | "synced";
                    on(name: "status-change", callback: () => any): EventRef;
                };
            };
            getPluginById(id: "page-preview"): {
                _loaded: boolean;
            };
        };
        setting: {
            open(): void;
            openTabById(id: string): CalendariumSettings;
        };
    }
}

export default class CalendariumSettings extends PluginSettingTab {
    contentEl: HTMLDivElement;
    calendarsEl: HTMLDetailsElement;
    existingEl: HTMLDivElement;
    pathsEl: HTMLDivElement;
    toggleState = {
        calendar: false,
        event: false,
        advanced: false,
    };
    eventsEl: HTMLDetailsElement;
    get data() {
        return this.settings$.getData();
    }
    constructor(public plugin: Calendarium, public settings$: SettingsService) {
        super(plugin.app, plugin);
        this.plugin.registerEvent(
            this.app.workspace.on("calendarium-settings-external-load", () =>
                this.display()
            )
        );
    }
    async display() {
        this.containerEl.empty();
        this.containerEl.addClass("calendarium-settings");
        this.contentEl = this.containerEl.createDiv(
            "calendarium-settings-content"
        );

        this.buildInfo(this.contentEl.createDiv("calendarium-nested-settings"));

        this.calendarsEl = this.contentEl.createEl("details", {
            cls: "calendarium-nested-settings",
            attr: {
                /* ...(this.toggleState.calendar ? { open: `open` } : {}), */
                open: "open",
            },
        });
        this.buildCalendars();
        this.eventsEl = this.contentEl.createEl("details", {
            cls: "calendarium-nested-settings",
            attr: {
                ...(this.toggleState.event ? { open: `open` } : {}),
            },
        });
        this.buildEvents(this.eventsEl);
        this.buildAdvanced(
            this.contentEl.createEl("details", {
                cls: "calendarium-nested-settings",
                attr: {
                    ...(this.toggleState.advanced ? { open: `open` } : {}),
                },
            })
        );
    }
    async buildInfo(containerEl: HTMLElement) {
        containerEl.empty();

        if (await this.settings$.markdownFileExists()) {
            new Setting(containerEl)
                .setName(`Load previous data file`)
                .setDesc(
                    createFragment((e) => {
                        e.createSpan({
                            text: "A file from a previous version of Calendarium was detected on your system.",
                        });
                        e.createEl("br");
                        e.createEl("br");
                        e.createSpan({
                            text: `This will overwrite your existing data file.`,
                        });
                    })
                )
                .addButton((b) => {
                    b.setIcon(IMPORT).onClick(async () => {
                        if (
                            await confirmWithModal(
                                app,
                                "This will overwrite your settings. Are you sure?",
                                {
                                    cta: "Import",
                                    secondary: "Cancel",
                                }
                            )
                        ) {
                            await this.settings$.transitionMarkdownSettings();
                            await this.display();
                        }
                    });
                })
                .addExtraButton((b) => {
                    b.setIcon(TRASH).onClick(async () => {
                        if (
                            await confirmWithModal(
                                app,
                                "This will permanently delete the old data file. Are you sure?"
                            )
                        ) {
                            await this.settings$.deleteMarkdownSettings();
                        }
                    });
                });
        }
    }
    async buildCalendars() {
        this.calendarsEl.empty();
        const summary = this.calendarsEl.createEl("summary");
        this.calendarsEl.ontoggle = async () => {
            this.toggleState.calendar = this.calendarsEl.open;
        };
        new Setting(summary).setHeading().setName("Calendar management");

        setIcon(summary.createDiv("collapser").createDiv("handle"), COLLAPSE);

        new Setting(this.calendarsEl)
            .setName("Default calendar")
            .setDesc("Views will open to this calendar by default.")
            .addDropdown((d) => {
                d.addOption("none", "None");
                for (let calendar of this.data.calendars) {
                    d.addOption(calendar.id, calendar.name);
                }
                d.setValue(this.data.defaultCalendar ?? "none");
                d.onChange(async (v) => {
                    if (v === "none") {
                        this.data.defaultCalendar = null;
                        await this.settings$.saveAndTrigger();
                        return;
                    }

                    this.data.defaultCalendar = v;
                    await this.settings$.saveAndTrigger();
                    this.plugin.watcher.start();
                });
            });
        new Setting(this.calendarsEl)
            .setName("Import calendar")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "Import calendar from the ",
                    });
                    e.createEl("a", {
                        href: "https://app.fantasy-calendar.com",
                        text: "Fantasy Calendar website",
                        cls: "external-link",
                    });
                })
            )
            .addButton((b) => {
                const input = createEl("input", {
                    attr: {
                        type: "file",
                        name: "merge",
                        accept: ".json",
                        multiple: true,
                        style: "display: none;",
                    },
                });
                input.onchange = async () => {
                    const { files } = input;

                    if (!files?.length) return;
                    try {
                        const data = [];
                        for (let file of Array.from(files)) {
                            data.push(JSON.parse(await file.text()));
                        }
                        const calendars = Importer.import(data);
                        for (const calendar of calendars) {
                            await this.plugin.addNewCalendar(calendar);
                        }
                        this.display();
                    } catch (e) {
                        new Notice(
                            `There was an error while importing the calendar${
                                files.length == 1 ? "" : "s"
                            }.`
                        );
                        console.error(e);
                    }

                    input.value = "";
                };
                b.setIcon(IMPORT);
                b.buttonEl.addClass("calendar-file-upload");
                b.buttonEl.appendChild(input);
                b.onClick(() => input.click());
            });

        if (this.settings$.deletedCalendars?.length) {
            new Setting(this.calendarsEl)
                .setName("Restore deleted calendars")
                .addButton((b) => {
                    b.setTooltip("Restore").setIcon(RESTORE);
                    b.buttonEl.setCssStyles({ position: "relative" });
                    const badge = b.buttonEl.createDiv({
                        cls: "calendarium-deleted-badge",
                    });
                    badge
                        .createSpan()
                        .setText(`${this.settings$.deletedCalendars.length}`);
                    b.onClick(() => {
                        const modal = new RestoreCalendarModal(
                            this.settings$.deletedCalendars
                        );
                        modal.onSave = async () => {
                            if (modal.item?.length) {
                                for (let calendar of modal.item) {
                                    this.settings$.deletedCalendars.remove(
                                        calendar
                                    );
                                    await this.settings$.addCalendar(calendar);
                                }
                                this.display();
                            }
                            if (modal.permanentlyDelete.length) {
                                this.settings$.deletedCalendars =
                                    this.settings$.deletedCalendars.filter(
                                        (d) =>
                                            !modal.permanentlyDelete.includes(
                                                d.id
                                            )
                                    );
                                await this.settings$.save();
                                this.display();
                            }
                        };
                        modal.open();
                    });
                });
        }

        new Setting(this.calendarsEl)
            .setName("Create new calendar")
            .addButton((button) => {
                button
                    /*                 .setIcon(QUICK_CREATOR)
                .setButtonText("Quick creator") */
                    .onClick(async () => {
                        const preset = await getPresetCalendar(this.plugin);
                        if (!preset) return;
                        const calendar = await this.launchCalendarCreator(
                            preset,
                            true
                        );
                        if (calendar) {
                            await this.plugin.addNewCalendar(calendar);
                            this.display();
                        }
                    });
                button.buttonEl.setAttr("style", "gap: 0.25rem;");
                setIcon(button.buttonEl, QUICK_CREATOR);
                button.buttonEl.createSpan().setText("Quick creator");
            })
            .addButton((button: ButtonComponent) => {
                button /* .setButtonText("Custom creator") */
                    .onClick(async () => {
                        const calendar = await this.launchCalendarCreator();
                        if (calendar) {
                            await this.plugin.addNewCalendar(calendar);
                            this.display();
                        }
                    });

                button.buttonEl.setAttr("style", "gap: 0.25rem;");
                setIcon(button.buttonEl, CUSTOM_CREATOR);
                button.buttonEl.createSpan().setText("Custom creator");
            });

        this.existingEl = this.calendarsEl.createDiv("existing-calendars");

        this.showCalendars();
    }
    showCalendars() {
        this.existingEl.empty();
        if (!this.data.calendars.length) {
            this.existingEl.createSpan({
                text: "No calendars created! Create a calendar to see it here.",
            });
            return;
        }
        for (let calendar of this.data.calendars) {
            new Setting(this.existingEl)
                .setName(calendar.name)
                .setDesc(calendar.description ?? "")
                .addExtraButton((b) => {
                    b.setIcon(QUICK_CREATOR).onClick(async () => {
                        const edited = await this.launchCalendarCreator(
                            calendar,
                            true
                        );
                        if (edited) {
                            await this.plugin.addNewCalendar(edited, calendar);
                            this.display();
                        }
                    });
                })
                .addExtraButton((b) => {
                    b.setIcon(CUSTOM_CREATOR).onClick(async () => {
                        const edited = await this.launchCalendarCreator(
                            calendar
                        );
                        if (edited) {
                            await this.plugin.addNewCalendar(edited, calendar);
                            this.display();
                        }
                    });
                })

                .addExtraButton((b) => {
                    b.setIcon(TRASH).onClick(async () => {
                        if (
                            !this.data.exit.calendar &&
                            !(await confirmDeleteCalendar(this.plugin))
                        )
                            return;

                        await this.settings$.removeCalendar(calendar);

                        this.display();
                    });
                });
        }
    }

    buildEvents(containerEl: HTMLDetailsElement) {
        containerEl.empty();
        const summary = containerEl.createEl("summary");
        containerEl.ontoggle = async () => {
            this.toggleState.event = containerEl.open;
        };
        new Setting(summary).setHeading().setName("Events management");

        setIcon(summary.createDiv("collapser").createDiv("handle"), COLLAPSE);

        const previewEnabled =
            this.app.internalPlugins.getPluginById("page-preview")?._loaded;

        new Setting(containerEl)
            .setName("Display event previews")
            .setDesc(
                createFragment((e) => {
                    e.createDiv({
                        text: "Use the core Page Preview plugin to display event notes when hovered.",
                    });
                    if (!previewEnabled) {
                        e.createDiv({
                            cls: "mod-warning",
                            text: "The Page Preview plugin is required to modify this setting.",
                        });
                    }
                })
            )
            .addToggle((t) => {
                t.setDisabled(!previewEnabled)
                    .setValue(previewEnabled && this.data.eventPreview)
                    .onChange(async (v) => {
                        this.data.eventPreview = v;
                        await this.settings$.save();
                    });
            });

        new Setting(containerEl)
            .setName("Parse note titles for event dates")
            .addToggle((t) => {
                t.setValue(this.data.parseDates).onChange(async (v) => {
                    this.data.parseDates = v;
                    await this.settings$.saveAndTrigger();
                    this.plugin.watcher.start();
                });
            });

        new Setting(containerEl).setName("Event parsing").setDesc(
            createFragment((e) => {
                const explanation = e.createDiv("explanation");
                explanation.createDiv().createSpan({
                    text: "Calendarium will find events defined in your notes. Events discovered in this way will only be added to one calendar.",
                });
                explanation.createEl("br");
                explanation.createDiv().createSpan({
                    text: "Use the following settings to match events found in a folder to a specific calendar. The most specific path (the most nested folder) will be used.",
                });
            })
        );

        new Setting(containerEl)
            .setName("Add events to default calendar")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "Add events found in notes to the default calendar if the ",
                    });
                    e.createEl("code", { text: "fc-calendar" });
                    e.createSpan({
                        text: " frontmatter tag is not present and the note is not in a defined path.",
                    });
                })
            )
            .addToggle((t) => {
                t.setValue(this.data.addToDefaultIfMissing).onChange(
                    async (v) => {
                        this.data.addToDefaultIfMissing = v;
                        await this.settings$.saveAndTrigger();
                        this.plugin.watcher.start();
                    }
                );
            });
        new Setting(containerEl)
            .setName("Inline events tag")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "Add this tag to your notes to tell Calendarium to scan them for inline ",
                    });
                    e.createEl("code", { text: "<span>" });
                    e.createSpan({
                        text: " events.",
                    });
                })
            )
            .addText((t) => {
                t.setValue(this.data.inlineEventsTag ?? "").onChange(
                    async (v) => {
                        if (!v || !v.length) {
                            this.data.inlineEventsTag = null;
                        } else {
                            this.data.inlineEventsTag = v.replace(/$#/, "");
                        }
                    }
                );
                t.inputEl.onblur = async () => {
                    await this.settings$.saveAndTrigger();
                    this.plugin.watcher.start();
                };
            });
        this.pathsEl = containerEl.createDiv("calendarium-event-paths");
        this.buildPaths();
    }
    showPaths() {
        this.eventsEl.setAttr("open", "open");
        this.pathsEl.scrollIntoView();
    }
    #needsSort = true;
    allFolders = this.app.vault
        .getAllLoadedFiles()
        .filter((f) => f instanceof TFolder);
    folders: TFolder[] = [];

    buildPaths() {
        if (this.#needsSort) {
            //sort data
            this.folders = this.allFolders.filter(
                (f): f is TFolder =>
                    !this.data.paths.find(([p]) => f.path === p)
            );
            this.data.paths.sort((a, b) => {
                return a[0].localeCompare(b[0]);
            });
            this.#needsSort = false;
        }
        this.pathsEl.empty();
        if (!this.data.calendars.length) {
            this.pathsEl.createSpan({
                cls: "no-calendars",
                text: "No calendars created! Create a calendar to use this functionality.",
            });
            return;
        }

        const pathsEl = this.pathsEl.createDiv("existing-calendars has-table");
        //build table
        const tableEl = pathsEl.createDiv("paths-table");
        for (const text of ["", "Path", "Calendar", ""]) {
            tableEl.createEl("th", { text, cls: "paths-table-header" });
        }
        for (let i = 0; i < this.data.paths.length; i++) {
            const rowEl = tableEl.createDiv("paths-table-row");
            this.buildStaticPath(rowEl, i);
        }

        /** Build the "add-new" */
        const addEl = tableEl.createDiv("paths-table-row add-new");
        const toAdd: { path: string | null; calendar: string | null } = {
            path: null,
            calendar: null,
        };
        const addIconEl = addEl.createDiv("icon");
        const pathEl = addEl.createDiv("path");
        const dropEl = addEl.createDiv("calendar");
        const actionsEl = addEl.createDiv("actions");
        const addButton = new ExtraButtonComponent(actionsEl)
            .setIcon(ADD)
            .setDisabled(true)
            .onClick(async () => {
                if (!toAdd.path || !toAdd.calendar) return;
                this.data.paths.push([toAdd.path, toAdd.calendar]);
                this.#needsSort = true;
                this.buildPaths();
                await this.settings$.saveAndTrigger();
            });
        this.buildPathInput(pathEl, addButton, addIconEl, (path) => {
            toAdd.path = path;
        });
        const drop = new DropdownComponent(dropEl);
        for (const calendar of this.data.calendars) {
            drop.addOption(calendar.id, calendar.name);
        }
        toAdd.calendar = drop.getValue();
    }
    buildStaticPath(rowEl: HTMLElement, index: number) {
        rowEl.empty();
        const [path, calendar] = this.data.paths[index];
        const maybeCal = this.data.calendars.find((c) => c.id == calendar);

        const exists =
            index > 0 &&
            this.data.paths.slice(0, index).find(([p]) => p === path) !=
                undefined;
        const iconEl = rowEl.createDiv("icon");
        if (exists) {
            rowEl.addClass("conflict");
            setIcon(
                iconEl.createDiv({
                    cls: "icon",
                    attr: {
                        "aria-tooltip":
                            "This path is registered to multiple calendars",
                    },
                }),
                WARNING
            );
        } else {
            rowEl.removeClass("conflict");
        }
        rowEl.createDiv({ text: path, cls: "path" });
        const calendarEl = rowEl.createDiv({ cls: "calendar" });
        if (!maybeCal) {
            calendarEl.addClass("mod-warning");
            calendarEl.setText("Calendar could not be found");
        } else {
            calendarEl.setText(maybeCal.name);
        }
        const actions = rowEl.createDiv("actions");
        new ExtraButtonComponent(actions).setIcon(EDIT).onClick(() => {
            this.buildEditPath(rowEl, index, path, calendar);
        });
        new ExtraButtonComponent(actions).setIcon(TRASH).onClick(async () => {
            this.data.paths.splice(index, 1);
            await this.settings$.saveAndTrigger();
            this.#needsSort = true;
            this.buildPaths();
        });
    }
    buildEditPath(
        rowEl: HTMLElement,
        index: number,
        path: string,
        calendar: string
    ) {
        rowEl.empty();
        const originalPath = path;
        const addIconEl = rowEl.createDiv("icon");
        const pathEl = rowEl.createDiv("path");
        const dropEl = rowEl.createDiv("calendar");
        const actionsEl = rowEl.createDiv("actions");
        const addButton = new ExtraButtonComponent(actionsEl)
            .setIcon(CHECK)
            .onClick(async () => {
                this.data.paths.splice(index, 1, [path, calendar]);
                await this.settings$.saveAndTrigger();
                if (path !== originalPath) {
                    this.#needsSort = true;
                    this.buildPaths();
                } else {
                    this.buildStaticPath(rowEl, index);
                }
            });

        this.buildPathInput(
            pathEl,
            addButton,
            addIconEl,
            (p) => {
                path = p;
            },
            path
        );
        const drop = new DropdownComponent(dropEl);
        for (const calendar of this.data.calendars) {
            drop.addOption(calendar.id, calendar.name);
        }
        drop.setValue(calendar).onChange((v) => {
            calendar = v;
        });
        new ExtraButtonComponent(actionsEl).setIcon(CLOSE).onClick(() => {
            this.buildStaticPath(rowEl, index);
        });
    }
    buildPathInput(
        inputEl: HTMLElement,
        addButton: ExtraButtonComponent,
        iconEl: HTMLElement,
        callback: (path: string) => void,
        originalPath: string = "Folder"
    ) {
        const validateAndSend = (path: string) => {
            if (
                !path ||
                !path.length ||
                this.data.paths.find(([p]) => path == p)
            ) {
                addButton.setDisabled(true);
                setIcon(iconEl, WARNING);
                return false;
            }
            addButton.setDisabled(false);
            iconEl.empty();
            callback(normalizePath(path));
        };
        const text = new TextComponent(inputEl)
            .setPlaceholder(originalPath)
            .onChange((path) => {
                /** Validate no existing paths... */
                validateAndSend(path);
            });
        /* const modal = new FolderSuggestionModal(this.app, text, [
            ...this.folders,
        ]);

        modal.onClose = async () => {
            const path = text.inputEl.value?.trim()
                ? text.inputEl.value.trim()
                : "/";
            validateAndSend(path);
        }; */

        const modal = new FolderInputSuggest(this.app, text, [...this.folders]);

        modal.onSelect(async (value) => {
            modal.close();
            modal.setValue(value.item.path);
            validateAndSend(value.item.path);
        });
    }
    buildAdvanced(containerEl: HTMLDetailsElement) {
        containerEl.empty();
        const summary = containerEl.createEl("summary");
        containerEl.ontoggle = async () => {
            this.toggleState.advanced = containerEl.open;
        };
        new Setting(summary).setHeading().setName("Advanced");

        setIcon(summary.createDiv("collapser").createDiv("handle"), COLLAPSE);

        new Setting(containerEl)
            .setName(`Reset "Don't ask again" prompts`)
            .setDesc(
                `All confirmations set to "Don't Ask Again" will be reset.`
            )
            .addButton((b) => {
                b.setIcon(RESET).onClick(async () => {
                    this.data.exit = {
                        saving: false,
                        event: false,
                        calendar: false,
                        savingEvent: false,
                    };
                    await this.settings$.save();
                });
            });
        new Setting(containerEl)
            .setName(`Settings sync behavior`)
            .setDesc(
                `Control how the plugin reloads data when a sync is detected.`
            )
            .addDropdown((d) => {
                d.addOption(SyncBehavior.Ask, "Continue asking")
                    .addOption(SyncBehavior.Always, "Always reload")
                    .addOption(SyncBehavior.Never, "Never reload")
                    .setValue(this.data.syncBehavior)
                    .onChange(async (v) => {
                        this.data.syncBehavior = v as SyncBehavior;
                        await this.settings$.save();
                    });
            });

        new Setting(containerEl)
            .setName("Show event debug messages")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "The plugin will show debug messages when events are added, deleted or updated by the file watcher.",
                    });
                })
            )
            .addToggle((t) => {
                t.setValue(this.data.debug).onChange(async (v) => {
                    this.data.debug = v;
                    await this.settings$.save();
                });
            });
    }

    launchCalendarCreator(
        calendar: Calendar | PresetCalendar = DEFAULT_CALENDAR,
        quick = false
    ): Promise<Calendar | void> {
        /* this.containerEl.empty(); */
        const clone = copy(calendar) as Calendar;
        const original = calendar.id;
        clone.id = `${nanoid(10)}`;
        if (!clone.name) {
            clone.name = "";
        }

        /* if (Platform.isMobile) { */
        const modal = new CreatorModal(this.plugin, clone, quick);
        return new Promise((resolve, reject) => {
            try {
                modal.onClose = () => {
                    if (modal.saved) {
                        calendar = copy(modal.calendar);
                        if (original) calendar.id = original;
                        resolve({
                            ...calendar,
                            id: calendar.id ?? nanoid(8),
                            name: calendar.name ?? "New Calendar",
                            current: {
                                day: calendar.current.day ?? 1,
                                month: calendar.current.month ?? 0,
                                year: calendar.current.year ?? 1,
                            },
                        });
                    }
                    resolve();
                };

                modal.open();
            } catch (e) {
                reject();
            }
        });
        /* } else {
            this.containerEl.addClass("calendarium-creator-open");
            return new Promise((resolve) => {
                const color = getComputedStyle(
                    this.containerEl.closest(".modal")
                ).backgroundColor;
                const $app = new CalendarCreator({
                    target: this.containerEl,
                    props: {
                        base: clone,
                        plugin: this.plugin,
                        width: this.contentEl.clientWidth,
                        color,
                        top: this.containerEl.scrollTop,
                    },
                });
                const observer = new ResizeObserver(() => {
                    $app.$set({ width: this.contentEl.clientWidth });
                });
                observer.observe(this.contentEl);
                $app.$on(
                    "exit",
                    (
                        evt: CustomEvent<{ saved: boolean; calendar: Calendar }>
                    ) => {
                        this.containerEl.removeClass(
                            "calendarium-creator-open"
                        );
                        $app.$destroy();
                        if (evt.detail.saved) {
                            //saved
                            calendar = copy(evt.detail.calendar);
                            observer.disconnect();
                            resolve(calendar);
                        }
                        resolve();
                    }
                );
            });
        } */
    }
}

class CreatorModal extends CalendariumModal {
    calendar: Calendar;
    saved = false;
    store: CreatorStore;
    $app: CreatorController;
    constructor(
        public plugin: Calendarium,
        calendar: Calendar,
        public quick = false
    ) {
        super(plugin.app);
        this.modalEl.addClass("calendarium-creator");
        this.modalEl.addClasses(["mod-sidebar-layout", "mod-settings"]);
        this.contentEl.addClass("vertical-tabs-container");
        this.calendar = copy(calendar);
        this.store = createStore(this.plugin, this.calendar);
        this.scope.register([Platform.isMacOS ? "Meta" : "Ctrl"], "z", () => {
            if (get(this.store.canUndo)) this.store.undo();
        });
        this.scope.register([Platform.isMacOS ? "Meta" : "Ctrl"], "y", () => {
            if (get(this.store.canRedo)) this.store.redo();
        });
    }
    async checkCanExit() {
        if (get(this.store.valid)) return true;
        if (this.plugin.data.exit.saving) return true;
        return new Promise((resolve) => {
            const modal = new ConfirmExitModal(this.plugin);
            modal.onClose = () => {
                resolve(modal.confirmed);
            };
            modal.open();
        });
    }
    async close() {
        if (await this.checkCanExit()) {
            this.saved = get(this.store.valid);
            this.calendar = get(this.store);
            super.close();
        }
    }
    async display() {
        this.$app = new CreatorController({
            target: this.contentEl,
            props: {
                store: this.store,
                plugin: this.plugin,
                top: 0,
                quick: this.quick,
            },
        });
        this.$app.$on("cancel", () => {
            this.saved = false;
            super.close();
        });
    }
}
