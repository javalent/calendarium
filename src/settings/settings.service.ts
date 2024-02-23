import {
    ButtonComponent,
    DropdownComponent,
    type PluginManifest,
    parseYaml,
    setIcon,
    debounce,
    Scope,
} from "obsidian";
import type {
    Calendar,
    CalendariumData,
    MarkdownCalendariumData,
    Version,
} from "src/@types";
import { DEFAULT_DATA } from "./settings.constants";
import merge from "deepmerge";
import { nanoid } from "src/utils/functions";
import Calendarium from "src/main";
import copy from "fast-copy";
import { CalendariumNotice } from "src/utils/notice";
import { SyncBehavior } from "src/schemas";
import {
    isOlderVersion,
    MarkdownReason,
    shouldTransitionMarkdownSettings,
} from "./settings.utils";
import { CHECK, LOADING } from "src/utils/icons";

const SPLITTER = "--- BEGIN DATA ---";

export default class SettingsService {
    static DataFile = "_data.md";

    loaded = false;

    #asking: boolean = false;
    #prompting: boolean = false;
    #saving: boolean = false;

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
        this.onLayoutReadyAndSettingsLoad(async () => {
            setTimeout(() => this.checkFCSettings(), 2000);
            const permanentlyDelete: string[] = [];

            console.debug(
                `Calendarium: Checking deleted calendars for any to permanently delete.`
            );
            for (const calendar of this.#data.deletedCalendars) {
                if (
                    Date.now() - calendar.deletedTimestamp >
                    7 * 24 * 60 * 60 * 1000
                ) {
                    permanentlyDelete.push(calendar.id);
                }
            }

            if (permanentlyDelete.length) {
                console.debug(
                    `Calendarium: Found ${permanentlyDelete.length} deleted calendars more than 7 days old. Removing them.`
                );
                this.#data.deletedCalendars =
                    this.#data.deletedCalendars.filter(
                        (d) => !permanentlyDelete.includes(d.id)
                    );
                await this.saveData(this.#data);
            }
        });
    }
    /**
     * Register a callback to be executed when Obsidian's workspace layout is ready AND my settings have been loaded.
     */
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
    /**
     * Register a callback to be executed when my settings have been loaded.
     */
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
    get syncPlugin() {
        return this.app.internalPlugins.getPluginById("sync");
    }
    #waitingOnSync = false;
    /**
     * This method is called whenever Obsidian detects that my data.json file has been modified.
     */
    public onExternalSettingsChange = debounce(
        async (): Promise<void> => {
            // If I was the source of my data file change, just ignore this.
            if (this.#saving) {
                setTimeout(() => {
                    this.#saving = false;
                }, 500);
                return;
            }
            if (this.syncPlugin._loaded) {
                if (this.syncPlugin.instance.getStatus() !== "synced") {
                    if (!this.#waitingOnSync) {
                        this.#waitingOnSync = true;
                        console.debug(
                            "Calendarium: Obsidian Sync is actively syncing. Scheduling a reload after it completes."
                        );
                        const ref = this.syncPlugin.instance.on(
                            "status-change",
                            () => {
                                if (
                                    this.syncPlugin.instance.getStatus() !==
                                    "synced"
                                )
                                    return;
                                setTimeout(() => {
                                    console.debug(
                                        "Calendarium: Obsidian Sync finished. Performing reload."
                                    );
                                    this.#waitingOnSync = false;
                                    this.onExternalSettingsChange();
                                    this.syncPlugin.instance.offref(ref);
                                }, 1000);
                            }
                        );
                        this.plugin.registerEvent(ref);
                    }
                    return;
                }
            }
            // If the user doesn't want their data synced, just ignore this.
            if (this.#data.syncBehavior === "Never") {
                console.debug(
                    "Calendarium: Ignoring external data change event due to syncBehavior being 'Never'"
                );
                return;
            }
            // If the user wants it automatically synced, reload it.
            if (this.#data.syncBehavior === "Always") {
                console.debug(
                    "Calendarium: Automatically reloading data due to syncBehavior being 'Always'"
                );
                await this.loadData(true);
                return;
            }
            this.askToReload();
        },
        2000,
        true
    );
    private askToReload() {
        // If I am already asking, I shouldn't ask again.
        if (this.#asking) return;
        console.debug(
            "Calendarium: External data change detected. Prompting for behavior."
        );
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
                            LOADING
                        );
                        migrating.createSpan({ text: "Reloading data..." });
                        const start = Date.now();
                        await this.loadData(true);
                        setTimeout(() => {
                            migrating.empty();
                            setIcon(
                                migrating.createDiv("migrating-icon"),
                                CHECK
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
            this.#asking = false;
            this.promptForBehavior();
        });
    }
    private async promptForBehavior() {
        if (this.#prompting) return;
        this.#prompting = true;
        if (this.#data.askedAboutSync && this.#data.syncBehavior !== "Ask")
            return;
        if (!this.#data.askedAboutSync) {
            this.#data.askedAboutSync = true;
            await this.saveData(this.#data);
        }
        console.debug(
            "Calendarium: Asking user how to handle external data change events in the future."
        );
        const scope = new Scope();
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
                    .addOption(SyncBehavior.Ask, "Continue Asking")
                    .addOption(SyncBehavior.Always, "Always Reload")
                    .addOption(SyncBehavior.Never, "Never Reload")
                    .setValue(this.#data.syncBehavior)
                    .onChange(async (v) => {
                        this.#data.syncBehavior = v as SyncBehavior;
                        await this.saveData(this.#data);
                        notice.hide();
                    });
                drop.selectEl.setAttr("tabindex", 99);
                /* drop.selectEl.focus(); */
                this.app.keymap.pushScope(scope);
                drop.selectEl.onClickEvent((e) => {
                    e.stopPropagation();
                    e.preventDefault();
                });
            }),
            0
        );
        notice.registerOnHide(() => {
            this.#prompting = false;
            this.app.keymap.popScope(scope);
        });
        this.plugin.registerNotice(notice);
    }
    get version(): Version {
        const split = this.manifest.version.split(".");
        let [major, minor] = split;
        let [, patch, beta] = split[2].match(/(\d+)(?:\-b(\d+))?/) ?? split[2];

        return {
            major: Number(major),
            minor: Number(minor),
            patch: Number(patch),
            beta: beta ? Number(beta) : null,
        };
    }

    getDataVersion(data: CalendariumData): Version {
        const version: Version = {
            major: Number.MIN_VALUE,
            minor: Number.MIN_VALUE,
            patch: Number.MIN_VALUE,
            beta: null,
        };
        if ("version" in data) {
            const dV = data.version;
            if (typeof dV.major == "number") version.major = dV.major;
            if (typeof dV.minor == "number") version.minor = dV.minor;
            if (typeof dV.beta == "number") version.beta = dV.beta;
            switch (typeof dV.patch) {
                case "number": {
                    version.patch = dV.patch;
                    break;
                }
                case "string": {
                    let [, patch, beta] = (dV.patch as string).match(
                        /(\d+)(?:\-b(\d+))?/
                    ) ?? [Number.MIN_VALUE, Number.MIN_VALUE];
                    version.patch = Number(patch);
                    version.beta = Number(beta);
                    break;
                }
            }
        }
        return version;
    }
    isOldVersion(older: Version, current: Version): boolean {
        return isOlderVersion(older, current);
    }

    /**
     *
     */
    public async save() {
        await this.saveData(this.#data);
    }

    /**
     *
     */
    public async saveAndTrigger() {
        await this.saveData(this.#data, true);
    }
    /**
     *
     * @param {CalendariumData} data Calendar data to be saved.
     * @param {boolean} triggerCalendar Trigger a calendar update event.
     */
    public async saveData(data: CalendariumData, triggerCalendar = false) {
        console.debug("Calendarium: Saving data.");
        /** This flag is used to know that an internal event caused my settings to change. */
        this.#saving = true;

        /** Sync my data. */
        this.#data = data;

        /** Keep version in sync. */
        this.#data.version = this.version;

        /** Perform the I/O operation */
        await this.plugin.saveData(data);

        /** Tell things that Calendarium settings have changed. */
        this.plugin.app.workspace.trigger("calendarium-settings-change");

        /** If necessary, tell things that one or more calendars have been updated. */
        if (triggerCalendar) {
            console.debug(
                "Calendarium: Triggering calendar updates due to a save event effecting calendar display."
            );
            this.app.workspace.trigger("calendarium-updated");
        }
    }

    /**
     * Load my data.json file.
     * @param {boolean} external Whether or not this load request is due to an external settings change (e.g., sync)
     */
    public async loadData(external?: boolean) {
        console.debug("Calendarium: Loading data.");
        await this.load();
        this.loaded = true;
        this.app.workspace.trigger("calendarium-settings-loaded");
        if (external)
            this.app.workspace.trigger("calendarium-settings-external-load");
    }
    private async load() {
        const pluginData: unknown | CalendariumData =
            (await this.plugin.loadData()) ?? {};
        /** Check to see if the data is in the old markdown file. */
        console.debug(
            "Calendarium: Checking to see if markdown settings should be migrated."
        );
        let reason = await this.shouldTransitionMarkdownSettings(pluginData);
        if (reason !== MarkdownReason.NONE) {
            console.debug(
                "Calendarium: Markdown settings need to be migrated. Reason: " +
                    reason
            );
            /** Plugin data is in markdown format. Load it, then transition it to new format. */
            await this.transitionMarkdownSettings();
            return;
        }
        if (!pluginData || !Object.keys(pluginData).length) {
            console.debug(
                "Calendarium: No data file could be loaded. Saving default data."
            );
            await this.saveData(copy(DEFAULT_DATA));
            return;
        }
        /**
         * At this point, pluginData should be CalendariumData, but should be validated.
         */
        console.debug("Calendarium: Ensuring data matches the schema.");

        let data = pluginData as CalendariumData;

        if (!data || !Object.keys(pluginData ?? {}).length)
            data = copy(DEFAULT_DATA);
        let dirty = this.updateDataToNewSchema(data);
        if (dirty) {
            console.debug(
                "Calendarium: Data was modified during loading process. Saving data."
            );
            await this.saveData(data);
        } else {
            this.#data = data;
        }
    }

    /** These methods are used to manage calendars in settings. */
    async addCalendar(calendar: Calendar, existing?: Calendar) {
        let shouldParse =
            !existing ||
            calendar.name != existing?.name ||
            (calendar.autoParse && !existing?.autoParse) ||
            calendar.path != existing?.path;
        if (existing == null) {
            this.#data.calendars.push(calendar);
        } else {
            this.#data.calendars.splice(
                this.#data.calendars.indexOf(existing),
                1,
                calendar
            );
        }
        if (!this.#data.defaultCalendar) {
            this.#data.defaultCalendar = calendar.id;
        }
        if (shouldParse) this.plugin.watcher.start(calendar);
        await this.saveData(this.#data, true);
    }
    /**
     * Remove a calendar from settings.
     * @param {Calendar} calendar Calendar to be removed.
     */
    public async removeCalendar(calendar: Calendar) {
        this.#data.calendars = this.#data.calendars.filter(
            (c) => c.id != calendar.id
        );
        if (calendar.id == this.#data.defaultCalendar) {
            this.#data.defaultCalendar = this.#data.calendars[0]?.id;
            this.plugin.watcher.start();
        }
        this.#data.deletedCalendars.push({
            ...copy(calendar),
            deletedTimestamp: Date.now(),
        });
        await this.saveData(this.#data, true);
    }

    /**
     * @param {string} calendar Calendar ID to find.
     * @returns {boolean}
     */
    hasCalendar(calendar: string): boolean {
        const cal = this.#data.calendars.find((c) => c.id == calendar);
        return !!cal;
    }

    /**
     * Check to see if I should prompt to migrate Fantasy Calendar settings.
     */
    private async checkFCSettings(): Promise<void> {
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
                            LOADING
                        );
                        migrating.createSpan({ text: "Migrating..." });
                        const start = Date.now();
                        await this.migrateFCData();
                        setTimeout(() => {
                            migrating.empty();
                            setIcon(
                                migrating.createDiv("migrating-icon"),
                                CHECK
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
    }
    /**
     * Migrate Fantasy Calendar settings.
     */
    private async migrateFCData() {
        console.debug("Calendarium: Migrating Fantasy Calendar plugin data.");
        //transform data;
        let fcData: CalendariumData;
        if (
            await this.adapter.exists(
                `${this.plugin.app.vault.configDir}/plugins/fantasy-calendar/_data.md`
            )
        ) {
            const contents = (
                (
                    await this.adapter.read(
                        `${this.plugin.app.vault.configDir}/plugins/fantasy-calendar/_data.md`
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

        //Remove note-based events, as these will be duplicated in Calendarium.
        for (const calendar of data?.calendars ?? []) {
            calendar.events = calendar.events?.filter((e) => !e.note) ?? [];
        }

        await this.updateDataToNewSchema(data);
        await this.saveData(data, true);
    }
    /**
     * Transition data from the old `_data.md` format.
     */
    get markdownPath() {
        return this.manifest.dir + "/" + SettingsService.DataFile;
    }
    public async markdownFileExists() {
        return await this.adapter.exists(this.markdownPath);
    }
    public async transitionMarkdownSettings() {
        console.debug("Calendarium: Migrating Markdown file data.");
        let data: MarkdownCalendariumData | null = null;
        if (await this.markdownFileExists()) {
            const contents = (
                (await this.adapter.read(this.markdownPath))
                    .split(SPLITTER)
                    .pop() ?? ""
            ).trim();
            data =
                contents && contents.length
                    ? parseYaml(contents)
                    : copy(DEFAULT_DATA);
        }
        if (!data) data = copy(DEFAULT_DATA);

        await this.updateDataToNewSchema(data);
        await this.saveData(data);
    }
    public async shouldTransitionMarkdownSettings(
        pluginData: any
    ): Promise<MarkdownReason> {
        /** Nothing to transition. */
        if (!(await this.markdownFileExists())) return MarkdownReason.NONE;
        return shouldTransitionMarkdownSettings(pluginData);
    }
    public async deleteMarkdownSettings() {
        await this.adapter.remove(this.path);
    }
    private updateDataToNewSchema(
        data: MarkdownCalendariumData | CalendariumData
    ) {
        const version = this.getDataVersion(data);
        let dirty = this.updateCalendarsToNewSchema(data.calendars, data);
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
        if (!data.deletedCalendars) {
            data.deletedCalendars = [];
            dirty = true;
        }
        /** Beta 29 */
        if (
            this.isOldVersion(this.getDataVersion(data), {
                major: 1,
                minor: 0,
                patch: 0,
                beta: 29,
            })
        ) {
            data.paths = [];
            if (data.calendars.length) {
                for (const calendar of data.calendars) {
                    if (calendar.path?.length) {
                        data.paths.push(
                            ...calendar.path.map(
                                (p) => [p, calendar.id] as const
                            )
                        );
                    }
                }
            }
            for (let i = 0; i < data.paths.length; i++) {
                const [path] = data.paths[i];
                const exists =
                    i > 0 &&
                    data.paths.slice(0, i).find(([p]) => p === path) !=
                        undefined;
                if (exists) {
                    let notice = new CalendariumNotice(
                        createFragment((f) => {
                            const c = f.createDiv("calendarium-notice");
                            c.createEl("h4", {
                                text: "Calendarium",
                                cls: "calendarium-header",
                            });
                            const e = c.createDiv();
                            e.createDiv({
                                text: "You have the same event path registered to multiple calendars.",
                            });
                            e.createDiv({
                                text: "Please review your event path settings.",
                            });
                            e.createEl("br");
                            e.createEl("br");
                            const b = e.createDiv("calendarium-notice-buttons");
                            new ButtonComponent(e)
                                .setButtonText("Open Settings")
                                .onClick(() => {
                                    notice.hide();
                                    this.app.setting.openTabById(
                                        this.plugin.manifest.id
                                    );
                                });
                        }),
                        0
                    );
                    this.plugin.registerNotice(notice);
                    break;
                }
            }

            if (data.calendars.length) {
                data.inlineEventsTag =
                    data.calendars.find((c) => c.inlineEventTag != null)
                        ?.inlineEventTag ?? null;
            }
            dirty = true;
        }

        return dirty;
    }
    private updateCalendarsToNewSchema(
        calendars: Calendar[],
        data: CalendariumData
    ): boolean {
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
            if (calendar.showIntercalarySeparately == null) {
                calendar.showIntercalarySeparately = (<any>(
                    data
                )).showIntercalary;
            }
        }
        return dirty;
    }
}
