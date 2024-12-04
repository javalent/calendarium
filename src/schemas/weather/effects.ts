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

export const WeatherUnitKind = {
    NONE: "None",
    TEMPERATURE: "Temperature",
    WIND: "Wind",
} as const;
export type WeatherUnitKind =
    (typeof WeatherUnitKind)[keyof typeof WeatherUnitKind];
export const WeatherEffectDisplay = {
    NONE: "None",
    MAIN: "Main",
    TOOLTIP: "Tooltip",
    BOTH: "Both",
} as const;
export type WeatherEffectDisplay =
    (typeof WeatherEffectDisplay)[keyof typeof WeatherEffectDisplay];

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
    unit: WeatherUnitKind;
    display: WeatherEffectDisplay;
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
interface RangeEffect extends BaseWeatherEffect {
    temperature: boolean;
    kind: typeof WeatherEffectKind.RANGE;
}
interface StaticRangeEffect extends RangeEffect {
    cadence: typeof WeatherEffectCadence.STATIC;
    data: RangeWeatherEffectData;
}

interface SeasonalRangeEffect extends RangeEffect, SeasonalWeatherEffect {
    cadence: typeof WeatherEffectCadence.SEASONAL;
    data: Record<string, RangeWeatherEffectData>;
}

interface ChanceTableEffect extends BaseWeatherEffect {
    table: [
        { name: string; chance: number; icon?: string },
        ...{ name: string; chance: number; icon?: string }[]
    ];
    multiplier?: { base: EffectID; values: number[] }[];
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

export type RangeWeatherEffectData = [minimum: number, maximum: number];

export type ChanceTableWeatherEffectData = number;

export type ChanceWeatherEffectData = number;

type WeatherEffectData =
    | RangeWeatherEffectData
    | ChanceTableWeatherEffectData
    | ChanceWeatherEffectData;

export type InterpolatedWeatherEffect = BaseWeatherEffect &
    (StaticChanceEffect | StaticChanceTableEffect | StaticRangeEffect) & {
        cadence: WeatherEffectCadence;
    };

export type CalculatedWeatherEffect = InterpolatedWeatherEffect &
    (
        | {
              kind: typeof WeatherEffectKind.RANGE;
              range: [number, number];
              value: number;
          }
        | {
              kind: typeof WeatherEffectKind.CHANCE;
              value: number;
              triggered: boolean;
          }
        | {
              kind: typeof WeatherEffectKind.CHANCE_TABLE;
              value: number;
              strength: string;
              index: number;
          }
    );
