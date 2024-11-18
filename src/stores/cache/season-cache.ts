import { DayCache, EntityCache, MonthCache, YearCache } from "./entity-cache";
import { type Readable, derived, get } from "svelte/store";
import { YearStoreCache } from "../years.store";
import {
    SeasonType,
    type DatedSeason,
    type PeriodicSeason,
    type Season,
} from "src/schemas/calendar/seasonal";
import Color from "colorjs.io";
import { wrap } from "src/utils/functions";
import type { CalDate } from "src/schemas";

export type DefinedSeason = Season & {
    lerp?: string;
    perc?: number;
    daysPassed?: number;
    daysRemaining?: number;
};

class YearSeasonCache extends YearCache<DefinedSeason> {
    update(seasons: Season[]) {
        //pass through...
        return seasons as DefinedSeason[];
    }
}
class MonthSeasonCache extends MonthCache<DefinedSeason> {
    update(seasons: Season[]) {
        //pass through
        return seasons as DefinedSeason[];
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
        super(day, month, year, toConsider as Readable<DefinedSeason[]>);
    }
    update(seasons: DefinedSeason[]) {
        if (!seasons.length) return [];
        const seasonalData = get(this.yearCalculator.staticStore.seasonal);
        const daysBefore = this.yearCalculator.daysBefore(this.getDate());

        switch (seasonalData.type) {
            case SeasonType.DATED: {
                // start at the last season of the year
                let datedSeasons = seasons as DatedSeason[];
                let sIdx = datedSeasons.length - 1;
                let season = datedSeasons[sIdx];
                let year = this.year;
                let currDaysBefore = this.yearCalculator.daysBefore({
                    month: season.month,
                    day: season.day,
                    year,
                });
                let nextDaysBefore = this.yearCalculator.daysBefore({
                    month: season.month,
                    day: season.day,
                    year: year + 1,
                });
                while (daysBefore < currDaysBefore) {
                    if (sIdx === 0) {
                        year = year - 1;
                    }
                    sIdx = wrap(sIdx - 1, datedSeasons.length);
                    season = datedSeasons[sIdx];
                    nextDaysBefore = currDaysBefore;
                    currDaysBefore = this.yearCalculator.daysBefore({
                        month: season.month,
                        day: season.day,
                        year,
                    });
                }
                let seasonLength = nextDaysBefore - currDaysBefore;
                const color = new Color(season.color);

                const lerp = color.range(season.color, {
                    space: "lch", // interpolation space
                    outputSpace: "srgb",
                });
                const perc = (daysBefore - currDaysBefore) / seasonLength;
                return [
                    {
                        ...season,
                        lerp: lerp(perc).toString({ format: "hex" }),
                        perc,
                        daysPassed: Math.floor(daysBefore - currDaysBefore),
                        daysRemaining: seasonLength - currDaysBefore,
                    },
                ];
            }
            case SeasonType.PERIODIC: {
                //Remove the full cycles
                const periodicSeasons = seasons as PeriodicSeason[];
                const totalSeasonalPeriod = periodicSeasons.reduce(
                    (a, b) => a + b.duration + (b.peak ?? 0),
                    0
                );

                let daysPassed =
                    (daysBefore - seasonalData.offset) % totalSeasonalPeriod;

                //we should now be within 1 period of a seasonal rotation
                const seasonalArr = [...periodicSeasons, periodicSeasons[0]];
                for (let i = 0; i < seasonalArr.length; i++) {
                    const season = seasonalArr[i];
                    if (
                        daysPassed - (season.duration + (season.peak ?? 0)) <=
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
                        const perc =
                            (daysPassed - (season.peak ?? 0)) / season.duration;

                        if (daysPassed <= (season.peak ?? 0))
                            return [
                                {
                                    ...season,
                                    lerp: season.color,
                                    perc,
                                    daysPassed: daysPassed,
                                    daysRemaining:
                                        (season.peak ?? 0) +
                                        season.duration -
                                        daysPassed,
                                },
                            ];
                        return [
                            {
                                ...season,
                                lerp: lerp(
                                    (daysPassed - (season.peak ?? 0)) /
                                        season.duration
                                ).toString({ format: "hex" }),
                                perc,
                                daysPassed: daysPassed,
                                daysRemaining:
                                    (season.peak ?? 0) +
                                    season.duration -
                                    daysPassed,
                            },
                        ];
                    }

                    daysPassed -= season.duration + (season.peak ?? 0);
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
    getSeasonForDate(date: CalDate): Readable<DefinedSeason> {
        return derived(this.getItemsOrRecalculate(date), ([season]) => season);
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

    getPreviousSeason(current: Readable<Season>): Readable<Season> {
        return derived([this.entities, current], ([entities, current]) => {
            const index = entities.findIndex((s) => s.id === current.id);
            return entities[wrap(index - 1, entities.length)];
        });
    }
    getNextSeason(current: Readable<Season>): Readable<Season> {
        return derived([this.entities, current], ([entities, current]) => {
            const index = entities.findIndex((s) => s.id === current.id);
            return entities[wrap(index + 1, entities.length)];
        });
    }
}
