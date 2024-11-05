export const SettingsSections = [
    "General",
    "Dates",
    "Eras",
    "Seasonal",
    "Celestial bodies",
    "Events",
] as const;
export type CreatorSection = (typeof SettingsSections)[number];
