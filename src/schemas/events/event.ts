import type { EventType } from "src/events/event.types";
import type { UndatedCalDate } from "../calendar";

/**
 * Events
 */
export type CalEventSort = {
    timestamp: number;
    order: string;
};

export type OneTimeCalEventDate = {
    year: number;
    month: number;
    day: number;
};

export type RecurringCalEventDate = {
    year: FullCalEventDateBit;
    month: FullCalEventDateBit;
    day: FullCalEventDateBit;
};

export type CalEventDate = OneTimeCalEventDate | RecurringCalEventDate;

export type RecurringCalEventDateBit = [number | null, number | null];
export type FullCalEventDateBit = RecurringCalEventDateBit | number;

type BaseCalEvent = {
    id: string;
    name: string;
    description?: string | null;
    img?: string | null;
    note?: string | null;
    category: string | null;
    sort: CalEventSort;
    type?: EventType;
};

export type DatedCalEventInfo = {
    type?: typeof EventType.Date;
    date: OneTimeCalEventDate;
};
export type DatedCalEvent = BaseCalEvent & DatedCalEventInfo;
export type UndatedCalEventInfo = {
    type: typeof EventType.Undated;
    date: UndatedCalDate;
};
export type UndatedCalEvent = BaseCalEvent & UndatedCalEventInfo;

export type RangeCalEventInfo = {
    type: typeof EventType.Range;
    date: OneTimeCalEventDate;
    end: OneTimeCalEventDate;
};
export type RangeCalEvent = BaseCalEvent & RangeCalEventInfo;

export type RangedCalEventInfo = {
    type: typeof EventType.Recurring;
    date: RecurringCalEventDate;
};
export type RecurringCalEvent = BaseCalEvent & RangedCalEventInfo;

/* export type FormulaCalEvent = BaseCalEvent & {
    type: EventType.Formula;
    formulas: Formula[];
}; */

export type CalEventInfo =
    | DatedCalEventInfo
    | RangedCalEventInfo
    | RangeCalEventInfo
    | UndatedCalEventInfo;
export type CalEvent =
    | DatedCalEvent
    | RecurringCalEvent
    | RangeCalEvent
    | UndatedCalEvent; /* 
    | FormulaCalEvent; */

export type CalEventCategory = {
    name: string;
    color: string;
    id: string;
};
