import type { CalDate, StaticCalendarData } from "./calendar";

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
    description?: string;
    format: string;
    endsYear: boolean;
    isEvent: boolean;
    eventDescription?: string;
    eventCategory?: string;
    static?: Partial<Omit<StaticCalendarData, "Eras">>;
    isStartingEra: boolean;
} & (
    | {
          isStartingEra: true;
      }
    | {
          date: CalDate;
          end?: CalDate;
      }
);
