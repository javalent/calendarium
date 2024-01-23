import type { CalEventDate, CalEvent, CalEventCategory } from "../events";
import type { Moon } from "./moons";
import type { Week, Month, LeapDay, Era, Year } from "./timespans";

export type CalDate = {
    year: number;
    month: number;
    day: number;
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
