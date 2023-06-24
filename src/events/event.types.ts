export enum EventCombinator {
    AND,
    OR,
    NAND,
    XOR,
}
export enum EventOperator {
    Plus,
    Minus
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
    Event
}