import {
    ButtonComponent,
    DropdownComponent,
    Notice,
    PluginManifest,
    parseYaml,
    setIcon,
} from "obsidian";
import type {
    Calendar,
    CalendariumData,
    MarkdownCalendariumData,
} from "src/@types";
import { DEFAULT_DATA } from "./settings.constants";
import merge from "deepmerge";
import { nanoid } from "src/utils/functions";
import Calendarium from "src/main";
import copy from "fast-copy";
import { CalendariumNotice } from "src/utils/notice";
import { calendariumDataSchema, SyncBehavior } from "src/schemas";

const SPLITTER = "--- BEGIN DATA ---";
const HEADER = `This file is used by Calendarium to manage its data.

Please do not modify this file directly or you could corrupt the plugin data.

${SPLITTER}
`;

export default class SettingsService {
    loaded = false;
    config_path: string;
    #prompting: boolean;
    #saving: any;
    get app() {
        return this.plugin.app;
    }
    get adapter() {
        return this.app.vault.adapter;
    }

    #data: CalendariumData;
    public getData() {
        return this.#data;
    }
    public getCalendars() {
        return this.#data.calendars;
    }
    get path() {
        return this.manifest.dir + "/" + SettingsService.DataFile;
    }
    private layoutReady = false;
    constructor(private plugin: Calendarium, public manifest: PluginManifest) {
        this.app.workspace.onLayoutReady(() => (this.layoutReady = true));
        this.onLayoutReadyAndSettingsLoad(() => {
            setTimeout(() => this.checkFCSettings(), 2000);
        });
    }
    public async onLayoutReadyAndSettingsLoad(callback: () => any) {
        if (this.loaded && this.layoutReady) {
            callback();
        } else if (this.layoutReady) {
            this.onSettingsLoaded(callback);
        } else {
            this.app.workspace.onLayoutReady(() =>
                this.onSettingsLoaded(callback)
            );
        }
    }
    public async onSettingsLoaded(callback: () => any) {
        if (this.loaded) {
            callback();
        } else {
            this.plugin.registerEvent(
                this.app.workspace.on("calendarium-settings-loaded", () =>
                    callback()
                )
            );
        }
    }
    public async onExternalSettingsChange() {
        if (this.#saving) {
            setTimeout(() => {
                this.#saving = false;
            }, 500);
            return;
        }
        if (this.#data.syncBehavior === "Never") {
            return;
        }
        if (this.#data.syncBehavior === "Always") {
            await this.loadData(true);
            return;
        }
        if (this.#prompting) return;
        this.#prompting = true;
        console.trace();
        const prompt = async () => {
            if (this.#data.askedAboutSync && this.#data.syncBehavior !== "Ask")
                return;
            if (!this.#data.askedAboutSync) {
                this.#data.askedAboutSync = true;
                await this.saveData();
            }
            const notice = new CalendariumNotice(
                createFragment((f) => {
                    const c = f.createDiv("calendarium-notice");
                    c.createEl("h4", {
                        text: "Calendarium",
                        cls: "calendarium-header",
                    });
                    const e = c.createDiv();
                    e.createSpan({
                        text: "How should Calendarium reload your data in the future?",
                    });
                    e.createEl("br");
                    e.createEl("br");
                    e.createSpan({
                        text: "This behavior can be changed in settings.",
                    });
                    e.createEl("br");
                    const b = e.createDiv("calendarium-notice-buttons");
                    const drop = new DropdownComponent(b)
                        .addOption(SyncBehavior.enum.Ask, "Continue Asking")
                        .addOption(SyncBehavior.enum.Always, "Always Reload")
                        .addOption(SyncBehavior.enum.Never, "Never Reload")
                        .setValue(this.#data.syncBehavior)
                        .onChange(async (v: SyncBehavior) => {
                            this.#data.syncBehavior = v;
                            await this.saveData();
                            notice.hide();
                        });
                    drop.selectEl.setAttr("tabindex", 99);
                    drop.selectEl.focus();
                    drop.selectEl.onClickEvent((e) => e.stopPropagation());
                }),
                0
            );
            this.plugin.registerNotice(notice);
        };

        const notice = new CalendariumNotice(
            createFragment((f) => {
                const c = f.createDiv("calendarium-notice");
                c.createEl("h4", {
                    text: "Calendarium",
                    cls: "calendarium-header",
                });
                const e = c.createDiv();
                e.createSpan({
                    text: "Your settings have been changed externally (e.g., from sync). Would you like to reload Calendarium settings?",
                });
                e.createEl("br");
                e.createEl("br");
                const b = e.createDiv("calendarium-notice-buttons");
                new ButtonComponent(b).setButtonText("Cancel").onClick(() => {
                    notice.hide();
                });
                new ButtonComponent(b)
                    .setButtonText("Reload Data")
                    .setCta()
                    .onClick(async (evt) => {
                        evt.stopPropagation();
                        e.empty();
                        const migrating = e.createDiv("calendarium-migrating");
                        setIcon(
                            migrating.createDiv("migrating-icon rotating"),
                            "loader-2"
                        );
                        migrating.createSpan({ text: "Reloading data..." });
                        const start = Date.now();
                        await this.loadData(true);
                        setTimeout(() => {
                            migrating.empty();
                            setIcon(
                                migrating.createDiv("migrating-icon"),
                                "check"
                            );
                            migrating.createSpan({
                                text: "Calendarium data reloaded.",
                            });
                            setTimeout(() => {
                                notice.hide();
                            }, 1000);
                        }, Math.max(2000 - (Date.now() - start), 0));
                    });
            }),
            0
        );
        this.plugin.registerNotice(notice);
        notice.registerOnHide(() => {
            this.#prompting = false;
            prompt();
        });
    }
    get version() {
        const split = this.manifest.version.split(".");
        return {
            major: Number(split[0]),
            minor: Number(split[1]),
            patch: split[2],
        };
    }
    public async saveData(data: CalendariumData = this.#data) {
        this.#saving = true;
        this.#data = data;
        this.#data.version = this.version;
        await this.plugin.saveData(data);
        this.plugin.app.workspace.trigger("calendarium-settings-change");
        await this.guardFile();
        /* await this.adapter.write(this.path, this.transformData(this.#data)); */
    }

    public async loadData(external?: boolean) {
        await this.load();
        this.loaded = true;
        this.app.workspace.trigger("calendarium-settings-loaded");
        if (external)
            this.app.workspace.trigger("calendarium-settings-external-load");
    }
    private async load() {
        const pluginData: unknown | CalendariumData =
            (await this.plugin.loadData()) ?? {};
        if (!pluginData || !Object.keys(pluginData).length) {
            await this.saveData(copy(DEFAULT_DATA));
            return;
        }
        /** Check to see if the data has been transitioned to the new config file / calendar files. */
        if (
            /** Plugin data is not null. */
            pluginData &&
            typeof pluginData == "object" &&
            /** There are some keys in the data. */
            "transitioned" in pluginData
        ) {
            /** Plugin data is in markdown format. Load it, then transition it to new format. */
            await this.transitionMarkdownSettings();
            return;
        }
        /**
         * At this point, pluginData should be CalendariumData, but should be validated.
         */
        const parsed = calendariumDataSchema.safeParse(pluginData);
        let data: CalendariumData | null = null;
        if (!parsed.success) {
            console.debug(
                "Calendarium data did not pass validation. Merging existing data with defaults." +
                    "\n\n" +
                    parsed.error
            );
            try {
                data = merge(
                    DEFAULT_DATA,
                    pluginData as any as Partial<CalendariumData>
                );
            } catch (e) {}
        } else {
            data = parsed.data;
        }
        if (!data) data = copy(DEFAULT_DATA);
        let dirty = this.updateDataToNewSchema(data);
        if (dirty) {
            await this.saveData(data);
        } else {
            this.#data = data;
        }
    }
    public async saveCalendars() {
        this.app.workspace.trigger("calendarium-updated");
    }
    public async loadCalendar() {}

    private async guardFile() {
        if (!(await this.adapter.exists(this.plugin.configDir))) {
            await this.adapter.mkdir(this.plugin.configDir);
        }
    }
    #asking = false;
    private async checkFCSettings() {
        if (this.#data.askedToMoveFC) return;

        if (!this.app.plugins.plugins["fantasy-calendar"]) return;
        if (this.#asking) return;
        this.#asking = true;
        const notice = new CalendariumNotice(
            createFragment((f) => {
                const c = f.createDiv("calendarium-notice");
                c.createEl("h4", {
                    text: "Calendarium",
                    cls: "calendarium-header",
                });
                const e = c.createDiv();
                e.createSpan({
                    text: "Would you like to migrate your existing Fantasy Calendar settings to Calendarium?",
                });
                e.createEl("br");
                e.createEl("br");
                const b = e.createDiv("calendarium-notice-buttons");
                new ButtonComponent(b).setButtonText("Cancel").onClick(() => {
                    this.#data.askedToMoveFC = true;
                });
                new ButtonComponent(b)
                    .setButtonText("Migrate")
                    .setCta()
                    .onClick(async (evt) => {
                        evt.stopPropagation();
                        e.empty();
                        const migrating = e.createDiv("calendarium-migrating");
                        setIcon(
                            migrating.createDiv("migrating-icon rotating"),
                            "loader-2"
                        );
                        migrating.createSpan({ text: "Migrating..." });
                        const start = Date.now();
                        await this.migrateFCData();
                        setTimeout(() => {
                            migrating.empty();
                            setIcon(
                                migrating.createDiv("migrating-icon"),
                                "check"
                            );
                            migrating.createSpan({
                                text: "Fantasy Calendar settings migrated.",
                            });
                            setTimeout(() => {
                                notice.hide();
                            }, 2000);
                        }, Math.max(2000 - (Date.now() - start), 0));
                    });
            }),
            0
        );
        notice.registerOnHide(() => (this.#asking = false));
        this.plugin.registerNotice(notice);

        return;
    }
    private async transitionMarkdownSettings() {
        let data: MarkdownCalendariumData | null = null;
        let markdownPath = this.manifest.dir + "/" + SettingsService.DataFile;
        if (await this.adapter.exists(markdownPath)) {
            const contents = (
                (await this.adapter.read(markdownPath)).split(SPLITTER).pop() ??
                ""
            ).trim();
            data =
                contents && contents.length
                    ? parseYaml(contents)
                    : copy(DEFAULT_DATA);
        }
        if (!data) data = copy(DEFAULT_DATA);

        await this.updateCalendarsToNewSchema(data?.calendars ?? []);
        await this.saveData(data);
    }
    private updateCalendarsToNewSchema(calendars: Calendar[]): boolean {
        let dirty = false;
        for (const calendar of calendars) {
            if (!calendar.id) {
                calendar.id = `${nanoid(10)}`;
                dirty = true;
            }
            if (!calendar.path) {
                calendar.path = [];
                dirty = true;
            } else if (!Array.isArray(calendar.path)) {
                calendar.path = [calendar.path];
                dirty = true;
            }
            for (const month of calendar.static?.months) {
                if (month.interval == undefined) {
                    month.interval = 1;
                    dirty = true;
                }
                if (month.offset == undefined) {
                    month.offset = 0;
                    dirty = true;
                }
            }
            for (const event of calendar.events) {
                if (event.sort == undefined) {
                    event.sort = {
                        timestamp: Number.MIN_VALUE,
                        order: "",
                    };
                    dirty = true;
                }
            }
        }
        return dirty;
    }
    private updateDataToNewSchema(
        data: MarkdownCalendariumData | CalendariumData
    ) {
        let dirty = this.updateCalendarsToNewSchema(data.calendars);
        if (!data.defaultCalendar && data.calendars.length) {
            data.defaultCalendar = data.calendars[0].id;
            dirty = true;
        }
        if (
            data.calendars.length &&
            !data.calendars.find((cal) => cal.id == data.defaultCalendar)
        ) {
            data.defaultCalendar = data.calendars[0].id;
            dirty = true;
        }
        return dirty;
    }
    private async migrateFCData() {
        //transform data;
        let fcData: CalendariumData;
        if (
            await this.adapter.exists(
                ".obsidian/plugins/fantasy-calendar/_data.md"
            )
        ) {
            const contents = (
                (
                    await this.adapter.read(
                        ".obsidian/plugins/fantasy-calendar/_data.md"
                    )
                )
                    .split(SPLITTER)
                    .pop() ?? ""
            ).trim();
            fcData = parseYaml(contents);
        } else {
            fcData = await this.app.plugins.plugins[
                "fantasy-calendar"
            ].loadData();
        }
        const data = merge(DEFAULT_DATA, fcData ?? {});
        data.askedToMoveFC = true;
        await this.updateDataToNewSchema(data);
        await this.saveData(data);
        this.saveCalendars();
    }
    static DataFile = "_data.md";
}
