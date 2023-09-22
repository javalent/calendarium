import Calendarium from "src/main";
import { CalendarAPI } from "./calendar";
import type { CalDate, CalEvent, Calendar } from "src/@types";
import type { CalendarStore } from "src/stores/calendar.store";
import { get } from "svelte/store";

export class API {
    constructor(private plugin: Calendarium) {}
    #getStore(calendar: string | Calendar): CalendarStore {
        let store: CalendarStore | null = null;
        if (typeof calendar === "string") {
            store = this.plugin.getStore(
                this.plugin.data.calendars.find((c) => c.name == calendar)
                    ?.id ?? ""
            );
        } else {
            store = this.plugin.getStoreByCalendar(calendar);
        }
        if (!store)
            throw new ReferenceError("No calendar by that name exists.");
        return store;
    }
    /**
     * Used to retrieve a Calendar API.
     * This can be used to obtain calendar-specific information, such as lists of events.
     *
     * @param calendarName Name of the calendar you need an API for.
     * @returns An instance of the Calendar API.
     */
    getAPI(calendarName: string): CalendarAPI {
        const calendar = this.plugin.data.calendars.find(
            (c) => c.name == calendarName
        );
        if (!calendar)
            throw new ReferenceError("No calendar store by that name exists.");
        const store = this.#getStore(calendar);
        return new CalendarAPI(store, calendar);
    }
    /**
     * Translate an event from one calendar to another.
     *
     * @param event
     * @param original
     * @param target
     */
    translate(
        date: CalDate,
        original: CalendarAPI,
        target: CalendarAPI
    ): CalDate {
        if (date.year == null || date.month == null || date.day == null) {
            throw new Error(
                "In order for an date to be translated, it must be fully defined."
            );
        }
        /**
         * Get my stores.
         */
        const originalStore = original.getStore();
        const targetStore = target.getStore();

        /**
         * Get the number of days before the requested date in the original calendar.
         */
        const daysBeforeEvent = originalStore.getDaysBeforeDate(date);

        /**
         * My best guess at the new target date.
         * This is the number of days divided by the basic number of days in a year.
         * We will modify this best guess date as we go to find the "real" date.
         */
        const targetBestGuessDate = {
            year: Math.floor(
                daysBeforeEvent / targetStore.staticStore.getDaysInAYear()
            ),
            month: 0,
            day: 1,
        };
        /**
         * Find the days before the above guess on the target calendar.
         */
        const daysBeforeBestGuess =
            targetStore.getDaysBeforeDate(targetBestGuessDate);

        /**
         * Wow, we got really lucky.
         */
        if (daysBeforeBestGuess === daysBeforeEvent) {
            return targetBestGuessDate;
        }
        /**
         * If the best guess is *higher* than the original epoch, we should look backwards.
         */
        let direction = daysBeforeBestGuess > daysBeforeEvent ? -1 : 1;

        /**
         * This is used in the iteration to determine if we need to fix the daysBeforeBestGuess variable.
         */
        let modified = false;

        function compare(
            iterativeDaysBefore: number,
            daysBeforeEvent: number,
            direction: number
        ) {
            if (direction === 1) {
                return iterativeDaysBefore < daysBeforeEvent;
            } else {
                return iterativeDaysBefore > daysBeforeEvent;
            }
        }
        /**
         * Iteratively find the year and the month *just before* being past the original epoch.
         */
        for (const timespan of [
            "year",
            "month",
        ] as (keyof typeof targetBestGuessDate)[]) {
            let iterativeDaysBefore =
                targetStore.getDaysBeforeDate(targetBestGuessDate);
            while (compare(iterativeDaysBefore, daysBeforeEvent, direction)) {
                iterativeDaysBefore = targetStore.getDaysBeforeDate({
                    ...targetBestGuessDate,
                    [timespan]: targetBestGuessDate[timespan] + direction,
                });
                if (!modified) modified = true;
                if (iterativeDaysBefore > daysBeforeEvent) break;
                targetBestGuessDate[timespan] =
                    targetBestGuessDate[timespan] + direction;
            }
        }
        /**
         * Set the day for the event.
         * 1 needs to be added because these are the days BEFORE the date.
         */
        targetBestGuessDate.day =
            daysBeforeEvent -
            targetStore.getDaysBeforeDate(targetBestGuessDate) +
            1;
        return targetBestGuessDate;
    }
}
