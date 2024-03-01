/**
 * Moons
 */
export type Moon = {
    name: string;
    cycle: number;
    offset: number;
    faceColor: string;
    shadowColor: string;
    id: string;
};

export type Phase =
    | "New moon"
    | "New moon fading"
    | "New moon faded"
    | "Waxing crescent rising"
    | "Waxing crescent risen"
    | "Waxing crescent"
    | "Waxing crescent fading"
    | "Waxing crescent faded"
    | "First quarter rising"
    | "First quarter risen"
    | "First quarter"
    | "First quarter fading"
    | "First quarter faded"
    | "Waxing gibbous rising"
    | "Waxing gibbous risen"
    | "Waxing gibbous"
    | "Waxing gibbous fading"
    | "Waxing gibbous faded"
    | "Full moon rising"
    | "Full moon risen"
    | "Full moon"
    | "Full moon fading"
    | "Full moon faded"
    | "Waning gibbous rising"
    | "Waning gibbous risen"
    | "Waning gibbous"
    | "Waning gibbous fading"
    | "Waning gibbous faded"
    | "Last quarter rising"
    | "Last quarter risen"
    | "Last quarter"
    | "Last quarter fading"
    | "Last quarter faded"
    | "Waning crescent rising"
    | "Waning crescent risen"
    | "Waning crescent"
    | "Waning crescent fading"
    | "Waning crescent faded"
    | "New moon rising"
    | "New moon risen";

export type MoonState = Moon & {
    phase: Phase | undefined;
};
