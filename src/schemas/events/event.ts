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
