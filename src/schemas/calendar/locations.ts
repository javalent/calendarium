import type { Season, Weathered } from "./seasonal";

export const NO_LOCATION = "NONE";
export interface Location {
    id: string;
    name: string;
    seasons: Record<string, Weathered>;
}

export interface LocationData {
    locations: Location[];
    defaultLocation: string;
}
