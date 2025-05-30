import type { TimeSpan } from "./timespans";
import type { WindDirection } from "./weather";

export const SeasonType = {
    DATED: "Dated",
    PERIODIC: "Periodic",
} as const;
export type SeasonType = (typeof SeasonType)[keyof typeof SeasonType];
export const SeasonKind = {
    WINTER: "Winter",
    SPRING: "Spring",
    SUMMER: "Summer",
    AUTUMN: "Autumn",
    CUSTOM: "Custom",
    NONE: "None",
} as const;
export type SeasonKind = (typeof SeasonKind)[keyof typeof SeasonKind];
export function seasonalIcon(kind: SeasonKind): string {
    switch (kind) {
        case "Winter":
            return "snowflake";
        case "Spring":
            return "flower-2";
        case "Summer":
            return "sun";
        case "Autumn":
            return "leaf";
        case "Custom":
            return "user-pen";
        case "None":
            return "";
    }
}

type BaseSeason = TimeSpan & {
    id: string;
    name: string;
    color: string;
};
export type SeasonalWeatherData = {
    tempRange: [number, number];
    precipitationChance: number;
    precipitationIntensity: number;
    cloudy: number;
    windy: number;
};

export function getWeatherData(
    season: Weathered
): SeasonalWeatherData | undefined {
    if (season.kind === SeasonKind.NONE) return undefined;
    if (season.kind === SeasonKind.CUSTOM) {
        return season.weather;
    }
    switch (season.kind) {
        case SeasonKind.WINTER:
            return {
                tempRange: [-7, 2],
                precipitationChance: 0.5,
                precipitationIntensity: 0.375,
                cloudy: 0.75,
                windy: 0.25,
            };
        case SeasonKind.SPRING:
            return {
                tempRange: [9.5, 21],
                precipitationChance: 0.75,
                precipitationIntensity: 0.25,
                cloudy: 0.55,
                windy: 0.25,
            };
        case SeasonKind.SUMMER:
            return {
                tempRange: [22, 30],
                precipitationChance: 0.55,
                precipitationIntensity: 0.65,
                cloudy: 0.15,
                windy: 0.25,
            };
        case SeasonKind.AUTUMN:
            return {
                tempRange: [1, 11],
                precipitationChance: 0.5,
                precipitationIntensity: 0.25,
                cloudy: 0.65,
                windy: 0.35,
            };
    }
}

export type Weathered = {
    weatherOffset: number;
    weatherPeak: number;
} & (
    | {
          kind: typeof SeasonKind.CUSTOM;
          weather: SeasonalWeatherData;
      }
    | {
          kind: (typeof SeasonKind)[Exclude<keyof typeof SeasonKind, "CUSTOM">];
      }
);
type WeatheredSeason = BaseSeason & Weathered;

export type DatedSeason = WeatheredSeason & {
    month: number;
    day: number;
    type: typeof SeasonType.DATED;
};
export type PeriodicSeason = WeatheredSeason & {
    duration: number;
    peak?: number;
    type: typeof SeasonType.PERIODIC;
};

export type Season = DatedSeason | PeriodicSeason;

type BaseSeasonalData = {
    offset: number;
    type: SeasonType;
    displayColors: boolean;
    interpolateColors: boolean;
    weather: WeatherData;
};
export type SeasonalData = BaseSeasonalData &
    (
        | {
              type: typeof SeasonType.DATED;
              seasons: DatedSeason[];
          }
        | {
              type: typeof SeasonType.PERIODIC;
              seasons: PeriodicSeason[];
          }
    );

/**
 * Weather
 */
export const UnitSystem = {
    IMPERIAL: "Imperial",
    METRIC: "Metric",
} as const;
export type UnitSystem = (typeof UnitSystem)[keyof typeof UnitSystem];
export interface WeatherData {
    enabled: boolean;
    seed: number;
    freezingPoint: number;
    primaryWindDirection: WindDirection;
    tempUnits: UnitSystem;
    windUnits: UnitSystem;
}
