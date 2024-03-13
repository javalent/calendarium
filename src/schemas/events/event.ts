import type { EventType } from "src/events/event.types";

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

export type RangedCalEventDate = {
    year: Array<number> | number | null;
    month: Array<number> | number | null;
    day: Array<number> | number | null;
};

type Formula = {
    type: "interval";
    number: number;
    timespan: "days";
};

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
    date: CalEventDate;
};
export type DatedCalEvent = BaseCalEvent & DatedCalEventInfo;

export type SpanCalEventInfo = {
    type: typeof EventType.Range;
    date: CalEventDate;
    end: CalEventDate;
};
export type SpanCalEvent = BaseCalEvent & SpanCalEventInfo;

export type RangedCalEventInfo = {
    type: typeof EventType.Recurring;
    date: RangedCalEventDate;
};
export type RangeCalEvent = BaseCalEvent & RangedCalEventInfo;

/* export type FormulaCalEvent = BaseCalEvent & {
    type: EventType.Formula;
    formulas: Formula[];
}; */

export type CalEventInfo =
    | DatedCalEventInfo
    | RangedCalEventInfo
    | SpanCalEventInfo;
export type CalEvent = DatedCalEvent | RangeCalEvent | SpanCalEvent; /* 
    | FormulaCalEvent; */

export type CalEventCategory = {
    name: string;
    color: string;
    id: string;
};
