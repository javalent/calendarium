import type { CalDate, CalEvent, CalEventDate } from "src/@types";
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
                const end = { ...(event.end ?? {}) };

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
    get date(): CalDate {
        return {
            day: this.day,
            month: this.month,
            year: this.year,
        };
    }

    isBefore(date: CalEventDate): boolean {
        const normalized = this.normalize(date);
        if (normalized.year < this.year) return true;
        if (normalized.month < this.month && normalized.year === this.year)
            return true;
        if (
            normalized.day <= this.day &&
            normalized.month === this.month &&
            normalized.year === this.year
        )
            return true;
        return false;
    }
    isAfter(date: CalEventDate): boolean {
        const normalized = this.normalize(date);
        if (normalized.year > this.year) return true;
        if (normalized.month > this.month && normalized.year === this.year)
            return true;
        if (
            normalized.day >= this.day &&
            normalized.month === this.month &&
            normalized.year === this.year
        )
            return true;
        return false;
    }
    isEqual(date: CalEventDate): boolean {
        const normalized = this.normalize(date);
        return (
            normalized.year == this.year &&
            normalized.month == this.month &&
            normalized.day == this.day
        );
    }
    normalize(date: CalEventDate): CalDate {
        const _date = { ...date };
        if (!_date.day) _date.day = this.date.day;
        if (!_date.month) _date.month = this.date.month;
        if (!_date.year) _date.year = this.date.year;
        return _date as CalDate;
    }
    update(events: CalEvent[]) {
        if (events) {
            this.derived = [];
            for (const event of events) {
                //event is after this day
                if ((event.date.day ?? Infinity) > this.day) continue;

                // exact match
                if (this.isEqual(event.date)) {
                    this.derived.push(event);
                } else if (
                    event.end &&
                    this.isBefore(event.date) &&
                    this.isAfter(event.end)
                ) {
                    this.derived.push(event);
                }
            }
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
