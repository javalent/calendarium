import type { CalDate, CalEvent, Calendar } from "src/@types";
import { EventCache } from "./cache/event-cache";
import { type Writable, derived, get, writable } from "svelte/store";

export class EventStore {
    /**
     * This is the source of truth of events for a given calendar.
     * It maps EventId -> Event.
     *
     * Initialized with events from the calendar data object.
     * Events parsed from files & new events added to calendar data are added to it after the fact.
     *
     * This triggers the event cache to be invalidated, which triggers a day update through
     * the derived DayEventCache store.
     *
     * Events added to this ARE NOT SYNCED BACK TO THE DATA.
     */
    #events: Writable<Map<string, CalEvent>>;

    /** This is a map of FilePath -> EventId[].
     * Used to remove events by ID from the #events Svelte store.
     */
    #fileEvents: Map<string, string[]> = new Map();

    /** Set of file events. Maintained only to check if a file is a file event. */
    #fileEventSet: Set<string> = new Set();
    public getEvents() {
        return [...get(this.#events).values()];
    }

    #eventCache: EventCache;

    constructor(public calendar: Calendar) {
        this.#events = writable(
            new Map((calendar.events ?? []).map((e) => [e.id, e]))
        );
        this.#eventCache = new EventCache(
            derived(this.#events, (e) => [...e.values()])
        );
    }

    public getEventsForDate(date: CalDate) {
        return this.#eventCache.getItemsOrRecalculate(date);
    }

    public insertEvents(...events: CalEvent[]) {
        this.#events.update((SAVED_EVENTS) => {
            for (const event of events) {
                SAVED_EVENTS.set(event.id, event);
                this.#eventCache.invalidate(event.date);
            }
            return SAVED_EVENTS;
        });
    }
    public insertEventsFromFile(path: string | null, ...events: CalEvent[]) {
        if (!path) return;
        this.#fileEvents.set(path, [
            ...(this.#fileEvents.get(path) ?? []),
            ...events.map((e) => e.id),
        ]);
        for (const event of events) {
            this.#fileEventSet.add(event.id);
        }
        this.insertEvents(...events);
    }

    public removeEventsFromFile(filePath: string) {
        const eventIds = this.#fileEvents.get(filePath) ?? [];
        if (!eventIds.length) return;

        this.#events.update((SAVED_EVENTS) => {
            for (const id of eventIds) {
                if (!SAVED_EVENTS.has(id)) continue;
                const date = { ...SAVED_EVENTS.get(id)!.date };
                SAVED_EVENTS.delete(id);
                this.#eventCache.invalidate(date);
                this.#fileEventSet.delete(id);
            }

            this.#fileEvents.delete(filePath);

            return SAVED_EVENTS;
        });
    }
    public removeAllFileEvents() {
        this.#events.update((SAVED_EVENTS) => {
            for (const id of this.#fileEventSet) {
                if (!SAVED_EVENTS.has(id)) continue;
                const date = { ...SAVED_EVENTS.get(id)!.date };
                SAVED_EVENTS.delete(id);
                this.#eventCache.invalidate(date);
                this.#fileEventSet.delete(id);
            }

            this.#fileEvents = new Map();
            this.#fileEventSet = new Set();

            return SAVED_EVENTS;
        });
    }

    public isFileEvent(eventId: string) {
        return this.#fileEventSet.has(eventId);
    }
    public isRemovable(eventId: string) {
        return !this.isFileEvent(eventId);
    }
}
