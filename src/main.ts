import {
    ButtonComponent,
    DropdownComponent,
    Notice,
    Platform,
    Plugin,
    WorkspaceLeaf,
    addIcon,
    setIcon,
} from "obsidian";

import CalendariumSettings from "./settings/settings";

import type { Calendar, CalendariumData } from "./@types";
import { SyncBehavior } from "src/schemas";
import CalendariumView, { VIEW_TYPE } from "./calendar/view";

import { CalendarEventTree, Watcher } from "./watcher/watcher";
import { API } from "./api/api";
import SettingsService from "./settings/settings.service";
import { CalendarStore, createCalendarStore } from "./stores/calendar.store";
import { CodeBlockService } from "./calendar/codeblock";
import {
    DEFAULT_FORMAT,
    /*
    EVENT_LINKED_TO_NOTE,
    EVENT_LINKED_TO_NOTE_ICON, */
    REVEAL_ICON,
} from "./utils/constants";
import { CalendariumNotice } from "./utils/notice";

declare module "obsidian" {
    interface App {
        plugins: {
            plugins: {
                "fantasy-calendar": Plugin;
            };
        };
    }
    interface Workspace {
        trigger(name: "parse-style-settings"): void; // trigger style settings
        on(name: "calendarium-updated", callback: () => any): EventRef;
        on(
            name: "calendarium-event-update",
            callback: (tree: CalendarEventTree) => any
        ): EventRef;
        on(name: "calendarium-settings-change", callback: () => any): EventRef;
        trigger(name: "calendarium-updated"): void;
        trigger(name: "calendarium-settings-change"): void;
        trigger(name: "calendarium-settings-external-load"): void;
        trigger(
            name: "calendarium-event-update",
            tree: CalendarEventTree
        ): void;
        trigger(
            name: "link-hover",
            popover: any, //hover popover, but don't need
            target: HTMLElement, //targetEl
            note: string, //linkText
            source: string //source
        ): void;
        trigger(name: "calendarium-settings-loaded"): void;
        on(name: "calendarium-settings-loaded", callback: () => any): EventRef;
        on(
            name: "calendarium-settings-external-load",
            callback: () => any
        ): EventRef;
    }
    interface Plugin {
        onConfigFileChange: () => void;
        handleConfigFileChange(): Promise<void>;
    }
}

declare global {
    interface Window {
        Calendarium?: API;
    }
}
export const MODIFIER_KEY = Platform.isMacOS ? "Meta" : "Control";

export default class Calendarium extends Plugin {
    #notices: CalendariumNotice[] = [];
    registerNotice(notice: CalendariumNotice) {
        notice.registerOnHide(() => {
            this.#notices.remove(notice);
        });
        this.#notices.push(notice);
    }

    watcher: Watcher;
    api: API = new API(this);
    async addNewCalendar(calendar: Calendar, existing?: Calendar) {
        let shouldParse =
            !existing ||
            calendar.name != existing?.name ||
            (calendar.autoParse && !existing?.autoParse) ||
            calendar.path != existing?.path;
        if (existing == null) {
            this.data.calendars.push(calendar);
        } else {
            this.data.calendars.splice(
                this.data.calendars.indexOf(existing),
                1,
                calendar
            );
        }
        if (!this.data.defaultCalendar) {
            this.data.defaultCalendar = calendar.id;
        }
        if (shouldParse) this.watcher.start(calendar);
        await this.saveCalendars();
        /* this.watcher.registerCalendar(calendar); */
    }
    /**
     * Settings
     */
    get configDir(): string {
        return (
            this.manifest.dir ??
            this.app.vault.configDir + "/plugins/calendarium"
        );
    }
    private settings$: SettingsService;
    get data() {
        return this.settings$.getData();
    }
    get calendars() {
        return this.settings$.getCalendars();
    }
    public async removeCalendar(calendar: Calendar) {
        this.data.calendars = this.data.calendars.filter(
            (c) => c.id != calendar.id
        );
        if (calendar.id == this.data.defaultCalendar) {
            this.data.defaultCalendar = this.data.calendars[0]?.id;
            this.watcher.start();
        }
        await this.saveCalendars();
    }
    public onSettingsLoaded(callback: () => any) {
        this.settings$.onSettingsLoaded(callback);
    }
    public async saveCalendars() {
        await this.saveSettings();
        this.app.workspace.trigger("calendarium-updated");
    }
    public async saveSettings() {
        await this.settings$.saveData();
    }
    public hasCalendar(calendar: string): boolean {
        const cal = this.data.calendars.find((c) => c.id == calendar);
        return !!cal;
    }
    get defaultCalendar(): Calendar {
        return (
            this.data.calendars?.find(
                (c) => c.id == this.data.defaultCalendar
            ) ??
            this.data.calendars?.[0] ??
            null
        );
    }
    async onExternalSettingsChange() {
        this.settings$.onExternalSettingsChange();
    }
    public async saveData(data: CalendariumData) {
        await super.saveData(data);
    }
    async handleConfigFileChange() {
        await super.handleConfigFileChange();
        this.onExternalSettingsChange();
    }

    /**
     * Stores
     */
    private readonly stores: WeakMap<Calendar, CalendarStore> = new WeakMap();
    public getStoreByCalendar(calendar: Calendar) {
        if (!this.stores.has(calendar)) {
            this.stores.set(calendar, createCalendarStore(calendar, this));
        }
        return this.stores.get(calendar) ?? null;
    }
    /** Get a store by ID */
    public getStore(calendar: string) {
        if (!calendar) return null;
        const cal = this.data.calendars.find((c) => c.id == calendar);
        if (!cal) return null;
        return this.getStoreByCalendar(cal);
    }

    /**
     * Integrations
     */
    get canUseDailyNotes() {
        return this.dailyNotes._loaded;
    }
    get dailyNotes() {
        return this.app.internalPlugins.getPluginById("daily-notes");
    }
    get format() {
        return (
            (this.data.dailyNotes && this.canUseDailyNotes
                ? this.dailyNotes.instance.options.format
                : this.data.dateFormat) ?? DEFAULT_FORMAT
        );
    }
    async onload() {
        console.log("Loading Calendarium v" + this.manifest.version);
        this.settings$ = new SettingsService(this, this.manifest);
        await this.settings$.loadData();

        /** Add Icons */
        addIcon(
            REVEAL_ICON,
            `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="calendar-day" class="svg-inline--fa fa-calendar-day fa-w-14" role="img" viewBox="0 0 448 512"><path fill="currentColor" d="M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm64-192c0-8.8 7.2-16 16-16h96c8.8 0 16 7.2 16 16v96c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16v-96zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z"/></svg>`
        );

        /* addIcon(EVENT_LINKED_TO_NOTE, EVENT_LINKED_TO_NOTE_ICON); */

        this.watcher = new Watcher(this);

        (window["Calendarium"] = this.api) &&
            this.register(() => delete window["Calendarium"]);

        this.registerView(
            VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new CalendariumView(leaf, this)
        );

        new CodeBlockService(this).load();

        this.app.workspace.onLayoutReady(async () => {
            this.addCommands();

            this.addRibbonIcon(VIEW_TYPE, "Open Calendarium", () => {
                this.addCalendarView();
            });
        });
        this.settings$.onLayoutReadyAndSettingsLoad(() => {
            this.watcher.load();
            this.addSettingTab(new CalendariumSettings(this, this.settings$));
            this.addCalendarView(true);
        });

        app.workspace.trigger("parse-style-settings");
    }

    async onunload() {
        console.log("Unloading Calendarium v" + this.manifest.version);
        this.app.workspace
            .getLeavesOfType(VIEW_TYPE)
            .forEach((leaf) => leaf.detach());
        this.watcher?.unload();

        for (const notice of this.#notices) {
            notice?.hide();
        }
    }

    addCommands() {
        this.addCommand({
            id: "open-calendarium",
            name: "Open Calendarium",
            callback: () => {
                this.addCalendarView();
            },
        });
    }

    async addCalendarView(startup: boolean = false) {
        if (startup && this.app.workspace.getLeavesOfType(VIEW_TYPE)?.length)
            return;
        const leaf = this.app.workspace.getRightLeaf(false);
        leaf.setViewState({
            type: VIEW_TYPE,
        });
        if (leaf) this.app.workspace.revealLeaf(leaf);
    }
}
