import { DayCache, EntityCache, MonthCache, YearCache } from "./entity-cache";
import { type Readable } from "svelte/store";
import { YearStoreCache } from "../years.store";
import type { SeasonCache } from "./season-cache";
import { compareDates } from "../../utils/functions";
import type { Weather } from "../../schemas/weather/weather";

class YearWeatherCache extends YearCache<Weather> {
    update(weather: Weather[]) {
        //pass through...
        return weather;
    }
}
class MonthWeatherCache extends MonthCache<Weather> {
    update(weather: Weather[]) {
        //pass through
        return weather;
    }
}
class DayWeatherCache extends DayCache<Weather> {
    constructor(
        day: number,
        month: number,
        year: number,
        toConsider: Readable<Weather[]>
    ) {
        super(day, month, year, toConsider);
    }

    update(weather: Weather[]) {
        let today: Weather[] = [];
        for (const day of weather) {
            if (day.date && compareDates(day.date, this.getDate())) {
                today.push(day);
            }
        }
        return today;
    }
}

export class WeatherCache extends EntityCache<Weather> {
    constructor(
        entities: Readable<Weather[]>,
        public seasonCache: SeasonCache,
        public yearCalculator: YearStoreCache
    ) {
        super(entities);
    }
    getYearCache(year: number): YearCache<Weather> {
        if (this.cache.has(year)) return this.cache.get(year)!;
        return new YearWeatherCache(year, this.entities);
    }
    getMonthCache(month: number, year: number): MonthCache<Weather> {
        const yearCache = this.getYearCache(year);
        if (yearCache.cache.has(month)) return yearCache.cache.get(month)!;
        return new MonthWeatherCache(month, year, yearCache.entities);
    }
    getDayCache(day: number, month: number, year: number): DayCache<Weather> {
        const monthCache = this.getMonthCache(month, year);
        if (monthCache.cache.has(day)) return monthCache.cache.get(day)!;

        return new DayWeatherCache(day, month, year, monthCache.entities);
    }
}
