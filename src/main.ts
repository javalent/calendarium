import { Platform, Plugin, WorkspaceLeaf, addIcon } from "obsidian";

import CalendariumSettings from "./settings/settings.view";

import type { Calendar, CalendariumData } from "./@types";
import CalendariumView from "./calendar/view";

import { Watcher } from "./watcher/watcher";
import { API } from "./api/api";
import { SettingsService } from "./settings/settings.service";
import {
    type CalendarStore,
    createCalendarStore,
    incrementDay,
    decrementDay,
} from "./stores/calendar.store";
import { CodeBlockService } from "./calendar/codeblock";
import { DEFAULT_FORMAT } from "./utils/constants";
import { CalendariumNotice } from "./utils/notice";

import { ViewType } from "./calendar/view.types";
import { AgendaView } from "./agenda/view.agenda";

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

    /**
     * Settings
     */
    get configDir(): string {
        return (
            this.manifest.dir ??
            this.app.vault.configDir + "/plugins/calendarium"
        );
    }
    private settings$ = SettingsService;
    get data() {
        return this.settings$.getData();
    }
    get calendars() {
        return this.settings$.getCalendars();
    }
    public onSettingsLoaded(callback: () => any) {
        this.settings$.onSettingsLoaded(callback);
    }
    public onLayoutReadyAndSettingsLoad(callback: () => any) {
        this.settings$.onLayoutReadyAndSettingsLoad(callback);
    }
    public async saveSettings() {
        await this.settings$.save();
    }
    public hasCalendar(calendar: string): boolean {
        return this.settings$.hasCalendar(calendar);
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
    /**
     * This is here so that I can properly type the data being saved.
     */
    public async saveData(data: CalendariumData) {
        await super.saveData(data);
    }
    async onExternalSettingsChange() {
        this.settings$.onExternalSettingsChange();
    }

    /**
     * Stores
     */
    private readonly stores: WeakMap<Calendar, CalendarStore> = new WeakMap();
    public getStoreByCalendar(calendar: Calendar): CalendarStore {
        if (!this.stores.has(calendar)) {
            this.stores.set(calendar, createCalendarStore(calendar, this));
        }
        return this.stores.get(calendar)!;
    }
    /** Get a store by ID */
    public getStore(calendar: string) {
        if (!calendar) return null;
        const cal = this.data.calendars.find((c) => c.id == calendar);
        if (!cal) return null;
        return this.getStoreByCalendar(cal);
    }

    public flushFileEvents() {
        for (const calendar of this.calendars) {
            this.stores.get(calendar)?.flushFileEvents();
        }
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
        SettingsService.initialize(this, this.manifest);
        await this.settings$.loadData();

        /** Add Icons */
        addIcon(
            "calendarium-between-horizontal-start",
            `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-between-horizontal-start"><rect width="13" height="7" x="8" y="3" rx="1"/><path d="m2 9 3 3-3 3"/><rect width="13" height="7" x="8" y="14" rx="1"/></svg>`
        );

        this.watcher = new Watcher(this);

        (window["Calendarium"] = this.api) &&
            this.register(() => delete window["Calendarium"]);

        this.registerView(
            ViewType.Calendarium,
            (leaf: WorkspaceLeaf) => new CalendariumView(leaf, this)
        );
        this.registerView(
            ViewType.Agenda,
            (leaf: WorkspaceLeaf) => new AgendaView(leaf, this)
        );

        new CodeBlockService(this).load();

        this.app.workspace.onLayoutReady(async () => {
            this.addCommands();

            this.addRibbonIcon(
                ViewType.Calendarium,
                "Open Calendarium",
                (evt) => {
                    this.addCalendarView({
                        full: evt.getModifierState(
                            Platform.isMacOS ? "Meta" : "Control"
                        ),
                    });
                }
            );
        });
        this.settings$.onLayoutReadyAndSettingsLoad(() => {
            this.watcher.load();
            this.addSettingTab(new CalendariumSettings(this));
            /* this.addCalendarView({ startup: true }); */
        });

        this.app.workspace.trigger("parse-style-settings");
    }

    async onunload() {
        console.log("Unloading Calendarium v" + this.manifest.version);
        this.watcher?.unload();

        for (const notice of this.#notices) {
            notice?.hide();
        }
    }

    addCommands() {
        this.addCommand({
            id: "open-calendarium",
            name: "Open calendar",
            callback: () => {
                this.addCalendarView();
            },
        });

        this.addCommand({
            id: "insert-calendarium-current-date",
            name: "Insert Current Date",
            /* Insert the current date from the default calendar at the current cursor location. */
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.insertCurrentDate(this.settings$.getDefaultCalendar(), editor, this.api);
            },
        });

        this.addCommand({
            id: "advance-calendarium-current-date",
            name: "Set Current Date to Next",
            callback: () => {
                const defaultCal = this.settings$.getDefaultCalendar();
                const store = this.getStoreByCalendar(defaultCal);
                this.changeDay(defaultCal, store, incrementDay);
            },
        });

        this.addCommand({
            id: "previous-calendarium-current-date",
            name: "Set Current Date to Previous",
            callback: () => {
                const defaultCal = this.settings$.getDefaultCalendar();
                const store = this.getStoreByCalendar(defaultCal);
                this.changeDay(defaultCal, store, decrementDay);
            },
        });
    }

    addCalendarView(params: { full?: boolean; startup?: boolean } = {}) {
        if (
            params?.startup &&
            this.app.workspace.getLeavesOfType(ViewType.Calendarium)?.length
        )
            return;
        this.getLeaf(params?.full ?? false);
    }
    getLeaf(full: boolean) {
        let leaf: WorkspaceLeaf | null = full
            ? this.app.workspace.getLeaf(true)
            : this.app.workspace.getRightLeaf(false);

        leaf?.setViewState({
            type: ViewType.Calendarium,
        });

        if (leaf) this.app.workspace.revealLeaf(leaf);

        return leaf;
    }

    insertCurrentDate(calendar: Calendar, editor: Editor, api: API) {
        const currentCalDate = calendar.current;
        const calendarApi = api.getAPI(calendar.name);
        const dateString = calendarApi.toDisplayDate(currentCalDate, calendar.dateFormat);
        const cursor = editor.getCursor();
        editor.replaceRange(dateString, cursor);
        cursor.ch += dateString.length;
        editor.setCursor(cursor);
    }

    changeDay(
        calendar: Calendar,
        store: CalendarStore,
        changeFunction: (date: CalDate, yearCalculator: YearStoreCache, config: StaticCalendarData) => CalDate) {
        const currentCalDate = calendar.current;
        const newDay = changeFunction(currentCalDate, store.yearCalculator, store.staticStore.staticData);
        store.setCurrentDate(newDay);
    }
}
