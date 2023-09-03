import type { Calendar, CalDate, CalEvent } from "src/@types";
import { CalendarStore } from "src/stores/calendar.store";
import { compareEvents } from "src/utils/functions";
import { get } from "svelte/store";

export class API {
    #store: CalendarStore;
    #object: Calendar;
    constructor(store: CalendarStore) {
        this.#store = store;
    }

    /**
     * Transform a day, month, year definition into a CalDate
     * @param day Day number
     * @param month Month number (0 indexed)
     * @param year Year number
     * @returns {CalDate}
     */
    getDate(day: number, month: number, year: number): CalDate {
        return { day, month, year };
    }

    /**
     * Get the current date.
     * @returns {CalDate} The current date specified on the calendar.
     */
    getCurrentDate(): CalDate {
        return get(this.#store.current);
    }

    /** Get all events for the loaded calendar. */
    getEvents(): CalEvent[] {
        return this.#store.eventStore.getEvents();
    }

    /** Get all events on a specific date. */
    getEventsOnDay(day: CalDate): CalEvent[] {
        return get(this.#store.eventStore.getEventsForDate(day));
    }

    /** Compare two events */
    compareEvents(event1: CalEvent, event2: CalEvent): number {
        return compareEvents(event1, event2);
    }
}
