import { Moon } from ".";
import { CalEvent, CalEventCategory } from ".";

export interface CalDate {
    day: number;
    month: number;
    year: number;
}

export interface Calendar {
    deleted?: boolean;
    deletedTimestamp?: number;
    id: string;
    name: string;
    description: string;
    static: StaticCalendarData;
    current: CalDate;
    events: CalEvent[];
    categories: CalEventCategory[];
    date?: number;
    displayWeeks?: boolean;
    autoParse: boolean;
    path: string[];
    supportInlineEvents: boolean;
    inlineEventTag: string;
    dateFormat?: string;
}
export interface StaticCalendarData {
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
}

export interface CalDate {
    year: number;
    month: number;
    day: number;
}

export interface TimeSpan {
    type: string;
    name: string;
    id: string;
}

export type BaseDay = TimeSpan & {
    type: "day" | "leapday";
};
export type DefinedeDay = {
    number: number;
};
export type Day = BaseDay & {
    type: "day";
};
export type DefinedDay = Day &
    DefinedDay & {
        type: "day";
    };
export type LeapDay = BaseDay & {
    type: "leapday";
    interval: LeapDayCondition[];
    timespan: number;
    intercalary: boolean;
    offset: number;
    numbered?: boolean;
    after?: number;
};

export type DefinedLeapDay = LeapDay & DefinedDay;

export type DayOrLeapDay = DefinedDay | DefinedLeapDay;
export interface Year extends TimeSpan {}

export type Week = Day[];

interface BaseMonth extends TimeSpan {
    length: number;
    interval: number;
    offset: number;
    type: "month" | "intercalary";
    subtitle?: string;
}
export interface RegularMonth extends BaseMonth {
    type: "month";
    week?: Week;
}
export interface IntercalaryMonth extends BaseMonth {
    type: "intercalary";
}
export type Month = RegularMonth | IntercalaryMonth;

interface LeapDayCondition {
    ignore: boolean; //ignore offset
    exclusive: boolean; //causes failure if true
    interval: number; //how many years between checking
}

/**
Example Condition

400,!100,4 - Every 4 years, unless it is divisible by 100, but again if it is divisible by 400.

[
    {
        ignore: false,
        exclusive: false,
        interval: 400
    },
    {
        ignore: false,
        exclusive: true,
        interval: 100
    },
    {
        ignore: false,
        exclusive: false,
        interval: 4
    }
]

 */

export interface Season {
    name: string;
    start: {
        month: Month;
        day: Day;
    };
}

export interface Era {
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
}
