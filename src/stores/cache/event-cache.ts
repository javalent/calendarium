import type {
    CalDate,
    CalEvent,
    OneTimeCalEventDate,
    RecurringCalEventDate,
} from "src/@types";
import { DayCache, EntityCache, MonthCache, YearCache } from "./entity-cache";
import { EventType } from "src/events/event.types";
class YearEventCache extends YearCache<CalEvent> {
    update(events: CalEvent[]) {
        return (events ?? [])?.filter((event) => {
            switch (event.type) {
                case EventType.Recurring: {
                    const date = { ...event.date };
                    if (date.year === null) return true;
                    if (Array.isArray(date.year)) {
                        const start = date.year[0] ?? this.year;
                        const end = date.year[1] ?? this.year;
                        return start <= this.year && end >= this.year;
                    } else {
                        return date.year === this.year;
                    }
                }
                case EventType.Range: {
                    const date = { ...event.date };
                    const end = { ...event.end };

                    //Year and Month match
                    if (date.year == this.year || date.year == undefined)
                        return true;

                    //Event is after the month
                    if (date.year > this.year) return false;

                    //No end date and event is before the month
                    if (!end && date.year < this.year) return false;

                    if (
                        date.year <= this.year &&
                        end?.year &&
                        end?.year >= this.year
                    )
                        return true;
                    break;
                }
                case EventType.Date:
                default: {
                    const date = { ...event.date };
                    //Year and Month match
                    if (date.year == this.year || date.year == undefined)
                        return true;
                    break;
                }
            }

            return false;
        });
    }
}
class MonthEventCache extends MonthCache<CalEvent> {
    update(events: CalEvent[]) {
        return (events ?? [])?.filter((event) => {
            switch (event.type) {
                case EventType.Recurring: {
                    const date = { ...event.date };
                    if (date.year) {
                        if (Array.isArray(date.year)) {
                            const start = date.year[0] ?? this.year;
                            const end = date.year[1] ?? this.year;
                            if (start > this.year || end < this.year)
                                return false;
                        } else if (date.year !== this.year) {
                            return false;
                        }
                    }
                    if (date.month === null) return true;
                    if (Array.isArray(date.month)) {
                        const start = date.month[0] ?? this.month;
                        const end = date.month[1] ?? this.month;
                        return start <= this.month && end >= this.month;
                    } else {
                        return date.month === this.month;
                    }
                }
                case EventType.Range: {
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
                        (date.month != this.month ||
                            (date.year != null && date.year < this.year))
                    )
                        return false;

                    if (date.year == undefined)
                        end.year = date.year = this.year;
                    if (
                        (date.year <= this.year || date.month <= this.month) &&
                        end.year != null &&
                        end.year >= this.year &&
                        end.month != null &&
                        end.month >= this.month
                    )
                        return true;

                    return false;
                    break;
                }
                case EventType.Date:
                default: {
                    const date = { ...event.date };

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
                    break;
                }
            }
            return false;
        });
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
    isBefore(date: OneTimeCalEventDate): boolean {
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
    isAfter(date: OneTimeCalEventDate): boolean {
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
    isEqual(date: OneTimeCalEventDate): boolean {
        const normalized = this.normalize(date);
        return (
            normalized.year == this.year &&
            normalized.month == this.month &&
            normalized.day == this.day
        );
    }
    normalize(date: OneTimeCalEventDate): CalDate {
        const _date = { ...date };
        if (_date.day == null) {
            _date.day = this.date.day;
        }
        if (_date.month == null) {
            _date.month = this.date.month;
        }
        if (_date.year == null) {
            _date.year = this.date.year;
        }
        return _date as CalDate;
    }
    isUndefined(date: OneTimeCalEventDate): boolean {
        return date.day === null && date.month === null && date.year === null;
    }
    update(events: CalEvent[]) {
        return (events ?? [])?.filter((event) => {
            switch (event.type) {
                case EventType.Recurring: {
                    const date = { ...event.date };

                    if (date.day == null) return true;
                    if (Array.isArray(date.day)) {
                        const start = date.day[0] ?? this.month;
                        const end = date.day[1] ?? this.month;
                        if (start <= this.day && end >= this.day) {
                            return true;
                        }
                    } else if (date.day === this.day) {
                        return true;
                    }
                    return false;
                }
                case EventType.Range: {
                    if (this.isUndefined(event.date)) return false;
                    if (this.isEqual(event.date)) {
                        return true;
                    } else if (
                        event.end &&
                        this.isBefore(event.date) &&
                        this.isAfter(event.end)
                    ) {
                        return true;
                    }
                    break;
                }
                case EventType.Date:
                default: {
                    if (this.isUndefined(event.date)) return false;
                    if (this.isEqual(event.date)) {
                        return true;
                    }
                    break;
                }
            }
            return false;
        });
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
    public override invalidate(date: OneTimeCalEventDate | RecurringCalEventDate) {
        const yearCaches: YearCache<CalEvent>[] = [];
        if (date.year == null) {
            for (const cache of this.cache.values()) {
                cache.dirty.set(true);
                yearCaches.push(cache);
            }
        } else if (Array.isArray(date.year)) {
            for (const year of [...this.cache.keys()]) {
                if (
                    year >= (date.year[0] ?? Number.MIN_SAFE_INTEGER) &&
                    year <= (date.year[1] ?? Number.MAX_SAFE_INTEGER)
                ) {
                    const cache = this.cache.get(year)!;
                    cache.dirty.set(true);
                    yearCaches.push(cache);
                }
            }
        } else if (this.cache.has(date.year)) {
            const cache = this.cache.get(date.year)!;
            cache.dirty.set(true);
            yearCaches.push(cache);
        }
        //No years to invalidate.
        if (!yearCaches.length) return;

        const monthCaches: MonthCache<CalEvent>[] = [];
        for (const yearCache of yearCaches) {
            if (date.month == null) {
                for (const cache of yearCache.cache.values()) {
                    cache.dirty.set(true);
                    monthCaches.push(cache);
                }
            } else if (Array.isArray(date.month)) {
                for (const month of [...yearCache.cache.keys()]) {
                    if (
                        month >= (date.month[0] ?? Number.MIN_SAFE_INTEGER) &&
                        month <= (date.month[1] ?? Number.MAX_SAFE_INTEGER)
                    ) {
                        const cache = yearCache.cache.get(month)!;
                        cache.dirty.set(true);
                        monthCaches.push(cache);
                    }
                }
            } else if (yearCache.cache.has(date.month)) {
                const cache = yearCache.cache.get(date.month)!;
                cache.dirty.set(true);
                monthCaches.push(cache);
            }
        }

        //No months to invalidate.
        if (!monthCaches.length) return;
        const dayCaches: DayCache<CalEvent>[] = [];

        for (const monthCache of monthCaches) {
            if (date.day == null) {
                for (const cache of monthCache.cache.values()) {
                    cache.dirty.set(true);
                    dayCaches.push(cache);
                }
            } else if (Array.isArray(date.day)) {
                for (const day of [...monthCache.cache.keys()]) {
                    if (
                        day >= (date.day[0] ?? Number.MIN_SAFE_INTEGER) &&
                        day <= (date.day[1] ?? Number.MAX_SAFE_INTEGER)
                    ) {
                        const cache = monthCache.cache.get(day)!;
                        cache.dirty.set(true);
                        dayCaches.push(cache);
                    }
                }
            } else if (monthCache.cache.has(date.day)) {
                const cache = monthCache.cache.get(date.day)!;
                cache.dirty.set(true);
                dayCaches.push(cache);
            }
        }
    }
}
