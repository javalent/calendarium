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
export const DEFAULT_SEASONAL_DATA: SeasonalData = {
    seasons: [],
    offset: 0,
    type: SeasonType.DATED,
    displayColors: true,
    interpolateColors: true,
};
export const STANDARD_SEASONAL_DATA: SeasonalData = {
    seasons: [
        {
            id: "STANDARD_WINTER",
            name: "Winter",
            kind: SeasonKind.WINTER,
            color: "lightblue",
            duration: 91.310625,
            type: SeasonType.PERIODIC,
        },
        {
            id: "STANDARD_SPRING",
            name: "Spring",
            kind: SeasonKind.SPRING,
            color: "lightgreen",
            duration: 91.310625,
            type: SeasonType.PERIODIC,
        },
        {
            id: "STANDARD_SUMMER",
            name: "Summer",
            kind: SeasonKind.SUMMER,
            color: "yellow",
            duration: 91.310625,
            type: SeasonType.PERIODIC,
        },
        {
            id: "STANDARD_AUTUMN",
            name: "Autumn",
            kind: SeasonKind.AUTUMN,
            color: "goldenrod",
            duration: 91.310625,
            type: SeasonType.PERIODIC,
        },
    ],
    offset: -12.5,
    type: SeasonType.PERIODIC,
    displayColors: true,
    interpolateColors: true,
};
