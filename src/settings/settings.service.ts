import {
    ButtonComponent,
    Notice,
    PluginManifest,
    parseYaml,
    setIcon,
    stringifyYaml,
} from "obsidian";
import type {
    Calendar,
    CalendariumData,
    FullCalendariumData,
    MarkdownCalendariumData,
} from "src/@types";
import { DEFAULT_DATA } from "./settings.constants";
import merge from "deepmerge";
import { nanoid } from "src/utils/functions";
import Calendarium from "src/main";
import copy from "fast-copy";
import { around } from "monkey-around";

const SPLITTER = "--- BEGIN DATA ---";

export default class SettingsService {
    loaded = false;
    config_path = this.plugin.manifest.dir;
    get config_file() {
        return this.config_path + "/" + SettingsService.ConfigFile;
    }

    get app() {
        return this.plugin.app;
    }
    get adapter() {
        return this.app.vault.adapter;
    }

    #data: FullCalendariumData;
    public getData() {
        return this.#data;
    }
    public getCalendars() {
        return this.#data.calendars;
    }
    public async getDeletedCalendars() {
        const folders =
            (await this.adapter.list(this.config_path + "/calendars"))
                ?.folders ?? [];
        const deletedCalendars: Calendar[] = [];
        for (const folder of folders) {
            const id = folder.split("/").pop();
            if (!(await this.adapter.exists(`${folder}/${id}.json`))) continue;

            const calendar = JSON.parse(
                await this.adapter.read(`${folder}/${id}.json`)
            );
            if (!calendar.deleted) continue;

            deletedCalendars.push(calendar);
        }
        return deletedCalendars;
    }
    get MARKDOWN_PATH() {
        return this.manifest.dir + "/" + SettingsService.DataFile;
    }
    private layoutReady = false;
    constructor(private plugin: Calendarium, public manifest: PluginManifest) {
        this.app.workspace.onLayoutReady(() => (this.layoutReady = true));
        this.onLayoutReadyAndSettingsLoad(async () => {
            this.checkSettings();
            await this.getDeletedCalendars();
        });
    }
    public async onLayoutReadyAndSettingsLoad(callback: () => any) {
        if (this.loaded && this.layoutReady) {
            callback();
        } else if (this.layoutReady) {
            this.onSettingsLoaded(callback);
        } else {
            this.app.workspace.onLayoutReady(() => callback());
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
    get version() {
        const split = this.manifest.version.split(".");
        return {
            major: Number(split[0]),
            minor: Number(split[1]),
            patch: split[2],
        };
    }
    public async saveConfigPath(path = this.plugin.manifest.dir) {
        this.config_path = path;
        //@ts-ignore
        console.log(this.plugin._lastDataModifiedTime);
        await this.plugin.saveData({
            config: path,
            lastSave: Date.now(),
        });
    }
    public async saveData(data: FullCalendariumData = this.#data) {
        if (!data) data = copy(DEFAULT_DATA);
        this.#data = data;
        this.plugin.app.workspace.trigger("calendarium-settings-change");
        await this.guardFolder();
        this.#data.version = this.version;
        for (const calendar of data.calendars) {
            await this.saveCalendar(calendar);
        }
        const transformed: CalendariumData = { ...copy(data), calendars: [] };
        transformed.calendars = data.calendars.map((c) => c.id);
        await this.adapter.write(this.config_file, JSON.stringify(transformed));
        await this.saveConfigPath();
    }

    public async loadData() {
        /** First, load the base data.json file. */
        const pluginData: { transitioned?: boolean; config?: string } =
            await this.plugin.loadData();
        /** Check to see if the data has been transitioned to the new config file / calendar files. */
        if (
            /** Plugin data is not null. */
            pluginData &&
            /** There are some keys in the data. */
            Object.keys(pluginData).length
        ) {
            if (pluginData.transitioned) {
                /** Plugin data is in markdown format. Load it, then transition it to new format. */
                await this.transitionMarkdownSettings();
            } else if (!pluginData.config) {
                /** Plugin data is in original format JSON format. Just transition to the new format. */
                await this.transitionJSONSettings();
            } else {
                /** Plugin data is already good. Just read the config path, then move on. */
                this.config_path = pluginData.config;
            }
        } else {
            await this.saveConfigPath();
        }
        await this.internalLoad();
    }

    private async internalLoad() {
        /** Make sure  */
        await this.guardFolder();
        let dirty = false;
        if (!(await this.adapter.exists(this.config_file))) {
            await this.saveData(copy(DEFAULT_DATA));
        } else {
            const initial_data: CalendariumData = JSON.parse(
                await this.adapter.read(this.config_file)
            );
            if (Object.keys(initial_data).length == 0) {
                this.#data = copy(DEFAULT_DATA);
                dirty = true;
            }
            this.#data = { ...copy(initial_data), calendars: [] };
            for (const calendar of initial_data.calendars) {
                await this.guardFolder(this.getFolderPathForCalendar(calendar));
                const calObj = await this.read<Calendar>(
                    this.getFilePathForCalendar(calendar)
                );
                if (calObj) {
                    this.#data.calendars.push(calObj);
                }
            }

            dirty = this.updateDataToNewSchema(this.#data);
        }
        if (dirty) {
            await this.saveData();
        }
        this.loaded = true;
        this.app.workspace.trigger("calendarium-settings-loaded");
    }
    public async saveCalendars() {
        this.app.workspace.trigger("calendarium-updated");
    }
    public async saveCalendar(calendar: Calendar) {
        const path = this.getFolderPathForCalendar(calendar);
        await this.guardFolder(path);
        await this.write(
            this.getFilePathForCalendar(calendar),
            JSON.stringify(calendar)
        );
    }
    public async loadCalendar() {}
    public async removeCalendar(calendar: Calendar) {
        calendar.deleted = true;
        calendar.deletedTimestamp = Date.now();
        await this.saveCalendar(calendar);
        /* await this.adapter.rmdir(
            this.getFolderPathForCalendar(calendar.id),
            true
        ); */
    }
    private async guardFolder(path = this.config_path) {
        const split = path.split("/");
        for (let i = 0; i < split.length; i++) {
            let path = split.slice(0, i + 1).join("/");
            if (!(await this.adapter.exists(path))) {
                await this.adapter.mkdir(path);
            }
        }
    }

    private getFolderPathForCalendar(calendar: Calendar | string): string {
        let id = typeof calendar === "string" ? calendar : calendar.id;
        return this.config_path + "/calendars/" + id;
    }
    private getFilePathForCalendar(calendar: Calendar | string): string {
        let id = typeof calendar === "string" ? calendar : calendar.id;
        return this.getFolderPathForCalendar(calendar) + "/" + id + ".json";
    }

    private async transitionJSONSettings() {
        let data: MarkdownCalendariumData = {
            ...(await this.plugin.loadData()),
        };
        await this.updateCalendarsToNewSchema(data?.calendars ?? []);
        await this.saveData(data);
    }
    private async transitionMarkdownSettings() {
        const contents = (await this.adapter.read(this.MARKDOWN_PATH))
            .split(SPLITTER)
            .pop()
            .trim();
        let data: MarkdownCalendariumData = contents
            ? parseYaml(contents)
            : copy(DEFAULT_DATA);
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
            } else if (!Array.isArray(calendar.path)) {
                calendar.path = [calendar.path];
                dirty = true;
            }
        }
        return dirty;
    }
    private updateDataToNewSchema(
        data: MarkdownCalendariumData | FullCalendariumData
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
    private async write(path: string, data: string) {
        await this.adapter.write(path, data);
    }
    private async read<T>(path: string): Promise<T> {
        return JSON.parse((await this.adapter.read(path)) ?? "{}") as T;
    }
    notice: Notice;
    private async checkSettings() {
        if (this.#data.askedToMoveFC) return;

        if (!this.app.plugins.plugins["fantasy-calendar"]) return;

        this.notice = new Notice(
            createFragment((f) => {
                const c = f.createDiv("calendarium-notice");
                c.createEl("h4", {
                    text: "The Calendarium",
                    cls: "calendarium-header",
                });
                const e = c.createDiv();
                e.createSpan({
                    text: "Would you like to migrate your existing Fantasy Calendar settings to The Calendarium?",
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
                                this.notice.hide();
                                this.notice = null;
                            }, 2000);
                        }, Math.max(2000 - (Date.now() - start), 0));
                    });
            }),
            0
        );

        return;
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
                await this.adapter.read(
                    ".obsidian/plugins/fantasy-calendar/_data.md"
                )
            )
                .split(SPLITTER)
                .pop()
                .trim();
            fcData = parseYaml(contents);
        } else {
            fcData = await this.app.plugins.plugins[
                "fantasy-calendar"
            ].loadData();
        }
        const data = merge(DEFAULT_DATA, fcData ?? {});
        data.askedToMoveFC = true;
        await this.saveData(data);
        this.saveCalendars();
    }
    static DataFile = "_data.md";
    static ConfigFile = "config.json";
}
