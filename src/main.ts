import { Platform, Plugin, WorkspaceLeaf } from "obsidian";

import CalendariumSettings from "./settings/settings";

import type { Calendar } from "./@types";
import CalendariumView, { VIEW_TYPE } from "./calendar/view";

import { CalendarEventTree, Watcher } from "./watcher/watcher";
import { API } from "./api/api";
import SettingsService from "./settings/settings.service";
import { CalendarStore, createCalendarStore } from "./stores/calendar.store";
import { CodeBlockService } from "./calendar/codeblock";

declare module "obsidian" {
    interface App {
        plugins: {
            plugins: {
                "fantasy-calendar": Plugin;
            };
        };
    }
    interface Workspace {
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
        CalendariumAPI?: API;
    }
}
export const MODIFIER_KEY = Platform.isMacOS ? "Meta" : "Control";

export default class Calendarium extends Plugin {
    api = new API();
    watcher: Watcher;
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
    getStore(calendar: string) {
        if (!calendar) return null;
        const cal = this.data.calendars.find((c) => c.id == calendar);
        if (!cal) return null;
        if (!this.stores.has(cal)) {
            this.stores.set(cal, createCalendarStore(cal, this));
        }
        return this.stores.get(cal);
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

        this.watcher = new Watcher(this);
        (window["CalendariumAPI"] = this.api) &&
            this.register(() => delete window["CalendariumAPI"]);

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
