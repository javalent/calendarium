import {
    getWeatherData,
    SeasonType,
    type Season,
    type SeasonalData,
    type SeasonalWeatherData,
    type WeatherData,
    type Weathered,
} from "src/schemas/calendar/seasonal";
import { derived, get, readable, type Readable } from "svelte/store";
import {
    uniformIntDistribution,
    unsafeUniformIntDistribution,
    xoroshiro128plus,
    type RandomGenerator,
} from "pure-rand";
import { WeatherCache } from "./cache/weather-cache";
import type { YearStoreCache } from "./years.store";
import type { CalDate } from "src/schemas";
import type { DefinedSeason, SeasonCache } from "./cache/season-cache";
import {
    Cloudiness,
    Precipitation,
    Windiness,
    type Weather,
} from "src/schemas/calendar/weather";
import { wrap } from "src/utils/functions";
import { randomInt, randomLcg, randomNormal, randomUniform } from "d3-random";
import { type Location } from "src/schemas/calendar/locations";

export class WeatherStore {
    #weather: Readable<WeatherData>;
    #seed: Readable<number>;
    #weatherCache: WeatherCache;
    #rng: Readable<RandomGenerator>;
    #enabled: Readable<boolean>;

    constructor(
        public seasonalData: Readable<SeasonalData>,
        public seasonCache: SeasonCache,
        public yearCalculator: YearStoreCache
    ) {
        this.#weather = derived(seasonalData, (data) => data.weather);
        this.#enabled = derived(this.#weather, (data) => data.enabled);
        this.#seed = derived(this.#weather, (data) => data.seed);
        this.#rng = derived(this.#seed, (seed) => xoroshiro128plus(seed));

        this.#weatherCache = new WeatherCache(
            readable([]),
            this.seasonCache,
            this.yearCalculator
        );
    }

    public getWeatherForDate(
        date: CalDate,
        location?: Readable<Location | null>
    ): Readable<Weather | null> {
        return derived(
            [
                this.#enabled,
                this.#weatherCache.getItemsOrRecalculate(date),
                this.#weather,
                this.#seed,
                location ?? readable(null),
            ],
            ([enabled, cached, data, seed, location]) => {
                if (!enabled) return null;
                if (cached.length) return cached[0];
                const weather = this.generateWeather(
                    date,
                    data,
                    seed,
                    location
                );
                if (!weather) return null;
                return weather;
            }
        );
    }

    private generateWeather(
        date: CalDate,
        data: WeatherData,
        seed: number,
        location: Location | null
    ): Weather | null {
        const season$ = this.seasonCache.getSeasonForDate(date);

        const { from, to, effect } = this.getSeasonalWeatherEffect(
            date,
            season$,
            location
        );

        const weatherData = this.getInterpolatedWeatherData(from, to, effect);

        if (!weatherData) return null;

        /**
         * Temperature
         */
        const epoch = this.yearCalculator.daysBefore(date) + date.day;
        const random = new Randomizer(epoch * seed);

        let low = random.normal(weatherData.tempRange[0], 4);
        let high = random.normal(weatherData.tempRange[1], 4);

        if (low > high) {
            const temp = low;
            low = high;
            high = temp;
        }

        const actual = random.normal((low + high) / 2, 4);

        let precipitation = Precipitation.NONE;
        let clouds = Cloudiness.pick(0);
        if (random.chance(weatherData.precipitationChance, 1)) {
            precipitation = Precipitation.pick(
                random.normal(weatherData.precipitationIntensity * 100, 25) /
                    100,
                actual,
                data.freezingPoint
            );

            clouds = Cloudiness.pick(
                random.randomInt(
                    precipitation.index,
                    Cloudiness.Strength.length - 1
                )
            );
        } else if (random.chance(weatherData.cloudy, 1)) {
            clouds = Cloudiness.pick(
                random.randomInt(1, Cloudiness.Strength.length - 2)
            );
        }

        const baseWindiness = random.normal(weatherData.windy * 100, 3) / 100;
        const windiness =
            baseWindiness +
            baseWindiness * Windiness.Multiplier[precipitation.index];

        const primaryDirection = Windiness.Directions.indexOf(
            data.primaryWindDirection ?? "E"
        );

        const wind = Windiness.pick(
            windiness,
            wrap(
                primaryDirection + random.normalInt(0, 2),
                Windiness.Directions.length
            )
        );

        const weather = {
            temperature: {
                actual,
                low,
                high,
            },
            precipitation,
            clouds,
            wind,
        };

        return weather;
    }

    private getInterpolatedWeatherData(
        from: Weathered,
        to: Weathered,
        effect: number
    ): SeasonalWeatherData | null {
        const fromData = getWeatherData(from);

        if (!fromData) return null;

        const toData = getWeatherData(to) ?? fromData;

        const tempRange = [
            Randomizer.cerp(fromData.tempRange[0], toData.tempRange[0], effect),
            Randomizer.cerp(fromData.tempRange[1], toData.tempRange[1], effect),
        ] as [number, number];
        const precipitationChance = Randomizer.cerp(
            fromData.precipitationChance,
            toData.precipitationChance,
            effect
        );
        const precipitationIntensity = Randomizer.cerp(
            fromData.precipitationIntensity,
            toData.precipitationIntensity,
            effect
        );
        const cloudy = Randomizer.cerp(fromData.cloudy, toData.cloudy, effect);
        const windy = Randomizer.cerp(fromData.windy, toData.windy, effect);

        return {
            tempRange,
            precipitationChance,
            precipitationIntensity,
            cloudy,
            windy,
        };
    }
    private getSeasonalWeatherEffect(
        date: CalDate,
        season$: Readable<DefinedSeason>,
        location: Location | null
    ): {
        effect: number;
        from: Weathered;
        to: Weathered;
    } {
        let season = get(season$);

        let from: Season, to: Season;
        /**
         * Effect the current season has on the weather.
         * The interpolating season has (1 - effect) effect
         */
        let effect = 1;
        if (
            season.daysPassed! >= season.weatherOffset &&
            season.daysPassed! <= season.weatherOffset + season.weatherPeak
        ) {
            from = to = season;
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
            to = season;
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
            to = season;
        }
        if (location) {
            if (from.id in location.seasons) {
                (from as Weathered) = location.seasons[from.id];
            }
            if (to.id in location.seasons) {
                (to as Weathered) = location.seasons[to.id];
            }
        }

        return { from, to, effect };
    }
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

    static cerp(start: number, end: number, distance: number): number {
        const mu2 = (1 - Math.cos(distance * Math.PI)) / 2;
        return start * (1 - mu2) + end * mu2;
    }
}
