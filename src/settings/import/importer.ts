import type {
    Calendar,
    CalEvent,
    CalEventCategory,
    StaticCalendarData,
} from "../../@types";
import distinct from "distinct-colors";

import { decode } from "he";
import type { ImportedCalendar } from "../../@types/import";
import deepmerge from "deepmerge";
import { DEFAULT_CALENDAR } from "../settings.constants";
import { nanoid } from "../../utils/functions";
import type { Moon } from "../../schemas/calendar/moons";
import type {
    Week,
    Month,
    LeapDay,
    Era,
} from "../../schemas/calendar/timespans";
import { EventType } from "../../events/event.types";
import {
    SeasonKind,
    SeasonType,
    UnitSystem,
    type SeasonalData,
} from "../../schemas/calendar/seasonal";

export default class Import {
    static import(objects: ImportedCalendar[]) {
        const calendars: Calendar[] = [];
        for (let data of objects) {
            const name = data.name ?? "Imported Calendar";
            const static_data = data.static_data;

            if (!static_data) continue;

            const year_data = static_data.year_data;

            if (!year_data) continue;

            const firstWeekDay = Math.max(year_data.first_day - 1, 0);
            const overflow = year_data.overflow ?? true;
            const global_week = year_data.global_week;

            if (!global_week) continue;

            const weekdays: Week = global_week.map((n: any) => {
                return {
                    type: "day",
                    name: n,
                    id: nanoid(6),
                    number: null,
                };
            });

            const timespans = year_data.timespans;

            if (!timespans) continue;

            /*             const month_spans = timespans.filter((t: any) => t.type == "month");

            if (!month_spans || !month_spans.length) continue; */

            const months: Month[] = timespans.map((m) => {
                return {
                    name: decode(m.name),
                    type: m.type,
                    length: m.length,
                    id: nanoid(6),
                    interval: m.interval,
                    offset: m.offset,
                };
            });

            const avgLength = months.reduce((a, b) => {
                if (b.type == "month") {
                    return a + b.length;
                }
                return a;
            }, 0);

            const leapDays: LeapDay[] = [];

            if ("leap_days" in year_data) {
                for (let leap of year_data["leap_days"]) {
                    //build interval
                    const interval: string[] = leap.interval.split(",") ?? [
                        "1",
                    ];
                    const intervals = interval.map((i) => {
                        const ignore = /\+/.test(i);
                        const exclusive = /\!/.test(i);
                        const interval = i.match(/(\d+)/)?.[0];

                        return {
                            ignore,
                            exclusive,
                            interval: Number(interval),
                        };
                    });
                    leapDays.push({
                        name: leap.name ?? `Leap Day ${leapDays.length + 1}`,
                        type: "leapday",
                        interval: intervals,
                        timespan: leap.timespan ?? 0,
                        intercalary: leap.intercalary ?? false,
                        numbered: !leap.not_numbered,
                        after: leap.day,
                        offset: leap.offset ?? 0,
                        id: nanoid(6),
                    });
                }
            }
            const moons: Moon[] = [];

            if ("moons" in static_data) {
                for (let moon of static_data["moons"]) {
                    moons.push({
                        name: moon.name ?? `Moon ${moons.length + 1}`,
                        cycle: Number(moon.cycle) ?? avgLength,
                        offset: moon.shift ?? 0,
                        faceColor: moon.color ?? "#ffffff",
                        shadowColor: moon.shadow_color ?? "#000000",
                        id: nanoid(6),
                    });
                }
            }

            const eras: Era[] = [];
            if ("eras" in static_data) {
                for (let era of static_data["eras"]) {
                    eras.push({
                        id: nanoid(6),
                        endsYear: era.endsYear,
                        isEvent: false,
                        isStartingEra: false,
                        name: era.name ?? `Era ${eras.length + 1}`,
                        description: era.description,
                        format: era.formatting ?? "{{era_name}}",
                        date: {
                            year: era.date?.year ?? 1,
                            month: era.date?.timespan ?? 0,
                            day: era.date?.day ?? 0,
                        },
                        type: "era",
                        category: null,
                    });
                }
            }
            let seasonal: SeasonalData = {
                seasons: [],
                type: SeasonType.PERIODIC,
                interpolateColors: true,
                displayColors: true,
                offset: 0,
                weather: {
                    enabled: false,
                    seed: 1,
                    tempUnits: UnitSystem.IMPERIAL,
                    windUnits: UnitSystem.METRIC,
                    primaryWindDirection: "E",
                    freezingPoint: 0
                },
            };
            if ("seasons" in static_data) {
                const seasonalData = static_data.seasons;
                if (!seasonalData.global_settings.periodic_seasons) {
                    seasonal = {
                        seasons: [],
                        type: SeasonType.DATED,
                        interpolateColors: true,
                        displayColors: true,
                        offset: 0,
                        weather: {
                            enabled: false,
                            seed: 1,
                            tempUnits: UnitSystem.IMPERIAL,
                            windUnits: UnitSystem.METRIC,
                            primaryWindDirection: "E",
                            freezingPoint: 0
                        },
                    };
                }
                seasonal.displayColors =
                    seasonalData.global_settings.color_enabled;
                for (const season of seasonalData.data) {
                    switch (seasonal.type) {
                        case SeasonType.DATED: {
                            seasonal.seasons.push({
                                id: nanoid(6),
                                name: season.name,
                                type: SeasonType.DATED,
                                kind: SeasonKind.NONE,
                                month: season.timespan,
                                day: season.day,
                                color: season.color[0],
                                weatherOffset: 56,
                                weatherPeak: 5,
                            });
                            break;
                        }
                        case SeasonType.PERIODIC: {
                            seasonal.seasons.push({
                                id: nanoid(6),
                                name: season.name,
                                type: SeasonType.PERIODIC,
                                kind: SeasonKind.NONE,
                                duration:
                                    season.length - (season.duration ?? 0),
                                peak: season.duration ?? 0,
                                color: season.color[0],
                                weatherOffset: 56,
                                weatherPeak: 5,
                            });
                            break;
                        }
                    }
                }

                if ("preset_order" in seasonalData.global_settings) {
                    for (
                        let i = 0;
                        i <
                        (seasonalData.global_settings.preset_order ?? [])
                            .length;
                        i++
                    ) {
                        const order =
                            seasonalData.global_settings.preset_order?.[i];
                        switch (order) {
                            case 0: {
                                seasonal.seasons[i].kind = SeasonKind.WINTER;
                                break;
                            }
                            case 1: {
                                seasonal.seasons[i].kind = SeasonKind.SPRING;
                                break;
                            }
                            case 2: {
                                seasonal.seasons[i].kind = SeasonKind.SUMMER;
                                break;
                            }
                            case 3: {
                                seasonal.seasons[i].kind = SeasonKind.AUTUMN;
                                break;
                            }
                        }
                    }
                }
            }
            const staticData: StaticCalendarData = {
                firstWeekDay,
                overflow,
                weekdays,
                months,
                moons,
                leapDays,
                eras,
                displayMoons: true,
                incrementDay: false,
                displayDayNumber: false,
            };

            const dynamicData = {
                year: 1,
                day: 1,
                month: 0,
            };
            if (data.dynamic_data) {
                dynamicData.year = Math.max(
                    1,
                    data.dynamic_data.year ?? dynamicData.year
                );
                dynamicData.day = data.dynamic_data.day ?? dynamicData.day;
                dynamicData.month =
                    data.dynamic_data.timespan ?? dynamicData.month;
            }

            const events: CalEvent[] = [];

            const existingCategories: Map<string, CalEventCategory> = new Map();
            if ("categories" in data) {
                for (let category of data.categories) {
                    const name = category.name;
                    const id =
                        name?.split(" ").join("-").toLowerCase() ?? nanoid(6);
                    let color = category.event_settings.color;

                    if (!(color in CalendariumColorMap)) {
                        color = color.split("-").join("");
                        const canvas = createEl("canvas");
                        const ctx = canvas.getContext("2d")!;
                        ctx.fillStyle = color;
                        color = ctx.fillStyle;
                        canvas.detach();
                    } else {
                        color = CalendariumColorMap[color];
                    }
                    existingCategories.set(id, { name, id, color });
                }
            }

            if (
                data.events &&
                Array.isArray(data.events) &&
                data.events.length
            ) {
                for (let event of data.events) {
                    const date: any = {
                        day: null,
                        year: null,
                        month: null,
                    };

                    if (
                        event.data &&
                        event.data.date &&
                        Array.isArray(event.data?.date) &&
                        event.data.date.length
                    ) {
                        date.day = event.data.date[2];
                        date.month = event.data.date[1];
                        date.year = event.data.date[0];
                    } else if (
                        event.data &&
                        event.data.conditions &&
                        Array.isArray(event.data.conditions)
                    ) {
                        const conditions = event.data.conditions;
                        try {
                            const year = conditions.find(
                                (c: any) => c[0] === "Year"
                            );
                            const month = conditions.find(
                                (c: any) => c[0] === "Month"
                            );
                            const day = conditions.find(
                                (c: any) => c[0] === "Day"
                            );

                            if (year) {
                                date.year = Number(year[2][0]);
                            }
                            if (month) {
                                date.month = Number(month[2][0]);
                            }
                            if (day) {
                                date.day = Number(day[2][0]);
                            }
                        } catch (e) {}
                    }

                    events.push({
                        name: event.name,
                        description: event.description,
                        id: `${event.id}`,
                        note: null,
                        type: EventType.Date,
                        date,
                        category:
                            existingCategories.get(event.event_category_id)
                                ?.id ?? null,
                        sort: {
                            order: "",
                            timestamp: 0,
                        },
                    });
                }
            }

            const colors = distinct({
                count: existingCategories.size,
            });

            for (let id of existingCategories.keys()) {
                const category = existingCategories.get(id)!;
                if (category.color) continue;
                category.color = colors.shift()!.hex();
                existingCategories.set(id, category);
            }

            const calendarData: Calendar = deepmerge(DEFAULT_CALENDAR, {
                name,
                description: null,
                static: staticData,
                current: dynamicData,
                events,
                id: nanoid(6),
                categories: Array.from(existingCategories.values()),
                seasonal,
            }) as Calendar;

            calendars.push(calendarData);
        }
        return calendars;
    }
}

const CalendariumColorMap: Record<string, string> = {
    "Dark-Solid": "#000000",
    Red: "#9b2c2c",
    Pink: "#880E4F",
    Purple: "#4A148C",
    "Deep-Purple": "#311B92",
    Blue: "#0D47A1",
    "Light-Blue": "#0288D1",
    Cyan: "#006064",
    Teal: "#004D40",
    Green: "#2E7D32",
    "Light-Green": "#7CB342",
    Lime: "#9e9d24",
    Yellow: "#FFEB3B",
    Orange: "#FF9100",
    "Blue-Grey": "#455A64",
};
