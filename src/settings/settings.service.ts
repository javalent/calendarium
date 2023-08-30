import {
    ButtonComponent,
    Notice,
    PluginManifest,
    parseYaml,
    setIcon,
    stringifyYaml,
} from "obsidian";
import type { Calendar, CalendariumData } from "src/@types";
import { DEFAULT_DATA } from "./settings.constants";
import merge from "deepmerge";
import { nanoid } from "src/utils/functions";
import Calendarium from "src/main";
import copy from "fast-copy";

const SPLITTER = "--- BEGIN DATA ---";
const HEADER = `This file is used by Calendarium to manage its data.

Please do not modify this file directly or you could corrupt the plugin data.

${SPLITTER}
`;

export default class SettingsService {
    loaded = false;
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
            this.checkSettings();
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
    public async saveData(data: CalendariumData = this.#data) {
        this.#data = data;
        this.plugin.app.workspace.trigger("calendarium-settings-change");
        await this.guardFile();
        this.#data.version = this.version;
        await this.adapter.write(this.path, this.transformData(this.#data));
    }

    public async loadData() {
        await this.guardFile();
        await this.transitionJSONSettings();
        let dirty = false;
        if (!(await this.adapter.exists(this.path))) {
            await this.saveData(copy(DEFAULT_DATA));
        } else {
            const contents = (await this.adapter.read(this.path))
                .split(SPLITTER)
                .pop()
                .trim();
            this.#data = parseYaml(contents);
            if (Object.keys(this.#data).length == 0) {
                this.#data = copy(DEFAULT_DATA);
                dirty = true;
            }
            for (const calendar of this.#data.calendars) {
                if (!calendar.id) {
                    calendar.id = `${nanoid(10)}`;
                    dirty = true;
                }
                if (!Array.isArray(calendar.path)) {
                    calendar.path = [calendar.path];
                    dirty = true;
                }
            }
            if (!this.#data.defaultCalendar && this.#data.calendars.length) {
                this.#data.defaultCalendar = this.#data.calendars[0].id;
                dirty = true;
            }
            if (
                this.#data.calendars.length &&
                !this.#data.calendars.find(
                    (cal) => cal.id == this.#data.defaultCalendar
                )
            ) {
                this.#data.defaultCalendar = this.#data.calendars[0].id;
                dirty = true;
            }
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
    public async loadCalendar() {}

    private transformData(data: Calendar | CalendariumData) {
        return `${HEADER}\n${stringifyYaml(data)}`;
    }

    private async guardFile() {
        if (!(await this.adapter.exists(this.manifest.dir))) {
            await this.adapter.mkdir(this.manifest.dir);
        }
    }
    private async transitionJSONSettings() {
        let data = {
            ...(await this.plugin.loadData()),
        };
        if (data && Object.keys(data).length && !data.transitioned) {
            await this.saveData(data);
            await this.plugin.saveData({ transitioned: true });
        }
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
}
