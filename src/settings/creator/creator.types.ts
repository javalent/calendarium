export const SettingsSections = [
    "General",
    "Dates",
    "Eras",
    /* Seasons, */
    /* "Weather", */
    "Celestial bodies",
    "Events",
] as const;
export type CreatorSection = (typeof SettingsSections)[number];
