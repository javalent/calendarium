import type { CalEvent } from "src/@types";
import { DayCache, EntityCache, MonthCache, YearCache } from "./entity-cache";
class YearEventCache extends YearCache<CalEvent> {
    update(events: CalEvent[]) {
        if (events) {
            this.derived = events.filter((event) => {
                const date = { ...event.date };
                const end = { ...event.end };

                //Year and Month match
                if (date.year == this.year || date.year == undefined)
                    return true;

                //Event is after the month
                if (date.year > this.year) return false;

                //No end date and event is before the month
                if (!end && !event.formulas?.length && date.year < this.year)
                    return false;

                if (
                    date.year <= this.year &&
                    ((end?.year && end?.year >= this.year) ||
                        event.formulas?.length)
                )
                    return true;

                return false;
            });
        }
        return this.derived;
    }
}
class MonthEventCache extends MonthCache<CalEvent> {
    update(events: CalEvent[]) {
        if (events) {
            this.derived = events.filter((event) => {
                const date = { ...event.date };
                const end = { ...event.end };

                //No-month events are on every month.
                if (date.month == undefined) return true;

                //Year and Month match
                if (
                    (date.year == this.year || date.year == undefined) &&
                    date.month == this.month
                )
                    return true;

                //Event is after the month
                if (
                    (date.year != null && date.year > this.year) ||
                    (date.year == this.year && date.month > this.month)
                )
                    return false;

                //No end date and event is before the month
                if (
                    !end &&
                    !event.formulas?.length &&
                    (date.month != this.month ||
                        (date.year != null && date.year < this.year))
                )
                    return false;

                if (date.year == undefined) end.year = date.year = this.year;
                if (
                    (date.year <= this.year || date.month <= this.month) &&
                    (event.formulas?.length ||
                        (end.year != null &&
                            end.year >= this.year &&
                            end.month != null &&
                            end.month >= this.month))
                )
                    return true;

                return false;
            });
        }
        return this.derived;
    }
}
class DayEventCache extends DayCache<CalEvent> {
    update(events: CalEvent[]) {
        if (events) {
            this.derived = events.filter((event) => {
                if (
                    (!event.date.year || event.date.year == this.year) &&
                    (!event.date.month || event.date.month == this.month) &&
                    event.date.day == this.day
                )
                    return true;
                if (!event.end && !event.formulas?.length) return false;
            });
        }
        return this.derived;
    }
}

export class EventCache extends EntityCache<CalEvent> {
    getYearCache(year: number): YearCache<CalEvent> {
        if (this.cache.has(year)) return this.cache.get(year)!;
        return new YearEventCache(year, this.entities);
    }
    getMonthCache(month: number, year: number): MonthCache<CalEvent> {
        const yearCache = this.getYearCache(year);
        if (yearCache.cache.has(month)) return yearCache.cache.get(month)!;
        return new MonthEventCache(month, year, yearCache.entities);
    }
    getDayCache(day: number, month: number, year: number): DayCache<CalEvent> {
        const monthCache = this.getMonthCache(month, year);
        if (monthCache.cache.has(day)) return monthCache.cache.get(day)!;
        return new DayEventCache(day, month, year, monthCache.entities);
    }
}
