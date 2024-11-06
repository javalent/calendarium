export const SettingsSections = [
    "General",
    "Dates",
    "Eras",
    "Seasons & weather",
    "Celestial bodies",
    "Events",
] as const;
export type CreatorSection = (typeof SettingsSections)[number];
