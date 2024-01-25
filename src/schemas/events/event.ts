/**
 * Events
 */
export type CalEventSort = {
    timestamp: number;
    order: string;
};

export type DatePart = number | null;

export type CalEventDate = {
    year: DatePart;
    month: DatePart;
    day: DatePart;
};

type Formula = {
    type: "interval";
    number: number;
    timespan: "days";
};

export enum CalEventType {
    Dated = "Dated",
    Range = "Range",
    Periodic = "Periodic",
    Formula = "Formula",
}
type BaseCalEvent = {
    name: string;
    description?: string | null;
    id: string;
    note?: string | null;
    category: string | null;
    sort: CalEventSort;
    img?: string | null;
    type?: CalEventType;
};
export type DatedCalEvent = BaseCalEvent & {
    type: CalEventType.Dated;
    date: CalEventDate;
};
export type RangeCalEvent = BaseCalEvent & {
    type: CalEventType.Range;
    date: CalEventDate;
    end: CalEventDate;
};
export type PeriodicCalEvent = BaseCalEvent & {
    type: CalEventType.Periodic;
    periods: {
        year: [DatePart] | [DatePart, DatePart];
        month: [DatePart] | [DatePart, DatePart];
        day: [DatePart] | [DatePart, DatePart];
    };
};

export type CalEvent = DatedCalEvent | RangeCalEvent | PeriodicCalEvent;

export type CalEventCategory = {
    name: string;
    color: string;
    id: string;
};
