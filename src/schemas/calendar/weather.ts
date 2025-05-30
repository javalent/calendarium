import { wrap } from "src/utils/functions";
import type { CalDate } from "./calendar";

export type Weather = {
    temperature: {
        actual: number;
        low: number;
        high: number;
    };
    precipitation: Precipitation;
    clouds: Cloudiness;
    wind: Windiness;
    date?: CalDate;
};

export interface Cloudiness {
    strength: (typeof Cloudiness.Strength)[number];
    index: number;
}
export class Cloudiness {
    static Strength = [
        "Clear sky",
        "A few clouds",
        "Mostly cloudy",
        "Gray, slightly overcast",
        "Gray, highly overcast",
        "Dark storm clouds",
    ] as const;
    static pick(index: number): Cloudiness {
        return {
            index,
            strength: Cloudiness.Strength[index],
        };
    }
}

export interface Precipitation {
    strength: (typeof Precipitation.Rain | typeof Precipitation.Snow)[number];
    index: number;
}
export class Precipitation {
    static Chance = [0, 0.2, 0.375, 0.55, 0.7, 0.85, 1] as const;
    static Type = {
        NONE: "Clear",
        RAIN: "Rain",
        SNOW: "Snow",
    } as const;
    static Strength = [
        "None",
        "LIGHT",
        "MODERATE",
        "STEADY",
        "STRONG",
        "HEAVY",
        "EXTREME",
    ] as const;
    static Rain = [
        "None",
        "Light mist",
        "Drizzle",
        "Steady rainfall",
        "Strong rainfall",
        "Pounding rain",
        "Downpour",
    ] as const;
    static Snow = [
        "None",
        "A few flakes",
        "A dusting of snow",
        "Flurries",
        "Moderate snowfall",
        "Heavy snowfall",
        "Blizzard",
    ] as const;
    static NONE: Precipitation = {
        strength: Precipitation.Strength[0],
        index: 0,
    };
    static pick(chance: number, temp: number, freezingPoint: number): Precipitation {
        const options = temp < freezingPoint ? Precipitation.Snow : Precipitation.Rain;
        for (const [index, possibility] of Precipitation.Chance.entries()) {
            if (chance < possibility)
                return {
                    strength: options[index],
                    index,
                };
        }
        return {
            strength: options[0],
            index: 0,
        };
    }
}

export type WindDirection = (typeof Windiness.Directions)[number];
export interface Windiness {
    strength: (typeof Windiness.Strength)[number];
    index: number;
    direction: WindDirection;
}
export class Windiness {
    static Multiplier = [0, 0.35, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;
    static Chance = [
        0.075, 0.125, 0.2, 0.25, 0.3, 0.35, 0.4, 0.425, 0.5, 0.65, 0.75, 0.95,
        1,
    ] as const;
    static Strength = [
        "Calm",
        "Light air",
        "Light breeze",
        "Gentle breeze",
        "Moderate breeze",
        "Fresh breeze",
        "Strong breeze",
        "Moderate gale",
        "Fresh gale",
        "Strong gale",
        "Storm",
        "Violent storm",
        "Hurricane",
    ] as const;
    static Directions = [
        "N",
        "NNE",
        "NE",
        "ENE",
        "E",
        "ESE",
        "SE",
        "SSE",
        "S",
        "SSW",
        "SW",
        "WSW",
        "W",
        "WNW",
        "NW",
        "NNW",
    ] as const;
    static Weight = [0.4, 0.15, 0.15, 0.1, 0.1, 0.05, 0.05] as const;
    static pick(chance: number, dir: number): Windiness {
        const direction = Windiness.Directions[dir];
        for (const [index, strength] of Windiness.Strength.entries()) {
            if (chance <= Windiness.Chance[index]) {
                return { strength, index, direction };
            }
        }
        return { strength: Windiness.Strength[0], index: 0, direction };
    }
}
