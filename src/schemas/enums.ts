import type { EventType } from "src/events/event.types";
import { TimeSpanType, type Era } from "./calendar/timespans";
import type { EventLike } from "./events";

export type EventLikeType = TimeSpanType | EventType;

export function isEra(event: EventLike): event is Era {
    return event.type === TimeSpanType.Era;
}
