import type { Calendar, CalDate, CalEvent } from "src/@types";
import { CalendarStore } from "src/stores/calendar.store";
import { compareEvents, dateString } from "src/utils/functions";
import { get } from "svelte/store";

export class CalendarAPI {
    #store: CalendarStore;
    #object: Calendar;
    constructor(store: CalendarStore, object: Calendar) {
        this.#store = store;
        this.#object = object;
    }

    /**
     * Access the calendar store.
     * @returns {CalendarStore}
     */
    getStore() {
        return this.#store;
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

    /**
     * Return a display string for an event.
     *
     * Use the following in your formatting string:
     *
     * - `Y` - any number of Y will bring the full year.
     *     - If your calendar uses named years, you'll get the name.
     * - `M` - the month as a number.
     * - `MM` - the month as a number, zero padded, minimum of two digits.
     * - `MMM` - the month name, abbreviated (if available).
     * - `MMMM` - the full month name
     * - `D` - the day of the month, unpadded.
     * - `DD` - the day of the month, zero padded, minimum of two digits.
     *
     * @param date Date to convert to a formatted string
     * @param end Optional end date for multi-day events
     * @param dateFormat Optional date format string
     * @returns formatted string
     */
    toDisplayDate(date: CalDate, end?: CalDate, dateFormat?: string): string {
        return dateString(date, this.#object, end, dateFormat);
    }
}
