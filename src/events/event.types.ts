/* export enum EventType {
    Recurring,
    Range,
    Date,
} */
export const EventType = Object.freeze({
    Recurring: "Recurring",
    Range: "Range",
    Date: "Date",
    // …
});

// Overload the type
export type EventType = (typeof EventType)[keyof typeof EventType];

export enum EventCombinator {
    AND,
    OR,
    NAND,
    XOR,
}
export enum EventOperator {
    Plus,
    Minus,
}
export enum EventCondition {
    Equals,
    GreaterThan,
    GreaterThanOrEqual,
    LessThan,
    LessThanOrEqual,
    Every,
}
export enum EventTimespan {
    Date,
    Year,
    Month,
    MonthNumber,
    Week,
    WeekNumber,
    WeekNumberInMonth,

    Moon,
    Random,
    Event,
}
