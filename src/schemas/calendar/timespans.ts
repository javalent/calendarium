import type { EventLike } from "../events";
import type { CalDate, StaticCalendarData } from "./calendar";

/**
 * Timespans
 */
export type TimeSpan = {
    name: string | null;
    id: string;
};

export const TimeSpanType = {
    Era: "era",
    Day: "day",
    LeapDay: "leapday",
    Month: "month",
    IntercalaryMonth: "intercalary",
    Year: "year",
} as const;

export type TimeSpanType = (typeof TimeSpanType)[keyof typeof TimeSpanType];

/**
 * Days
 */
export type BaseDay = TimeSpan & {
    type: typeof TimeSpanType.Day | typeof TimeSpanType.LeapDay;
    name?: string | null;
    id?: string;
};

export type DefinedBaseDay = {
    number: number;
};

export type Day = BaseDay & {
    type: typeof TimeSpanType.Day;
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
    type: typeof TimeSpanType.LeapDay;
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
    type: typeof TimeSpanType.Month | typeof TimeSpanType.IntercalaryMonth;
    subtitle?: string;
    short?: string;
};

export type IntercalaryMonth = BaseMonth & {
    type: typeof TimeSpanType.IntercalaryMonth;
};

export type RegularMonth = BaseMonth & {
    type: typeof TimeSpanType.Month;
    week?: Week;
};

export type Month = RegularMonth | IntercalaryMonth;

/**
 * Years
 */
export type Year = TimeSpan & {
    type: typeof TimeSpanType.Year;
};

/**
 * Misc
 */
export type Era = EventLike & {
    type: typeof TimeSpanType.Era;
    name: string;
    description?: string;
    format: string;
    endsYear: boolean;
    category: string | null;
    eventDescription?: string;
    static?: Partial<Omit<StaticCalendarData, "Eras">>;
    isStartingEra: boolean;
} & (
        | {
              isStartingEra: true;
              isEvent: false;
              endsYear: false;
          }
        | {
              date: CalDate;
              end?: CalDate;
              isEvent: boolean;
          }
    );
