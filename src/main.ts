import { Platform, Plugin, WorkspaceLeaf, addIcon } from "obsidian";

import CalendariumSettings from "./settings/settings";

import type { Calendar } from "./@types";
import CalendariumView, { VIEW_TYPE } from "./calendar/view";

import { CalendarEventTree, Watcher } from "./watcher/watcher";
import { API } from "./api/api";
import SettingsService from "./settings/settings.service";
import { CalendarStore, createCalendarStore } from "./stores/calendar.store";
import { CodeBlockService } from "./calendar/codeblock";
import {
    /*
    EVENT_LINKED_TO_NOTE,
    EVENT_LINKED_TO_NOTE_ICON, */
    REVEAL_ICON,
} from "./utils/constants";

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
    }
}

declare global {
    interface Window {
        Calendarium?: API;
    }
}
export const MODIFIER_KEY = Platform.isMacOS ? "Meta" : "Control";

export default class Calendarium extends Plugin {
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
    private $settingsService: SettingsService;
    get data() {
        return this.$settingsService.getData();
    }
    get calendars() {
        return this.$settingsService.getCalendars();
    }

    private readonly stores: WeakMap<Calendar, CalendarStore> = new WeakMap();
    public getStoreByCalendar(calendar: Calendar) {
        if (!this.stores.has(calendar)) {
            this.stores.set(calendar, createCalendarStore(calendar, this));
        }
        return this.stores.get(calendar);
    }
    /** Get a store by ID */
    public getStore(calendar: string) {
        if (!calendar) return null;
        const cal = this.data.calendars.find((c) => c.id == calendar);
        if (!cal) return null;
        return this.getStoreByCalendar(cal);
    }
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
                : this.data.dateFormat) ?? "YYYY-MM-DD"
        );
    }
    hasCalendar(calendar: string): boolean {
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
    async onload() {
        console.log("Loading Calendarium v" + this.manifest.version);
        this.$settingsService = new SettingsService(this, this.manifest);
        await this.$settingsService.loadData();

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
            this.watcher.load();

            this.addCommands();

            this.addRibbonIcon(VIEW_TYPE, "Open Calendarium", () => {
                this.addCalendarView();
            });

            this.addSettingTab(new CalendariumSettings(this));

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

        this.$settingsService.notice?.hide();
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
    onSettingsLoaded(callback: () => any) {
        this.$settingsService.onSettingsLoaded(callback);
    }

    async saveCalendars() {
        await this.saveSettings();
        this.app.workspace.trigger("calendarium-updated");
    }
    async saveSettings() {
        await this.$settingsService.saveData();
    }
}
