import { DayCache, EntityCache, MonthCache, YearCache } from "./entity-cache";
import { type Readable, get } from "svelte/store";
import { YearStoreCache } from "../years.store";
import { MOON_PHASES } from "src/utils/constants";
import { wrap } from "src/utils/functions";
import type { MoonState } from "src/schemas/calendar/moons";

class YearMoonCache extends YearCache<MoonState> {
    update(moons: MoonState[]) {
        //pass through...
        return moons;
    }
}
class MonthMoonCache extends MonthCache<MoonState> {
    update(moons: MoonState[]) {
        //pass through
        return moons;
    }
}
class DayMoonCache extends DayCache<MoonState> {
    constructor(
        day: number,
        month: number,
        year: number,
        toConsider: Readable<MoonState[]>,
        public yearCalculator: YearStoreCache
    ) {
        super(day, month, year, toConsider);
    }
    update(moons: MoonState[]) {
        const derived: MoonState[] = [];
        const year = this.yearCalculator.getYearFromCache(this.year);
        const month = year.getMonthFromCache(this.month);
        const daysBefore =
            get(year.daysBefore) + get(month.daysBefore) + this.day - 1;
        for (let moon of moons ?? []) {
            const { offset, cycle } = moon;
            const granularity = 24;

            let data = (daysBefore - offset) / cycle;
            let position = data - Math.floor(data);

            const phase = (position * granularity) % granularity;

            const options = MOON_PHASES[granularity];

            derived.push({
                ...moon,
                phase: options[wrap(Math.round(phase), options.length)],
            });
        }

        return derived;
    }
}

export class MoonCache extends EntityCache<MoonState> {
    constructor(
        entities: Readable<MoonState[]>,
        public yearCalculator: YearStoreCache
    ) {
        super(entities);
    }
    getYearCache(year: number): YearCache<MoonState> {
        if (this.cache.has(year)) return this.cache.get(year)!;
        return new YearMoonCache(year, this.entities);
    }
    getMonthCache(month: number, year: number): MonthCache<MoonState> {
        const yearCache = this.getYearCache(year);
        if (yearCache.cache.has(month)) return yearCache.cache.get(month)!;
        return new MonthMoonCache(month, year, yearCache.entities);
    }
    getDayCache(day: number, month: number, year: number): DayCache<MoonState> {
        const monthCache = this.getMonthCache(month, year);
        if (monthCache.cache.has(day)) return monthCache.cache.get(day)!;
        return new DayMoonCache(
            day,
            month,
            year,
            monthCache.entities,
            this.yearCalculator
        );
    }
}
