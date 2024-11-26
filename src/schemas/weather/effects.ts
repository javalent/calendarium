import type { WeatherEffectCondition } from "./conditions";

export type EffectID = string;
export const WeatherEffectCadence = {
    SEASONAL: "Seasonal",
    STATIC: "Static",
} as const;
export type WeatherEffectCadence =
    (typeof WeatherEffectCadence)[keyof typeof WeatherEffectCadence];

export const WeatherEffectKind = {
    RANGE: "Range", //Temperature
    CHANCE_TABLE: "Chance table", //Precipitation chance, intensity, windiness, cloudiness
    CHANCE: "Chance",
} as const;
export type WeatherEffectKind =
    (typeof WeatherEffectKind)[keyof typeof WeatherEffectKind];

export type WeatherEffect =
    | StaticRangeEffect
    | SeasonalRangeEffect
    | StaticChanceTableEffect
    | SeasonalChanceTableEffect
    | StaticChanceEffect
    | SeasonalChanceEffect;

// Base structure for Weather Effects
interface BaseWeatherEffect {
    id: EffectID;
    name: string;
    conditions: WeatherEffectCondition[];
    icon?: string;
    transform?: string;
}

interface SeasonalWeatherEffect extends BaseWeatherEffect {
    cadence: typeof WeatherEffectCadence.SEASONAL;
    data: Record<string, WeatherEffectData>;
    interpolate: boolean;
}

// Specific Effect Types
interface StaticRangeEffect extends BaseWeatherEffect {
    cadence: typeof WeatherEffectCadence.STATIC;
    kind: typeof WeatherEffectKind.RANGE;
    data: RangeWeatherEffectData;
}

interface SeasonalRangeEffect extends SeasonalWeatherEffect {
    cadence: typeof WeatherEffectCadence.SEASONAL;
    kind: typeof WeatherEffectKind.RANGE;
    data: Record<string, RangeWeatherEffectData>;
}

interface ChanceTableEffect extends BaseWeatherEffect {
    table: [
        { name: string; chance: number },
        ...{ name: string; chance: number }[]
    ];
    multipler?: { base: EffectID; values: number[] }[];
    kind: typeof WeatherEffectKind.CHANCE_TABLE;
}
interface StaticChanceTableEffect extends ChanceTableEffect {
    cadence: typeof WeatherEffectCadence.STATIC;
    data: ChanceTableWeatherEffectData;
}

interface SeasonalChanceTableEffect
    extends SeasonalWeatherEffect,
        ChanceTableEffect {
    cadence: typeof WeatherEffectCadence.SEASONAL;
    data: Record<string, ChanceTableWeatherEffectData>;
}

interface StaticChanceEffect extends BaseWeatherEffect {
    cadence: typeof WeatherEffectCadence.STATIC;
    kind: typeof WeatherEffectKind.CHANCE;
    data: ChanceWeatherEffectData;
}

interface SeasonalChanceEffect extends SeasonalWeatherEffect {
    cadence: typeof WeatherEffectCadence.SEASONAL;
    kind: typeof WeatherEffectKind.CHANCE;
    data: Record<string, ChanceWeatherEffectData>;
}

export type RangeWeatherEffectData = {
    range: [minimum: number, maximum: number];
};

export type ChanceTableWeatherEffectData = {
    chance: number;
};

export type ChanceWeatherEffectData = {
    chance: number;
};

type WeatherEffectData =
    | RangeWeatherEffectData
    | ChanceTableWeatherEffectData
    | ChanceWeatherEffectData;
