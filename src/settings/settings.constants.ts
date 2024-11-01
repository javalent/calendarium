import type { CalendariumData, PresetCalendar } from "src/@types";
import { SyncBehavior } from "../schemas";

export const PathSelections = {
    DEFAULT: "DEFAULT",
} as const;
export type PathSelections =
    (typeof PathSelections)[keyof typeof PathSelections];
export const DEFAULT_CALENDAR: PresetCalendar = {
    name: null,
    description: "",
    id: null,
    showIntercalarySeparately: true,
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
    configDirectory: null,
    dailyNotes: false,
    dateFormat: "YYYY-MM-DD",
    defaultCalendar: null,
    eventPreview: false,
    exit: {
        saving: false,
        event: false,
        calendar: false,
        savingEvent: false,
    },
    eventFrontmatter: false,
    parseDates: false,
    version: {
        major: null,
        minor: null,
        patch: null,
        beta: null,
    },
    debug: false,
    askedToMoveFC: false,
    askedAboutSync: false,
    syncBehavior: SyncBehavior.Ask,
    inlineEventsTag: null,
    paths: [["/", PathSelections.DEFAULT]],
};
