import {
    ButtonComponent,
    DropdownComponent,
    type PluginManifest,
    parseYaml,
    setIcon,
    Scope,
} from "obsidian";
import type {
    Calendar,
    CalendariumData,
    DatedCalEvent,
    MarkdownCalendariumData,
    RangeCalEvent,
    RecurringCalEvent,
    UndatedCalEvent,
    Version,
} from "src/@types";
import {
    DEFAULT_DATA,
    DEFAULT_SEASONAL_DATA,
    DEFAULT_WEATHER_DATA,
} from "./settings.constants";
import merge from "deepmerge";
import { nanoid } from "src/utils/functions";
import Calendarium from "src/main";
import copy from "fast-copy";
import { CalendariumNotice } from "src/utils/notice";
import { SyncBehavior } from "src/schemas";
import {
    isOlder,
    MarkdownReason,
    shouldTransitionMarkdownSettings,
} from "./settings.utils";
import { CHECK, LOADING } from "src/utils/icons";
import { EventType } from "src/events/event.types";

const SPLITTER = "--- BEGIN DATA ---";
type CalendarID = string;
class SettingsServiceClass {
    static DataFile = "_data.md";

    loaded = false;

    #asking: boolean = false;
    #prompting: boolean = false;
    #saving: boolean = false;
    deletedCalendars: Calendar[] = [];

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
    public getDefaultCalendar(): Calendar | undefined {
        return this.#calendars.get(this.#data.defaultCalendar ?? "");
    }
    #calendars: Map<CalendarID, Calendar>;
    public getCalendar(id: string): Calendar | undefined {
        return this.#calendars.get(id);
    }
    get path() {
        return this.manifest.dir + "/" + SettingsServiceClass.DataFile;
    }
    private layoutReady = false;
    private plugin: Calendarium;
    public manifest: PluginManifest;
    initialize(plugin: Calendarium, manifest: PluginManifest) {
        this.plugin = plugin;
        this.manifest = manifest;
        this.app.workspace.onLayoutReady(() => (this.layoutReady = true));
        this.onLayoutReadyAndSettingsLoad(async () => {
            setTimeout(() => this.checkFCSettings(), 2000);
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
    /**
     * This method is called whenever Obsidian detects that my data.json file has been modified.
     */
    public async onExternalSettingsChange(): Promise<void> {
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
    }
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
                    .setButtonText("Reload data")
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
                    .addOption(SyncBehavior.Ask, "Continue asking")
                    .addOption(SyncBehavior.Always, "Always reload")
                    .addOption(SyncBehavior.Never, "Never reload")
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
    isOlder(older: Version, current: Version): boolean {
        return isOlder(older, current);
    }

    /**
     *
     */
    public async save(triggers?: { calendar?: boolean; watcher?: boolean }) {
        await this.saveData(this.#data);

        /** If necessary, tell things that one or more calendars have been updated. */
        if (triggers?.calendar) {
            console.debug(
                "Calendarium: Triggering calendar updates due to a save event effecting calendar display."
            );
            this.app.workspace.trigger("calendarium-updated");
        }

        if (triggers?.watcher) {
            this.plugin.watcher.start();
        }
    }

    /**
     *
     * @param {CalendariumData} data Calendar data to be saved.
     * @param {boolean} triggerCalendar Trigger a calendar update event.
     */
    public async saveData(data: CalendariumData) {
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

        this.#saving = false;
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
        this.#calendars = new Map(this.#data.calendars.map((c) => [c.id, c]));
    }

    /** These methods are used to manage calendars in settings. */
    async addCalendar(calendar: Calendar, existing?: Calendar) {
        let shouldParse = !existing || calendar.name != existing?.name;
        if (existing == null) {
            this.#data.calendars.push(calendar);
        } else {
            this.#data.calendars.splice(
                this.#data.calendars.indexOf(existing),
                1,
                calendar
            );
            this.#calendars.delete(existing.id);
        }
        if (!this.#data.defaultCalendar) {
            this.#data.defaultCalendar = calendar.id;
        }
        if (shouldParse) this.plugin.watcher.start(calendar);

        this.#calendars.set(calendar.id, calendar);
        await this.save({ calendar: true });
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
        this.deletedCalendars.push(calendar);
        this.#calendars.delete(calendar.id);

        await this.save({ calendar: true });
    }

    /**
     * @param {string} calendar Calendar ID to find.
     * @returns {boolean}
     */
    hasCalendar(calendar: string): boolean {
        return this.#calendars.has(calendar);
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
        await this.saveData(data);
    }
    /**
     * Transition data from the old `_data.md` format.
     */
    get markdownPath() {
        return this.manifest.dir + "/" + SettingsServiceClass.DataFile;
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
        let dirty = this.updateCalendarsToNewSchema(data.calendars, data);

        if (!(("autoParse" in data) as any)) {
            data.autoParse = true;
            dirty = true;
        }
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
        if ("deletedCalendars" in data) {
            delete data.deletedCalendars;
            dirty = true;
        }
        /** Beta 29 */
        if (
            this.isOlder(
                {
                    major: 1,
                    minor: 0,
                    patch: 0,
                    beta: 29,
                },
                this.getDataVersion(data)
            )
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
                                .setButtonText("Open settings")
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
    public updateCalendarsToNewSchema(
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
                if (!(event as any).type) {
                    //Check for an undated event.
                    if (
                        !event.date ||
                        (event.date.year == null &&
                            event.date.month == null &&
                            event.date.day == null)
                    ) {
                        (event as any as UndatedCalEvent).type =
                            EventType.Undated;
                        (event as any as UndatedCalEvent).date = {
                            year: null,
                            month: null,
                            day: null,
                        };
                        continue;
                    }
                    //Check for an event that should be recurring.
                    if (
                        event.date.year == null ||
                        event.date.month == null ||
                        event.date.day == null
                    ) {
                        //Recurrences cannot have ranges.
                        delete (event as any).end;
                        (event as any as RecurringCalEvent).type =
                            EventType.Recurring;
                        if ((event as any).date.year == null) {
                            (event as any as RecurringCalEvent).date.year = [
                                null,
                                null,
                            ];
                        }
                        if ((event as any).date.month == null) {
                            (event as any as RecurringCalEvent).date.month = [
                                null,
                                null,
                            ];
                        }
                        if ((event as any).date.day == null) {
                            (event as any as RecurringCalEvent).date.day = [
                                null,
                                null,
                            ];
                        }
                    }
                    //Check for range events.
                    //At this point, the event date should be *fully defined*.
                    //The event *end* date might not be; if that is the case. remove the end date.
                    if ("end" in event) {
                        if (
                            event.end &&
                            ((event as any as RangeCalEvent).end.year == null ||
                                (event as any as RangeCalEvent).end.month ==
                                    null ||
                                (event as any as RangeCalEvent).end.day == null)
                        ) {
                            (event as any as DatedCalEvent).type =
                                EventType.Date;
                            delete (event as any).end;
                            continue;
                        }
                        (event as any as RangeCalEvent).type = EventType.Range;
                        continue;
                    }
                    event.type = EventType.Date;
                }
            }
            if (calendar.showIntercalarySeparately == null) {
                calendar.showIntercalarySeparately = (<any>(
                    data
                )).showIntercalary;
            }
            for (const era of calendar.static?.eras) {
                if ("start" in era) {
                    era.date = { ...(era as any).start };
                    delete (era as any).start;
                    dirty = true;
                }
                if (!("type" in (era as any))) {
                    era.type = "era";
                    dirty = true;
                }
                if ("event" in era) {
                    era.isEvent = (era as any).event;
                    dirty = true;
                }
                if (!("isStartingEra" in (era as any))) {
                    era.isStartingEra = false;
                    dirty = true;
                }
                if ("restart" in era) {
                    delete era.restart;
                    dirty = true;
                }
            }
            if (!("seasonal" in calendar)) {
                (calendar as any).seasonal = copy(DEFAULT_SEASONAL_DATA);
                dirty = true;
            }
            if (!("weather" in calendar.seasonal)) {
                (calendar as any).seasonal.weather = copy(DEFAULT_WEATHER_DATA);
                dirty = true;
            }
        }
        return dirty;
    }
}

export const SettingsService = new SettingsServiceClass();
//@ts-ignore
window.SettingsService = SettingsService;
