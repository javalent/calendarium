export const EventType = {
    Date: "Date",
    Range: "Range",
    Recurring: "Recurring",
    Undated: "Undated",
    // …
} as const;

// Overload the type
export type EventType = (typeof EventType)[keyof typeof EventType];
