import { DayCache, EntityCache, MonthCache, YearCache } from "./entity-cache";
import { type Readable } from "svelte/store";
import type { WeatherState } from "../../schemas/calendar/weathers";
import type { CalDate, OneTimeCalEventDate } from "../../schemas";

class YearWeatherCache extends YearCache<WeatherState> {
    update(states: WeatherState[]) {
        return (states ?? [])?.filter((state) => {
            const date = { ...state.date };
            return date.year == this.year || date.year == undefined;
        });
    }
}

class MonthWeatherCache extends MonthCache<WeatherState> {
    update(states: WeatherState[]) {
        return (states ?? [])?.filter((state) => {
            const date = { ...state.date };
            return date.year == this.year &&
                date.month == this.month;
        });
    }
}

class DayWeatherCache extends DayCache<WeatherState> {
    normalize(date: OneTimeCalEventDate): CalDate {
        const _date = { ...date };
        if (_date.day == null) {
            _date.day = this.day;
        }
        if (_date.month == null) {
            _date.month = this.month;
        }
        if (_date.year == null) {
            _date.year = this.year;
        }
        return _date as CalDate;
    }

    isEqual(date: OneTimeCalEventDate): boolean {
        const normalized = this.normalize(date);
        return (
            normalized.year == this.year &&
            normalized.month == this.month &&
            normalized.day == this.day
        );
    }

    update(states: WeatherState[]) {
        return (states ?? [])?.filter((state) => {
            return this.isEqual(state.date);
        });
    }
}

export class WeatherStateCache extends EntityCache<WeatherState> {
    getYearCache(year: number): YearCache<WeatherState> {
        if (this.cache.has(year)) return this.cache.get(year)!;
        return new YearWeatherCache(year, this.entities);
    }

    getMonthCache(month: number, year: number): MonthCache<WeatherState> {
        const yearCache = this.getYearCache(year);
        if (yearCache.cache.has(month)) return yearCache.cache.get(month)!;
        return new MonthWeatherCache(month, year, yearCache.entities);
    }

    getDayCache(day: number, month: number, year: number): DayCache<WeatherState> {
        const monthCache = this.getMonthCache(month, year);
        if (monthCache.cache.has(day)) return monthCache.cache.get(day)!;
        return new DayWeatherCache(
            day,
            month,
            year,
            monthCache.entities
        );
    }
}
