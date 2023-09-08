import {
    addIcon,
    ButtonComponent,
    Modal,
    Notice,
    Platform,
    PluginSettingTab,
    setIcon,
    Setting,
    TFolder,
} from "obsidian";

import copy from "fast-copy";

import type Calendarium from "../main";
import Importer from "./import/importer";

import CalendarCreator from "./creator/Creator.svelte";

import type { Calendar } from "src/@types";

import {
    confirmDeleteCalendar,
    ConfirmExitModal,
    confirmWithModal,
} from "./modals/confirm";
import { FolderSuggestionModal } from "src/suggester/folder";
import { CalendariumModal } from "./modals/modal";
import { get, Writable } from "svelte/store";
import createStore from "./creator/stores/calendar";
import { DEFAULT_CALENDAR } from "./settings.constants";
import { nanoid } from "src/utils/functions";
import { getMissingNotice, warning } from "./creator/Utilities/utils";

export enum Recurring {
    none = "None",
    monthly = "Monthly",
    yearly = "Yearly",
}
interface Context {
    store: ReturnType<typeof createStore>;
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
        };
    }
}

addIcon(
    "calendarium-grip",
    `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="grip-lines" class="svg-inline--fa fa-grip-lines fa-w-16" role="img" viewBox="0 0 512 512"><path fill="currentColor" d="M496 288H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h480c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm0-128H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h480c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16z"/></svg>`
);

addIcon(
    "calendarium-warning",
    `<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="exclamation-triangle" class="svg-inline--fa fa-exclamation-triangle fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"></path></svg>`
);

export default class CalendariumSettings extends PluginSettingTab {
    contentEl: HTMLDivElement;
    calendarsEl: HTMLDetailsElement;
    existingEl: HTMLDivElement;
    get data() {
        return this.plugin.data;
    }
    constructor(public plugin: Calendarium) {
        super(plugin.app, plugin);
    }
    async display() {
        this.containerEl.empty();
        this.containerEl.createEl("h2", { text: "Calendarium" });
        this.containerEl.addClass("calendarium-settings");
        this.contentEl = this.containerEl.createDiv(
            "calendarium-settings-content"
        );

        this.buildInfo(this.contentEl.createDiv("calendarium-nested-settings"));
        this.calendarsEl = this.contentEl.createEl("details", {
            cls: "calendarium-nested-settings",
            attr: {
                ...(this.data.settingsToggleState.calendars
                    ? { open: `open` }
                    : {}),
            },
        });
        this.buildCalendars();
        this.buildEvents(
            this.contentEl.createEl("details", {
                cls: "calendarium-nested-settings",
                attr: {
                    ...(this.data.settingsToggleState.events
                        ? { open: `open` }
                        : {}),
                },
            })
        );
        this.buildAdvanced(
            this.contentEl.createEl("details", {
                cls: "calendarium-nested-settings",
                attr: {
                    ...(this.data.settingsToggleState.advanced
                        ? { open: `open` }
                        : {}),
                },
            })
        );
    }
    buildInfo(containerEl: HTMLElement) {
        containerEl.empty();

        new Setting(containerEl)
            .setName(`Reset "Don't Ask Again" Prompts`)
            .setDesc(
                `All confirmations set to "Don't Ask Again" will be reset.`
            )
            .addButton((b) => {
                b.setIcon("reset").onClick(async () => {
                    this.plugin.data.exit = {
                        saving: false,
                        event: false,
                        calendar: false,
                    };
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName(
                createFragment((e) => {
                    const span = e.createSpan("calendarium-warning");
                    setIcon(
                        span.createSpan("calendarium-warning"),
                        "calendarium-warning"
                    );
                    span.createSpan({ text: "Default Config Directory" });
                })
            )
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "Please back up your data before changing this setting. Hidden directories must be manually entered.",
                    });
                    e.createEl("br");
                    e.createSpan({
                        text: `Current directory: `,
                    });
                    const configDirectory =
                        this.data.configDirectory ?? this.app.vault.configDir;
                    e.createEl("code", {
                        text: configDirectory,
                    });
                })
            )
            .addText(async (text) => {
                let folders = this.app.vault
                    .getAllLoadedFiles()
                    .filter((f) => f instanceof TFolder);

                text.setPlaceholder(
                    this.data.configDirectory ?? this.app.vault.configDir
                );
                const modal = new FolderSuggestionModal(this.app, text, [
                    ...(folders as TFolder[]),
                ]);

                modal.onClose = async () => {
                    if (!text.inputEl.value) {
                        this.data.configDirectory = null;
                    } else {
                        const exists = await this.app.vault.adapter.exists(
                            text.inputEl.value
                        );

                        if (!exists) {
                            this.data.configDirectory = text.inputEl.value;
                            await this.plugin.saveSettings();
                        }
                    }
                };

                text.inputEl.onblur = async () => {
                    if (!text.inputEl.value) {
                        return;
                    }
                    const exists = await this.app.vault.adapter.exists(
                        text.inputEl.value
                    );

                    this.data.configDirectory = text.inputEl.value;

                    await this.plugin.saveSettings();
                    this.display();
                };
            })
            .addExtraButton((b) => {
                b.setTooltip("Reset to Default")
                    .setIcon("reset")
                    .onClick(async () => {
                        this.data.configDirectory = null;
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });
    }
    buildCalendars() {
        this.calendarsEl.empty();
        this.calendarsEl.ontoggle = () => {
            this.data.settingsToggleState.calendars = this.calendarsEl.open;
        };
        const summary = this.calendarsEl.createEl("summary");
        new Setting(summary).setHeading().setName("Calendar Management");

        setIcon(
            summary.createDiv("collapser").createDiv("handle"),
            "chevron-right"
        );

        new Setting(this.calendarsEl)
            .setName("Show Intercalary Months Separately")
            .setDesc(
                "Intercalary months will appear a distinct months in the calendar."
            )
            .addToggle((t) => {
                t.setValue(this.data.showIntercalary).onChange(async (v) => {
                    this.data.showIntercalary = v;
                    await this.plugin.saveCalendars();
                });
            });
        new Setting(this.calendarsEl)
            .setName("Default Calendar")
            .setDesc("Views will open to this calendar by default.")
            .addDropdown((d) => {
                d.addOption("none", "None");
                for (let calendar of this.data.calendars) {
                    d.addOption(calendar.id, calendar.name);
                }
                d.setValue(this.plugin.data.defaultCalendar);
                d.onChange(async (v) => {
                    if (v === "none") {
                        this.plugin.data.defaultCalendar = null;
                        await this.plugin.saveSettings();
                        return;
                    }

                    this.plugin.data.defaultCalendar = v;
                    await this.plugin.saveSettings();
                    this.plugin.watcher.start();
                });
            });
        new Setting(this.calendarsEl)
            .setName("Import Calendar")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "Import calendar from ",
                    });
                    e.createEl("a", {
                        href: "https://app.calendarium.com",
                        text: "Calendarium",
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

                    if (!files.length) return;
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

                    input.value = null;
                };
                b.setButtonText("Choose Files");
                b.buttonEl.addClass("calendar-file-upload");
                b.buttonEl.appendChild(input);
                b.onClick(() => input.click());
            });

        new Setting(this.calendarsEl)
            .setName("Create New Calendar")
            .addButton((button: ButtonComponent) =>
                button
                    .setTooltip("Launch Calendar Creator")
                    .setIcon("plus-with-circle")
                    .onClick(async () => {
                        const calendar = await this.launchCalendarCreator();
                        if (calendar) {
                            await this.plugin.addNewCalendar(calendar);
                            this.display();
                        }
                    })
            );

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
                    b.setIcon("pencil").onClick(async () => {
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
                    b.setIcon("trash").onClick(async () => {
                        if (
                            !this.plugin.data.exit.calendar &&
                            !(await confirmDeleteCalendar(this.plugin))
                        )
                            return;

                        this.plugin.data.calendars =
                            this.plugin.data.calendars.filter(
                                (c) => c.id != calendar.id
                            );
                        if (calendar.id == this.data.defaultCalendar) {
                            this.plugin.data.defaultCalendar =
                                this.plugin.data.calendars[0]?.id;
                            this.plugin.watcher.start();
                        }
                        await this.plugin.saveCalendars();

                        this.display();
                    });
                });
        }
    }

    buildEvents(containerEl: HTMLDetailsElement) {
        containerEl.empty();
        containerEl.ontoggle = () => {
            this.data.settingsToggleState.events = containerEl.open;
        };
        const summary = containerEl.createEl("summary");
        new Setting(summary).setHeading().setName("Events");

        setIcon(
            summary.createDiv("collapser").createDiv("handle"),
            "chevron-right"
        );

        new Setting(containerEl)
            .setName("Add Events to Default Calendar")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "Add events found in notes to the default calendar if the ",
                    });
                    e.createEl("code", { text: "fc-calendar" });
                    e.createSpan({ text: " frontmatter tag is not present." });
                })
            )
            .addToggle((t) => {
                t.setValue(this.data.addToDefaultIfMissing).onChange(
                    async (v) => {
                        this.data.addToDefaultIfMissing = v;
                        await this.plugin.saveSettings();
                        this.plugin.watcher.start();
                    }
                );
            });
        new Setting(containerEl)
            .setName("Display Event Previews")
            .setDesc(
                "Use the core Note Preview plugin to display event notes when hovered."
            )
            .addToggle((t) => {
                t.setValue(this.data.eventPreview).onChange(async (v) => {
                    this.data.eventPreview = v;
                    await this.plugin.saveSettings();
                });
            });
        new Setting(containerEl)
            .setName("Write Event Data to Frontmatter")
            .setDesc("This setting is temporarily disabled.")
            .addToggle((t) => {
                t.setValue(false)
                    .setDisabled(true)
                    .onChange(async (v) => {
                        this.data.eventFrontmatter = v;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("Parse Note Titles for Event Dates")
            .setDesc("The plugin will parse note titles for event dates.")
            .addToggle((t) => {
                t.setValue(this.data.parseDates).onChange(async (v) => {
                    this.data.parseDates = v;
                    await this.plugin.saveSettings();
                    this.plugin.watcher.start();
                });
            });
        new Setting(containerEl)
            .setName("Date Format")
            .setClass(this.data.dailyNotes ? "daily-notes" : "no-daily-notes")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "Event dates will be parsed using this format.",
                    });
                    e.createSpan({ text: "Only the " });
                    e.createEl("code", { text: "Y" });
                    e.createSpan({
                        text: ", ",
                    });
                    e.createEl("code", { text: "M" });
                    e.createSpan({
                        text: ", and ",
                    });
                    e.createEl("code", { text: "D" });
                    e.createEl("a", {
                        text: "tokens",
                        href: "https://momentjs.com/docs/#/displaying/format/",
                        cls: "external-link",
                    });
                    e.createSpan({
                        text: " are supported.",
                    });
                    if (
                        ["Y", "M", "D"].some(
                            (token) => !this.data.dateFormat.includes(token)
                        )
                    ) {
                        e.createEl("br");
                        const span = e.createSpan({
                            cls: "calendarium-warning date-format",
                        });
                        setIcon(
                            span.createSpan("calendarium-warning"),
                            "calendarium-warning"
                        );
                        let missing = ["Y", "M", "D"].filter(
                            (token) => !this.data.dateFormat.includes(token)
                        );
                        span.createSpan({
                            text: ` Date format is missing: ${missing
                                .join(", ")
                                .replace(/, ([^,]*)$/, " and $1")}`,
                        });
                    }
                })
            )
            .addText((t) => {
                t.setDisabled(this.data.dailyNotes)
                    .setValue(this.plugin.format)
                    .onChange(async (v) => {
                        this.data.dateFormat = v;
                        await this.plugin.saveSettings();
                    });
                t.inputEl.onblur = () => this.buildEvents(containerEl);
            })
            .addExtraButton((b) => {
                if (!this.plugin.canUseDailyNotes) {
                    b.extraSettingsEl.detach();
                    return;
                }
                if (this.data.dailyNotes) {
                    b.setIcon("checkmark")
                        .setTooltip("Unlink from Daily Notes")
                        .onClick(() => {
                            this.data.dailyNotes = false;
                            this.buildEvents(containerEl);
                        });
                } else {
                    b.setIcon("sync")
                        .setTooltip("Link with Daily Notes")
                        .onClick(() => {
                            this.data.dailyNotes = true;
                            this.buildEvents(containerEl);
                        });
                }
            });
    }
    buildAdvanced(containerEl: HTMLDetailsElement) {
        containerEl.empty();
        containerEl.ontoggle = () => {
            this.data.settingsToggleState.advanced = containerEl.open;
        };
        const summary = containerEl.createEl("summary");
        new Setting(summary).setHeading().setName("Advanced");

        setIcon(
            summary.createDiv("collapser").createDiv("handle"),
            "chevron-right"
        );

        new Setting(containerEl)
            .setName("Show Event Debug Messages")
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
                    await this.plugin.saveSettings();
                });
            });
    }

    launchCalendarCreator(
        calendar: Calendar = DEFAULT_CALENDAR
    ): Promise<Calendar | void> {
        /* this.containerEl.empty(); */
        const clone = copy(calendar);
        const original = calendar.id;
        clone.id = `${nanoid(10)}`;

        /* if (Platform.isMobile) { */
        const modal = new CreatorModal(this.plugin, clone);
        return new Promise((resolve, reject) => {
            try {
                modal.onClose = () => {
                    if (modal.saved) {
                        calendar = copy(modal.calendar);
                        calendar.id = original;
                        resolve(calendar);
                    }
                    resolve();
                };

                modal.open();
            } catch (e) {
                reject();
            }
        });
    }
}

class CreatorModal extends CalendariumModal {
    calendar: Calendar;
    saved = false;
    store: ReturnType<typeof createStore>;
    $app: CalendarCreator;
    valid: boolean;
    constructor(public plugin: Calendarium, calendar: Calendar) {
        super(plugin.app);
        this.modalEl.addClass("calendarium-creator");
        this.calendar = copy(calendar);
        this.store = createStore(this.plugin, this.calendar);
        this.valid = get(this.store.valid);
    }
    async checkCanExit() {
        if (this.valid) return true;
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
            this.saved = this.valid;
            this.calendar = get(this.store);
            super.close();
        }
    }
    setTitle() {
        this.titleEl.setText(
            createFragment((e) => {
                e.createSpan({ text: "Calendar Creator" });
                e.createEl("br");
                const additional = e.createSpan("check");
                if (this.valid) {
                    setIcon(
                        additional.createSpan("save can-save"),
                        "checkmark"
                    );
                    additional.createSpan({
                        cls: "additional can-save",
                        text: "All good! Exit to save calendar.",
                    });
                } else {
                    warning(
                        additional.createSpan({
                            cls: "save",
                            attr: {
                                "aria-label": getMissingNotice(get(this.store)),
                            },
                        })
                    );
                    additional.createSpan({
                        cls: "additional",
                        text: "Additional information is required to save.",
                    });
                }
            })
        );
    }
    async display() {
        this.modalEl.onscroll = () => console.trace();
        this.setTitle();
        this.store.valid.subscribe((v) => {
            if (v == this.valid) return;
            this.valid = v;
            this.setTitle();
        });

        this.$app = new CalendarCreator({
            target: this.contentEl,
            props: {
                store: this.store,
                plugin: this.plugin,
                width: this.contentEl.clientWidth,
                top: 0,
            },
        });
    }
}
