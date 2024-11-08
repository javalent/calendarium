import copy from "fast-copy";
import type { TimeSpan } from "./timespans";

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
    }
}

type BaseSeason = TimeSpan & {
    id: string;
    name: string;
    color: string;
    kind?: SeasonKind;
};
export type DatedSeason = BaseSeason & {
    month: number;
    day: number;
    type: typeof SeasonType.DATED;
};
export type PeriodicSeason = BaseSeason & {
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
interface WeatherData {
    enabled: boolean;
    seed: number;
}
