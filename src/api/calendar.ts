import copy from "fast-copy";
import type { Calendar, CalDate, CalEvent } from "src/@types";
import { CalEventHelper } from "src/events/event.helper";
import type { Season } from "src/schemas/calendar/seasonal";
import type { CalendarStore } from "src/stores/calendar.store";
import { compareEvents, dateString, sortEventList } from "src/utils/functions";
import { get } from "svelte/store";

export class CalendarAPI {
    #store: CalendarStore;
    #object: Calendar;
    #helper: CalEventHelper;
    constructor(store: CalendarStore, object: Calendar) {
        this.#store = store;
        this.#object = object;
        this.#helper = new CalEventHelper(object, false);
    }

    /**
     * Access the calendar store.
     * @returns {CalendarStore}
     */
    getStore() {
        return this.#store;
    }

    /**
     * Get a copy of the Calendar object.
     * @returns {Calendar} The calendar object.
     */
    getObject(): Calendar {
        return copy(this.#object);
    }

    /**
     * Transform a string (in calendar format) into a CalDate
     * @param dateString
     * @returns {CalDate}
     */
    parseDate(dateString: string): CalDate {
        const date = this.#helper.parseCalDateString(dateString, {
            path: "",
            basename: "api-call",
        });
        return date as CalDate;
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

    /**
     * Get all events on a specific date.
     * @param {CalDate} day
     * @returns {CalEvent[]}
     */
    getEventsOnDay(day: CalDate): CalEvent[] {
        return get(this.#store.eventStore.getEventsForDate(day));
    }

    /**
     * Get a sorted list of events.
     * @param {CalEvent[]} events
     * @returns {CalEvent[]}
     */
    sortEvents(events: CalEvent[]): CalEvent[] {
        return sortEventList(events);
    }

    /**
     * Compare two events to determine sort order.
     * @param event1
     * @param event2
     * @returns {number} Sort order
     */
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
     * @param {CalDate} date Date to convert to a formatted string
     * @param {CalDate} end Optional end date for multi-day events
     * @param {string} dateFormat Optional date format string
     * @returns formatted string
     */
    toDisplayDate(date: CalDate, end?: CalDate | null, dateFormat?: string): string {
        return dateString(date, this.#object, end, dateFormat);
    }

    //TODO: Implement
    /* toCalendarDate(date: string, dateFormat?: string): CalDate {
        if (!this.#helper) {
            this.#helper = new CalEventHelper(this.#object, false);
        }
    } */

    /** Seasonal APIs */

    /**
     *
     * @returns A list of all seasons on the calendar.
     */
    getSeasons(): Season[] {
        return copy(this.#object.static.seasonal.seasons);
    }

    /**
     *
     * @param date The date for which to calculate the current season.
     * @returns The applicable season for that date, if any.
     */
    getSeasonForDate(date: CalDate): Season | undefined {
        return copy(
            get(this.#store.seasonCache.getItemsOrRecalculate(date)).shift()
        );
    }
}
