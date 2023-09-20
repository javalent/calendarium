import type { CalendariumData, PresetCalendar } from "src/@types";
import { SyncBehavior } from "../schemas";

export const DEFAULT_CALENDAR: PresetCalendar = {
    name: "",
    description: "",
    id: null,
    static: {
        incrementDay: false,
        firstWeekDay: 0,
        overflow: true,
        weekdays: [],
        months: [],

        moons: [],
        displayMoons: true,
        displayDayNumber: false,
        leapDays: [],
        eras: [],
    },
    current: {
        year: null,
        month: null,
        day: null,
    },
    events: [],
    categories: [],
    autoParse: false,
    path: ["/"],
    supportInlineEvents: false,
    inlineEventTag: "#inline-events",
};

export const DEFAULT_DATA: CalendariumData = {
    addToDefaultIfMissing: true,
    calendars: [],
    deletedCalendars: [],
    configDirectory: null,
    dailyNotes: false,
    dateFormat: "YYYY-MM-DD",
    defaultCalendar: null,
    eventPreview: false,
    exit: {
        saving: false,
        event: false,
        calendar: false,
    },
    eventFrontmatter: false,
    parseDates: false,
    settingsToggleState: {
        calendars: false,
        events: false,
        advanced: true,
    },
    showIntercalary: false,
    version: {
        major: null,
        minor: null,
        patch: null,
    },
    debug: false,
    askedToMoveFC: false,
    askedAboutSync: false,
    syncBehavior: SyncBehavior.enum.Ask,
};
