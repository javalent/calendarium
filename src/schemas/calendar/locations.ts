import type { Season, Weathered } from "./seasonal";

export interface Location {
    id: string;
    name: string;
    seasons: Record<string, Weathered>;
}

export interface LocationData {
    locations: Location[];
    defaultLocation: string;
}
