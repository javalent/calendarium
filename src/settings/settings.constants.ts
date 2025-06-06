import type { CalendariumData, PresetCalendar } from "src/@types";
import { SyncBehavior } from "../schemas";
import copy from "fast-copy";
import {
    SeasonType,
    UnitSystem,
    type SeasonalData,
    type WeatherData,
} from "../schemas/calendar/seasonal";
import { getWeatherSeed } from "../utils/functions";

export const PathSelections = {
    DEFAULT: "DEFAULT",
} as const;
export type PathSelections =
    (typeof PathSelections)[keyof typeof PathSelections];

export const DEFAULT_WEATHER_DATA: WeatherData = {
    enabled: false,
    seed: getWeatherSeed(),
    tempUnits: UnitSystem.IMPERIAL,
    windUnits: UnitSystem.IMPERIAL,
    primaryWindDirection: "E",
    freezingPoint: 0,
};
export const DEFAULT_SEASONAL_DATA: SeasonalData = {
    seasons: [],
    offset: 0,
    type: SeasonType.PERIODIC,
    displayColors: true,
    interpolateColors: true,
    weather: copy(DEFAULT_WEATHER_DATA),
};
export const DEFAULT_CALENDAR: PresetCalendar = {
    name: null,
    description: "",
    id: null,
    showIntercalarySeparately: true,
    static: {
        incrementDay: false,
        firstWeekDay: 0,
        overflow: true,
        weekdays: [],
        months: [],

        moons: [],
        displayMoons: true,
        displayDayNumber: false,
        leapDays: [],
        eras: [],
    },
    seasonal: copy(DEFAULT_SEASONAL_DATA),
    locations: {
        locations: [],
        defaultLocation: ''
    },
    current: {
        year: null,
        month: null,
        day: null,
    },
    events: [],
    categories: [],
    path: [],
    supportInlineEvents: false,
    inlineEventTag: "#inline-events",
};
export const DEFAULT_DATA: CalendariumData = {
    autoParse: false,
    calendars: [],
    configDirectory: null,
    dailyNotes: false,
    dateFormat: "YYYY-MM-DD",
    defaultCalendar: null,
    eventPreview: false,
    exit: {
        saving: false,
        event: false,
        calendar: false,
        savingEvent: false,
    },
    eventFrontmatter: false,
    parseDates: false,
    version: {
        major: null,
        minor: null,
        patch: null,
        beta: null,
    },
    debug: false,
    askedToMoveFC: false,
    askedAboutSync: false,
    syncBehavior: SyncBehavior.Ask,
    inlineEventsTag: null,
    paths: [["/", PathSelections.DEFAULT]],
};
