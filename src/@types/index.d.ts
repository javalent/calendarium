export * from "./calendar";
export * from "./event";
export * from "./moons";

import type { Calendar } from "./calendar";

export type Nullable<T> = T | null;

export interface CalendariumData {
    addToDefaultIfMissing: boolean;
    calendars: Calendar[];
    configDirectory: string;
    dailyNotes: boolean;
    dateFormat: string;
    defaultCalendar: string;
    eventFrontmatter: boolean;
    eventPreview: boolean;
    exit: {
        saving: boolean;
        event: boolean;
        calendar: boolean;
    };
    parseDates: boolean;
    settingsToggleState: {
        calendars: boolean;
        events: boolean;
        advanced: boolean;
    };
    showIntercalary: boolean;
    version: {
        major: number;
        minor: number;
        patch: number | string;
    };
    debug: boolean;
    askedToMoveFC: boolean;
}

export interface CalendariumCodeBlockParameters {
    /** Name of the calendar you wish to display.
     * If omitted, the code block will display the default calendar specified in settings.
     */
    calendar?: string;
}
