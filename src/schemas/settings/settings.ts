import type { Calendar, DeletedCalendar } from "../calendar";

export enum SyncBehavior {
    Ask = "Ask",
    Always = "Always",
    Never = "Never",
}

export type Version = {
    major?: number | null;
    minor?: number | null;
    patch?: number | null;
    beta?: number | null;
    /* patch?: z.union([number, string]), */
};
export type CalendariumData = {
    addToDefaultIfMissing: boolean;
    askedToMoveFC: boolean;
    askedAboutSync: boolean;
    calendars: Calendar[];
    configDirectory?: string | null;
    dailyNotes: boolean;
    dateFormat: string;
    debug: boolean;
    defaultCalendar: string | null;
    deletedCalendars: DeletedCalendar[];
    eventFrontmatter: boolean;
    eventPreview: boolean;
    exit: {
        saving: boolean;
        event: boolean;
        calendar: boolean;
    };
    inlineEventsTag?: string | null;
    parseDates: boolean;
    syncBehavior: SyncBehavior;
    paths: Readonly<[string, string]>[];
    version: Version;
};

export type MarkdownCalendariumData = Omit<CalendariumData, "">;
