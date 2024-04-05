import type { CalEvent, EventLike } from "src/schemas";

export const EventType = {
    Date: "Date",
    Range: "Range",
    Recurring: "Recurring",
    Undated: "Undated",
    // …
} as const;

// Overload the type
export type EventType = (typeof EventType)[keyof typeof EventType];

export function isCalEvent(event: EventLike): event is CalEvent {
    return event.type in EventType;
}
