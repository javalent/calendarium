export type CalDate = {
    year: number;
    month: number;
    day: number;
};

/**
 * Events
 */
export type CalEventSort = {
    timestamp: number;
    order: string;
};

export type CalEventDate = {
    year: number | null;
    month: number | null;
    day: number | null;
};

type Formula = {
    type: "interval";
    number: number;
    timespan: "days";
};
export type CalEvent = {
    name: string;
    description?: string | null;
    date: CalEventDate;
    end?: CalEventDate | null;
    id: string;
    note?: string | null;
    category: string | null;
    sort: CalEventSort;
    formulas?: Formula[];
    img?: string | null;
};

export type CalEventCategory = {
    name: string;
    color: string;
    id: string;
};

/**
 * Moons
 */
export type Moon = {
    name: string;
    cycle: number;
    offset: number;
    faceColor: string;
    shadowColor: string;
    id: string;
};

export type Phase =
    | "New Moon"
    | "New Moon Fading"
    | "New Moon Faded"
    | "Waxing Crescent Rising"
    | "Waxing Crescent Risen"
    | "Waxing Crescent"
    | "Waxing Crescent Fading"
    | "Waxing Crescent Faded"
    | "First Quarter Rising"
    | "First Quarter Risen"
    | "First Quarter"
    | "First Quarter Fading"
    | "First Quarter Faded"
    | "Waxing Gibbous Rising"
    | "Waxing Gibbous Risen"
    | "Waxing Gibbous"
    | "Waxing Gibbous Fading"
    | "Waxing Gibbous Faded"
    | "Full Moon Rising"
    | "Full Moon Risen"
    | "Full Moon"
    | "Full Moon Fading"
    | "Full Moon Faded"
    | "Waning Gibbous Rising"
    | "Waning Gibbous Risen"
    | "Waning Gibbous"
    | "Waning Gibbous Fading"
    | "Waning Gibbous Faded"
    | "Last Quarter Rising"
    | "Last Quarter Risen"
    | "Last Quarter"
    | "Last Quarter Fading"
    | "Last Quarter Faded"
    | "Waning Crescent Rising"
    | "Waning Crescent Risen"
    | "Waning Crescent"
    | "Waning Crescent Fading"
    | "Waning Crescent Faded"
    | "New Moon Rising"
    | "New Moon Risen";

export type MoonState = Moon & {
    phase: Phase;
};
/**
 * Timespans
 */
export type TimeSpan = {
    type: string;
    name: string | null;
    id: string;
};

/**
 * Days
 */
export type BaseDay = TimeSpan & {
    type: "day" | "leapday";
    name?: string | null;
    id?: string;
};

export type DefinedBaseDay = {
    number: number;
};

export type Day = BaseDay & {
    type: "day";
    abbreviation?: string;
};

export type DefinedDay = Day & DefinedBaseDay;
export type Week = Day[];

export type LeapDayCondition = {
    ignore?: boolean;
    exclusive?: boolean;
    interval: number;
};

export type LeapDay = BaseDay & {
    type: "leapday";
    short?: string;
    interval: LeapDayCondition[];
    timespan: number;
    intercalary: boolean;
    offset: number;
    numbered?: boolean;
    after?: number;
};
export type DefinedLeapDay = LeapDay & DefinedBaseDay;

export type DayOrLeapDay = DefinedLeapDay | DefinedDay;
/**
 * Months
 */
type BaseMonth = TimeSpan & {
    length: number;
    interval: number;
    offset: number;
    type: "month" | "intercalary";
    subtitle?: string;
    short?: string;
};

export type IntercalaryMonth = BaseMonth & {
    type: "intercalary";
};

export type RegularMonth = BaseMonth & {
    type: "month";
    week?: Week;
};

export type Month = RegularMonth | IntercalaryMonth;

/**
 * Years
 */
export type Year = TimeSpan;

/**
 * Misc
 */
export type Season = {
    name: string;
    start: {
        month: Month;
        day: Day;
    };
};
export type Era = {
    id: string;
    name: string;
    format: string;
    restart: boolean;
    endsYear: boolean;
    event: boolean;
    start: CalDate;
    eventDescription?: string;
    eventCategory?: string;
    description?: string;
};

/**
 * Static
 */
export type StaticCalendarData = {
    firstWeekDay: number;
    overflow: boolean;
    weekdays: Week;
    months: Month[];
    leapDays: LeapDay[];
    moons: Moon[];
    displayMoons: boolean;
    displayDayNumber: boolean;
    eras: Era[];
    offset?: number;
    incrementDay: boolean;
    useCustomYears?: boolean;
    years?: Year[];
    padMonths?: number;
    padDays?: number;
};

/**
 * Calendar
 */
type BaseCalendar = {
    id: string | null;
    name: string | null;
    description: string;
    static: StaticCalendarData;
    current: CalDate | CalEventDate;
    events: CalEvent[];
    categories: CalEventCategory[];
    date?: number;
    displayWeeks?: boolean;
    autoParse: boolean;
    path: string[];
    supportInlineEvents: boolean;
    inlineEventTag?: string | null;
    dateFormat?: string;
    showIntercalarySeparately: boolean;
};

export type Calendar = BaseCalendar & {
    id: string;
    name: string;
    description: string;
    current: CalDate;
};
export type DeletedCalendar = Calendar & {
    deletedTimestamp: number;
};
export type PresetCalendar = BaseCalendar & {
    id: null;
    name: string | null;
    current: CalEventDate;
};

/**
 * Data
 */
export type CalendariumCodeBlockParameters = {
    calendar?: string;
};

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
