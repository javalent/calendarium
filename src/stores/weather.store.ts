import {
    getWeatherData,
    SeasonType,
    type Season,
    type SeasonalData,
    type SeasonalWeatherData,
    type SeasonId,
    type Weathered,
} from "src/schemas/calendar/seasonal";
import { derived, get, readable, type Readable } from "svelte/store";
import { WeatherCache } from "./cache/weather-cache";
import type { YearStoreCache } from "./years.store";
import type { CalDate } from "src/schemas";
import type { DefinedSeason, SeasonCache } from "./cache/season-cache";
import {
    Cloudiness,
    Precipitation,
    Windiness,
    type Weather,
    type WeatherData,
} from "src/schemas/weather/weather";
import { wrap } from "src/utils/functions";
import { randomInt, randomLcg, randomNormal, randomUniform } from "d3-random";
import { type Location } from "src/schemas/calendar/locations";
import {
    WeatherEffectCadence,
    WeatherEffectKind,
    type EffectID,
    type InterpolatedWeatherEffect,
    type CalculatedWeatherEffect,
    type WeatherEffect,
    type RangeWeatherEffectData,
} from "src/schemas/weather/effects";
import copy from "fast-copy";
import { WeatherEffectConditionType } from "src/schemas/weather/conditions";

export interface EffectedWeather {
    kind: WeatherEffectKind;
}

export class WeatherStore {
    #seed: Readable<number>;
    #weatherCache: WeatherCache;
    enabled: Readable<boolean>;
    #effects: Readable<WeatherEffect[]>;

    constructor(
        public weatherData: Readable<WeatherData>,
        public seasonalData: Readable<SeasonalData>,
        public seasonCache: SeasonCache,
        public yearCalculator: YearStoreCache
    ) {
        this.enabled = derived(this.weatherData, (data) => data.enabled);
        this.#seed = derived(this.weatherData, (data) => data.seed);
        this.#effects = derived(this.weatherData, (data) => data.effects);

        this.#weatherCache = new WeatherCache(
            readable([]),
            this.seasonCache,
            this.yearCalculator
        );
    }

    public getWeatherForDate(
        date: CalDate,
        location?: Readable<Location | null>
    ): Readable<CalculatedWeatherEffect[] | null> {
        return derived(
            [
                this.enabled,
                this.#weatherCache.getItemsOrRecalculate(date),
                this.#seed,
                this.#effects,
                location ?? readable(null),
            ],
            ([enabled, cached, seed, effects, location]) => {
                if (!enabled) return null;
                if (cached.length) return cached;

                /* const weather = this._generateWeather(
                    date,
                    data,
                    seed,
                    effects,
                    location
                ); */
                return this.generateWeather(date, seed, effects, location);
                /* if (!weather) return null;
                return weather; */
            }
        );
    }

    private generateWeather(
        date: CalDate,
        seed: number,
        effects: WeatherEffect[],
        location: Location | null
    ): CalculatedWeatherEffect[] {
        const epoch = this.yearCalculator.daysBefore(date) + date.day;
        const random = new Randomizer(epoch * seed);

        const current$ = this.seasonCache.getSeasonForDate(date);

        /**
         * This is used to get the interpolated data for seasonal effects.
         */
        const { from, current, effect } = this.getSeasonalWeatherEffect(
            date,
            current$
        );
        const interpolated = this.getInterpolatedWeatherEffects(
            effects,
            from,
            current,
            effect,
            location
        );

        const EFFECT_MAP = new Map<EffectID, CalculatedWeatherEffect>();

        for (const effect of interpolated) {
            console.log(
                "🚀 ~ file: weather.store.ts:138 ~ effect:",
                effect.conditions
            );

            if (
                !effect.conditions.every((condition) => {
                    if (
                        condition.type === WeatherEffectConditionType.LOCATION
                    ) {
                        return location?.id === condition.comparator;
                    }
                    if (!EFFECT_MAP.has(condition.comparator)) return false;

                    const comparator = EFFECT_MAP.get(condition.comparator)!;

                    switch (condition.type) {
                        case WeatherEffectConditionType.GT: {
                            return comparator.value > condition.value;
                        }
                        case WeatherEffectConditionType.LT: {
                            return comparator.value < condition.value;
                        }
                        case WeatherEffectConditionType.EQUAL: {
                            return comparator.value === condition.value;
                        }
                        case WeatherEffectConditionType.TRIGGER: {
                            return (
                                comparator.kind === WeatherEffectKind.CHANCE &&
                                comparator.triggered
                            );
                        }
                    }
                })
            ) {
                continue;
            }
            switch (effect.kind) {
                case WeatherEffectKind.RANGE: {
                    const [min, max] = effect.data;
                    let low = random.normal(min, 4);
                    let high = random.normal(max, 4);
                    if (low > high) {
                        const temp = low;
                        low = high;
                        high = temp;
                    }
                    const value = random.normal((low + high) / 2, 4);
                    EFFECT_MAP.set(effect.id, {
                        ...copy(effect),
                        value,
                        range: [low, high],
                    });
                    break;
                }
                case WeatherEffectKind.CHANCE: {
                    const chance = random.normal(effect.data, 2);
                    const value = random.random();
                    EFFECT_MAP.set(effect.id, {
                        ...copy(effect),
                        value,
                        triggered: chance > value,
                    });
                    break;
                }
                case WeatherEffectKind.CHANCE_TABLE: {
                    let value = random.normal(effect.data * 100, 25) / 100;
                    if (effect.multiplier?.length) {
                        for (const multiplier of effect.multiplier) {
                            if (!EFFECT_MAP.has(multiplier.base)) continue;
                            const base = EFFECT_MAP.get(multiplier.base)!;
                            if (base.kind !== WeatherEffectKind.CHANCE_TABLE)
                                continue;
                            value *= multiplier.values[base.index] ?? 0;
                        }
                    }
                    let strength: string = effect.table[0].name;
                    let index = 0;
                    let icon = effect.icon;
                    for (const [
                        i,
                        { name, chance, icon: _icon },
                    ] of effect.table.entries()) {
                        if (value < chance) {
                            index = i;
                            strength = name;
                            icon = _icon ?? icon;
                            break;
                        }
                    }
                    EFFECT_MAP.set(effect.id, {
                        ...copy(effect),
                        value,
                        strength,
                        index,
                        icon,
                    });
                    break;
                }
            }
        }
        return [...EFFECT_MAP.values()];
    }

    private getSeasonalWeatherEffect(
        date: CalDate,
        season$: Readable<DefinedSeason>
    ): {
        effect: number;
        from: SeasonId;
        current: SeasonId;
    } {
        let season = get(season$);

        let from: Season, current: Season;
        /**
         * Effect the current season has on the weather.
         * The interpolating season has (1 - effect) effect
         */
        let effect = 1;
        if (
            season.daysPassed! >= season.weatherOffset &&
            season.daysPassed! <= season.weatherOffset + season.weatherPeak
        ) {
            from = current = season;
        } else if (season.daysPassed! < season.weatherOffset) {
            const previous$ = this.seasonCache.getPreviousSeason(season$);
            const previous = get(previous$);

            let deltaPreviousPeak = 0;
            if (previous.type === SeasonType.PERIODIC) {
                deltaPreviousPeak =
                    previous.duration -
                    (previous.weatherOffset + previous.weatherPeak);
            } else {
                const year =
                    previous.month > date.month ? date.year - 1 : date.year;
                const pDate = {
                    year,
                    month: previous.month,
                    day: previous.day,
                };
                const duration = this.yearCalculator.daysBefore(pDate);
                deltaPreviousPeak =
                    duration - (previous.weatherOffset + previous.weatherPeak);
            }

            from = previous;
            current = season;
            effect =
                1 -
                (season.weatherOffset - season.daysPassed!) /
                    (season.weatherOffset + deltaPreviousPeak);
        } else {
            const next$ = this.seasonCache.getNextSeason(season$);
            const next = get(next$);

            effect =
                1 -
                (season.daysPassed! -
                    (season.weatherOffset + season.weatherPeak)) /
                    (season.daysPassed! +
                        season.daysRemaining! -
                        season.weatherOffset +
                        next.weatherOffset);
            from = next;
            current = season;
        }

        return { from: from.id, current: current.id, effect };
    }
    private getInterpolatedWeatherEffects(
        effects: WeatherEffect[],
        from: SeasonId,
        current: SeasonId,
        strength: number,
        location: Location | null
    ): InterpolatedWeatherEffect[] {
        let interpolated: InterpolatedWeatherEffect[] = [];
        for (const effect of effects) {
            let cloned = copy(effect);
            if (cloned.cadence === WeatherEffectCadence.STATIC) {
                interpolated.push(cloned);
                continue;
            }
            if (!cloned.interpolate) {
                (cloned as unknown as InterpolatedWeatherEffect).data =
                    cloned.data[current];
                continue;
            }

            switch (cloned.kind) {
                case WeatherEffectKind.RANGE: {
                    const fromData = cloned.data[from]!;
                    const currentData = cloned.data[current]!;

                    const interpolatedData = [
                        cerp(fromData[0], currentData[0], strength),
                        cerp(fromData[1], currentData[1], strength),
                    ] as [number, number];
                    (cloned as unknown as InterpolatedWeatherEffect).data =
                        interpolatedData;

                    break;
                }
                case WeatherEffectKind.CHANCE_TABLE: {
                    const fromData = cloned.data[from]!;

                    const currentData = cloned.data[current]!;

                    const interpolatedData = cerp(
                        fromData,
                        currentData,
                        strength
                    );
                    (cloned as unknown as InterpolatedWeatherEffect).data =
                        interpolatedData;
                    break;
                }
                case WeatherEffectKind.CHANCE: {
                    const fromData = cloned.data[from]!;
                    const currentData = cloned.data[current]!;
                    const interpolatedData = cerp(
                        fromData,
                        currentData,
                        strength
                    );

                    (cloned as unknown as InterpolatedWeatherEffect).data =
                        interpolatedData;
                    break;
                }
            }
            interpolated.push(cloned as unknown as InterpolatedWeatherEffect);
        }
        return interpolated;
    }
}

function cerp(start: number, end: number, distance: number): number {
    const mu2 = (1 - Math.cos(distance * Math.PI)) / 2;
    return start * (1 - mu2) + end * mu2;
}
class Randomizer {
    lcg: () => number;
    constructor(seed: number) {
        this.lcg = randomLcg(seed);
    }
    normal(mu: number, sigma: number): number {
        return randomNormal.source(this.lcg)(mu, sigma)();
    }
    normalInt(mu: number, sigma: number): number {
        return Math.floor(this.normal(mu, sigma));
    }
    random(min = 0, max = 1) {
        return randomUniform.source(this.lcg)(min, max)();
    }
    randomInt(min = 0, max = 100) {
        return randomInt.source(this.lcg)(min, max)();
    }
    chance(value: number, sigma: number) {
        const chance = this.normal(value, sigma);
        const random = this.random();
        return chance > random;
    }
}
