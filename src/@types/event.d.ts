import { Nullable } from ".";

export interface CalEventSort {
    timestamp: number;
    order: string;
}
export interface CalEventDate {
    year: Nullable<number>,
    month: Nullable<number>,
    day: Nullable<number>
}

export interface CalEvent {
    name: string;
    description: string;
    date: CalEventDate;
    end?: CalEventDate;
    id: string;
    note: string;
    category: string;
    sort: CalEventSort;
    formulas?: EventFormula[];
    img?: string;
}

type EventFormula = FormulaInterval;
interface FormulaInterval {
    type: "interval";
    number: number;
    timespan: "days";
}

export interface ColorEvent extends CalEvent {
    color: string;
}

export interface CalEventCategory {
    name: string;
    color: string;
    id: string;
}

export interface CalEventCondition {}
