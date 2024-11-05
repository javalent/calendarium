import type { TimeSpan } from "./timespans";

export const SeasonType = {
    DATED: "Dated",
    PERIODIC: "Periodic",
} as const;
export type SeasonType = (typeof SeasonType)[keyof typeof SeasonType];

type BaseSeason = TimeSpan & {
    type: SeasonType;
    id: string;
    name: string;
    color: string;
    icon?: string;
};
type DatedSeason = {
    type: typeof SeasonType.DATED;
    month: number;
    day: number;
};
type PeriodicSeason = {
    type: typeof SeasonType.PERIODIC;
    duration: number;
    peak?: number;
};

export type Season = BaseSeason & (DatedSeason | PeriodicSeason);

export interface SeasonalData {
    seasons: Season[];
    offset: number;
    type: SeasonType;
    displayColors: boolean;
    interpolateColors: boolean;
}
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
            icon: "snowflake",
            type: SeasonType.PERIODIC,
            duration: 91.310625,
        },
        {
            id: "STANDARD_SPRING",
            name: "Spring",
            color: "lightgreen",
            icon: "flower",
            type: SeasonType.PERIODIC,
            duration: 91.310625,
        },
        {
            id: "STANDARD_SUMMER",
            name: "Summer",
            color: "yellow",
            icon: "sun",
            type: SeasonType.PERIODIC,
            duration: 91.310625,
        },
        {
            id: "STANDARD_AUTUMN",
            name: "Autumn",
            color: "goldenrod",
            icon: "leaf",
            type: SeasonType.PERIODIC,
            duration: 91.310625,
        },
    ],
    offset: -12.5,
    type: SeasonType.PERIODIC,
    displayColors: true,
    interpolateColors: true,
};
