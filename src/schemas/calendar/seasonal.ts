import type { TimeSpan } from "./timespans";

export const SeasonType = {
    DATED: "Dated",
    PERIODIC: "Periodic",
} as const;
export type SeasonType = (typeof SeasonType)[keyof typeof SeasonType];

type BaseSeason = TimeSpan & {
    id: string;
    name: string;
    color: string;
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
            color: "lightblue",
            duration: 91.310625,
            type: SeasonType.PERIODIC,
        },
        {
            id: "STANDARD_SPRING",
            name: "Spring",
            color: "lightgreen",
            duration: 91.310625,
            type: SeasonType.PERIODIC,
        },
        {
            id: "STANDARD_SUMMER",
            name: "Summer",
            color: "yellow",
            duration: 91.310625,
            type: SeasonType.PERIODIC,
        },
        {
            id: "STANDARD_AUTUMN",
            name: "Autumn",
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
