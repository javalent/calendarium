import { getContext } from "svelte";
import { setContext } from "svelte";
import type { CalendarContext } from "./view.types";

export function setTypedContext<T extends keyof CalendarContext>(
    key: T,
    value: CalendarContext[T]
): void {
    setContext(key, value);
}

export function getTypedContext<T extends keyof CalendarContext>(
    key: T
): CalendarContext[T] {
    return getContext(key);
}
