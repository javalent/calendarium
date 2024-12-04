import { DayCache, EntityCache, MonthCache, YearCache } from "./entity-cache";
import { type Readable } from "svelte/store";
import { YearStoreCache } from "../years.store";
import type { SeasonCache } from "./season-cache";
import { compareDates } from "../../utils/functions";
import type { Weather } from "../../schemas/weather/weather";
import type { CalculatedWeatherEffect } from "src/schemas/weather/effects";

class YearWeatherCache extends YearCache<CalculatedWeatherEffect> {
    update(weather: CalculatedWeatherEffect[]) {
        //pass through...
        return weather;
    }
}
class MonthWeatherCache extends MonthCache<CalculatedWeatherEffect> {
    update(weather: CalculatedWeatherEffect[]) {
        //pass through
        return weather;
    }
}
class DayWeatherCache extends DayCache<CalculatedWeatherEffect> {
    constructor(
        day: number,
        month: number,
        year: number,
        toConsider: Readable<CalculatedWeatherEffect[]>
    ) {
        super(day, month, year, toConsider);
    }

    update(weather: CalculatedWeatherEffect[]) {
        let today: CalculatedWeatherEffect[] = [];
        /* for (const day of weather) {
            if (day.date && compareDates(day.date, this.getDate())) {
                today.push(day);
            }
        } */
        return today;
    }
}

export class WeatherCache extends EntityCache<CalculatedWeatherEffect> {
    constructor(
        entities: Readable<CalculatedWeatherEffect[]>,
        public seasonCache: SeasonCache,
        public yearCalculator: YearStoreCache
    ) {
        super(entities);
    }
    getYearCache(year: number): YearCache<CalculatedWeatherEffect> {
        if (this.cache.has(year)) return this.cache.get(year)!;
        return new YearWeatherCache(year, this.entities);
    }
    getMonthCache(
        month: number,
        year: number
    ): MonthCache<CalculatedWeatherEffect> {
        const yearCache = this.getYearCache(year);
        if (yearCache.cache.has(month)) return yearCache.cache.get(month)!;
        return new MonthWeatherCache(month, year, yearCache.entities);
    }
    getDayCache(
        day: number,
        month: number,
        year: number
    ): DayCache<CalculatedWeatherEffect> {
        const monthCache = this.getMonthCache(month, year);
        if (monthCache.cache.has(day)) return monthCache.cache.get(day)!;

        return new DayWeatherCache(day, month, year, monthCache.entities);
    }
}
