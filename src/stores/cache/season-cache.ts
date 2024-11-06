import { DayCache, EntityCache, MonthCache, YearCache } from "./entity-cache";
import { type Readable, get } from "svelte/store";
import { YearStoreCache } from "../years.store";
import {
    SeasonType,
    type DatedSeason,
    type PeriodicSeason,
    type Season,
} from "src/schemas/calendar/seasonal";
import Color from "colorjs.io";
import { wrap } from "src/utils/functions";

type DefinedSeason = Season & {
    lerp?: string;
};

class YearSeasonCache extends YearCache<DefinedSeason> {
    update(seasons: Season[]) {
        //pass through...
        return seasons;
    }
}
class MonthSeasonCache extends MonthCache<DefinedSeason> {
    update(seasons: Season[]) {
        //pass through
        return seasons;
    }
}
class DaySeasonCache extends DayCache<DefinedSeason> {
    constructor(
        day: number,
        month: number,
        year: number,
        toConsider: Readable<Season[]>,
        public yearCalculator: YearStoreCache
    ) {
        super(day, month, year, toConsider);
    }
    update(seasons: DefinedSeason[]) {
        if (!seasons.length) return [];
        const seasonalData = get(this.yearCalculator.staticStore.seasonal);

        switch (seasonalData.type) {
            case SeasonType.DATED: {
                for (const season of [...seasons].reverse() as DatedSeason[]) {
                    if (this.month > season.month) return [season];
                    if (this.month === season.month && this.day >= season.day) {
                        return [
                            { ...season, is_start: this.day === season.day },
                        ];
                    }
                }
            }
            case SeasonType.PERIODIC: {
                const year = this.yearCalculator.getYearFromCache(this.year);

                const month = year.getMonthFromCache(this.month);
                const daysBefore =
                    get(year.daysBefore) + get(month.daysBefore) + this.day - 1;

                //Remove the full cycles
                const periodicSeasons = seasons as PeriodicSeason[];
                const totalSeasonalPeriod = periodicSeasons.reduce(
                    (a, b) => a + b.duration + (b.peak ?? 0),
                    0
                );

                let remainingDays =
                    (daysBefore - seasonalData.offset) % totalSeasonalPeriod;

                //we should now be within 1 period of a seasonal rotation
                const seasonalArr = [...periodicSeasons, periodicSeasons[0]];
                for (let i = 0; i < seasonalArr.length; i++) {
                    const season = seasonalArr[i];
                    if (
                        remainingDays -
                            (season.duration + (season.peak ?? 0)) <=
                        0
                    ) {
                        const color = new Color(season.color);

                        let lerp = color.range(
                            seasonalArr[wrap(i + 1, seasonalArr.length)].color,
                            {
                                space: "lch", // interpolation space
                                outputSpace: "srgb",
                            }
                        );
                        if (remainingDays <= (season.peak ?? 0))
                            return [{ ...season, lerp: season.color }];
                        return [
                            {
                                ...season,
                                lerp: lerp(
                                    (remainingDays - (season.peak ?? 0)) /
                                        season.duration
                                ).toString({ format: "hex" }),
                            },
                        ];
                    }

                    remainingDays -= season.duration + (season.peak ?? 0);
                }
            }
        }

        return [];
    }
}

export class SeasonCache extends EntityCache<DefinedSeason> {
    constructor(
        entities: Readable<Season[]>,
        public yearCalculator: YearStoreCache
    ) {
        super(entities);
    }
    getYearCache(year: number): YearCache<Season> {
        if (this.cache.has(year)) return this.cache.get(year)!;
        return new YearSeasonCache(year, this.entities);
    }
    getMonthCache(month: number, year: number): MonthCache<Season> {
        const yearCache = this.getYearCache(year);
        if (yearCache.cache.has(month)) return yearCache.cache.get(month)!;
        return new MonthSeasonCache(month, year, yearCache.entities);
    }
    getDayCache(day: number, month: number, year: number): DayCache<Season> {
        const monthCache = this.getMonthCache(month, year);
        if (monthCache.cache.has(day)) return monthCache.cache.get(day)!;
        return new DaySeasonCache(
            day,
            month,
            year,
            monthCache.entities,
            this.yearCalculator
        );
    }
}
