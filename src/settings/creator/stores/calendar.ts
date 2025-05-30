import type {
    Calendar,
    CalDate,
    CalEvent,
    CalEventCategory,
    StaticCalendarData,
} from "src/@types";
import type Calendarium from "src/main";
import {
    compare,
    getEffectiveYearLength,
    isValidDay,
    isValidMonth,
    isValidYear,
    nanoid,
    sortEventList,
} from "src/utils/functions";
import { derived, writable } from "svelte/store";
import copy from "fast-copy";
import type { Moon } from "src/schemas/calendar/moons";
import type {
    Month,
    Week,
    Year,
    LeapDay,
    Day,
    Era,
} from "src/schemas/calendar/timespans";
import {
    SeasonKind,
    SeasonType,
    UnitSystem,
    type DatedSeason,
    type PeriodicSeason,
    type Season,
} from "src/schemas/calendar/seasonal";
import { NO_LOCATION, type Location } from "src/schemas/calendar/locations";

function padMonth(months: Month[]) {
    return (months.length + "").length;
}

function padDay(months: Month[]) {
    return (
        months.reduce(
            (max, month) => (max > month.length ? max : month.length),
            0
        ) + ""
    ).length;
}

export type CreatorStore = ReturnType<typeof createCreatorStore>;

function createCreatorStore(plugin: Calendarium, existing: Calendar) {
    const store = writable<Calendar>(existing);
    const { subscribe, set, update } = store;

    const history = writable<Calendar[]>([]);

    let index = 0;
    let isHistoryEvent = false;
    const canRedo = derived(
        [history],
        ([history]) => index > 0 && history.length
    );
    const redo = () =>
        history.update((h) => {
            if (index > 0 && h.length > 0) {
                index--;
                isHistoryEvent = true;
                update((cal) => h[index]);
            }
            return h;
        });
    const canUndo = derived(
        [history],
        ([history]) => history.length > 0 && index < history.length - 1
    );
    const undo = () =>
        history.update((h) => {
            if (h.length > 0 && index < h.length - 1) {
                index++;
                isHistoryEvent = true;
                update((cal) => h[index]);
            }
            return h;
        });
    subscribe((cal) =>
        history.update((h) => {
            if (isHistoryEvent) {
                isHistoryEvent = false;
                return h;
            }
            if (index > 0) {
                for (let i = 0; i <= index; i++) {
                    h.shift();
                }
            }
            index = 0;
            h.unshift(copy(cal));
            return h;
        })
    );

    const staticStore = derived(store, (data) => data.static);
    const currentStore = derived(store, (data) => {
        return data.current;
    });
    const { subscribe: staticSubscribe } = staticStore;

    const staticSet = (data: StaticCalendarData) =>
        update((calendar) => {
            calendar.static = data;
            calendar.static.padMonths = padMonth(calendar.static.months);
            calendar.static.padDays = padDay(calendar.static.months);
            return calendar;
        });

    //TODO: Organize this better.
    const monthStore = derived(staticStore, (data) => data.months);
    const weekStore = derived(staticStore, (data) => data.weekdays);
    const yearStore = derived(staticStore, (data) => data.years);
    const customYears = derived(staticStore, (data) => data.useCustomYears);
    const moonStore = derived(staticStore, (data) => data.moons);
    const displayMoons = derived(staticStore, (data) => data.displayMoons);
    const leapDayStore = derived(staticStore, (data) => data.leapDays);
    const eraStore = derived(staticStore, (data) => data.eras);

    /** Seasons */
    const seasonStore = derived(store, (data) => data.seasonal.seasons);
    const seasonOffset = derived(store, (data) => data.seasonal.offset);
    const displaySeasonalColors = derived(
        store,
        (data) => data.seasonal.displayColors
    );
    const interpolateColors = derived(
        store,
        (data) => data.seasonal.interpolateColors
    );
    const seasonType = derived(store, (data) => data.seasonal.type);

    /** Weather */
    const weatherStore = derived(store, (data) => data.seasonal.weather);
    const weatherEnabledStore = derived(weatherStore, (data) => data.enabled);
    const weatherSeedStore = derived(weatherStore, (data) => data.seed);
    const tempUnitsStore = derived(weatherStore, (data) => data.tempUnits);
    const windUnitsStore = derived(weatherStore, (data) => data.windUnits);
    const freezingPointStore = derived(weatherStore, (data) => data.freezingPoint);

    /** Locations */
    const locationStore = derived(store, (data) => data.locations.locations);
    const defaultLocationStore = derived(
        store,
        (data) => data.locations.defaultLocation
    );

    const eventStore = derived(store, (data) => data.events);
    const categoryStore = derived(store, (data) => data.categories);
    const validMonths = derived(staticStore, (data) => {
        return (
            data.months?.length > 0 &&
            data.months?.every((m) => (m.name?.length ?? 0) > 0) &&
            data.months?.every((m) => m.length > 0)
        );
    });
    const validWeekdays = derived(staticStore, (data) => {
        return (
            data.weekdays?.length > 0 &&
            data.weekdays?.every((d) => d.name?.length) &&
            data.firstWeekDay < (data.weekdays?.length ?? Infinity)
        );
    });
    const validYears = derived(staticStore, (data) => {
        return (
            !data.useCustomYears ||
            (data.useCustomYears &&
                data.years != null &&
                data.years.length > 0 &&
                data.years.every((y) => y.name?.length))
        );
    });
    const validName = derived(store, (calendar) => calendar.name?.length > 0);

    const validDay = derived([store, currentStore], ([calendar, current]) => {
        return isValidDay(current, calendar);
    });
    const validMonth = derived([store, currentStore], ([calendar, current]) => {
        return isValidMonth(current.month, calendar);
    });
    const validYear = derived([store, currentStore], ([calendar, current]) => {
        return isValidYear(current.year, calendar);
    });
    const validDate = derived(
        [validDay, validMonth, validYear],
        ([day, month, year]) => {
            return day && month && year;
        }
    );
    const validCalendar = derived(
        [validDate, validName, validMonths, validWeekdays, validYears],
        ([validDate, validName, validMonths, validWeekdays, validYears]) =>
            validDate && validName && validMonths && validWeekdays && validYears
    );
    return {
        subscribe,
        set,
        update,
        currentStore: {
            subscribe: currentStore.subscribe,
            set: (data: CalDate) => {
                update((calendar) => {
                    calendar.current = { ...data };
                    return calendar;
                });
            },
            update: (data: CalDate) =>
                update((calendar) => {
                    calendar.current = { ...data };
                    return calendar;
                }),
        },
        valid: validCalendar,
        validDate,
        validDay,
        validMonth,
        validMonths,
        validWeekdays,
        validYear,
        validYears,
        validName,
        setProperty<K extends keyof Calendar>(key: K, value: Calendar[K]) {
            return update((calendar) => {
                calendar[key] = value;
                return calendar;
            });
        },

        /** Setters */
        setCurrentDate: (date: CalDate) =>
            update((cal) => {
                cal.current = { ...date };
                return cal;
            }),

        staticStore: {
            subscribe: staticSubscribe,
            set: staticSet,
            setProperty<K extends keyof StaticCalendarData>(
                key: K,
                value: StaticCalendarData[K]
            ) {
                return update((calendar) => {
                    calendar.static[key] = value;
                    return calendar;
                });
            },
        },
        weekdayStore: {
            subscribe: weekStore.subscribe,
            add: (item?: Day) =>
                update((data) => {
                    data.static.weekdays.push(
                        item ?? {
                            type: "day",
                            name: null,
                            id: nanoid(6),
                        }
                    );
                    return data;
                }),

            update: (id: string, day: Day) =>
                update((data) => {
                    data.static.weekdays.splice(
                        data.static.weekdays.findIndex((m) => m.id == id),
                        1,
                        day
                    );
                    return data;
                }),
            delete: (id: string) =>
                update((data) => {
                    data.static.weekdays = data.static.weekdays.filter(
                        (m) => m.id != id
                    );
                    return data;
                }),
            set: (weekdays: Week) =>
                update((data) => {
                    data.static.weekdays = [...weekdays];
                    return data;
                }),
        },
        monthStore: {
            subscribe: monthStore.subscribe,
            add: (name?: string) =>
                update((data) => {
                    data.static.months.push({
                        type: "month",
                        name: name ?? "",
                        length: 0,
                        id: nanoid(6),
                        interval: 1,
                        offset: 0,
                    });
                    data.static.padMonths = padMonth(data.static.months);
                    data.static.padDays = padDay(data.static.months);
                    return data;
                }),
            update: (id: string, month: Month) =>
                update((data) => {
                    data.static.months.splice(
                        data.static.months.findIndex((m) => m.id == id),
                        1,
                        month
                    );
                    data.static.padMonths = padMonth(data.static.months);
                    data.static.padDays = padDay(data.static.months);
                    return data;
                }),
            delete: (id: string) =>
                update((data) => {
                    data.static.months = data.static.months.filter(
                        (m) => m.id != id
                    );
                    data.static.padMonths = padMonth(data.static.months);
                    data.static.padDays = padDay(data.static.months);
                    return data;
                }),
            set: (months: Month[]) =>
                update((data) => {
                    data.static.months = [...months];
                    data.static.padMonths = padMonth(data.static.months);
                    data.static.padDays = padDay(data.static.months);
                    return data;
                }),
        },
        yearStore: {
            customYears,
            subscribe: yearStore.subscribe,
            add: (name?: string) =>
                update((data) => {
                    if (!data.static.years) {
                        data.static.years = [];
                    }
                    data.static.years.push({
                        type: "year",
                        name: name ?? "",
                        id: nanoid(6),
                    });
                    return data;
                }),
            update: (id: string, year: Year) =>
                update((data) => {
                    if (!data.static.years) {
                        data.static.years = [];
                    }
                    data.static.years.splice(
                        data.static.years.findIndex((m) => m.id == id),
                        1,
                        year
                    );
                    return data;
                }),
            delete: (id: string) =>
                update((data) => {
                    if (!data.static.years) {
                        data.static.years = [];
                    }
                    data.static.years = data.static.years.filter(
                        (m) => m.id != id
                    );
                    return data;
                }),
            set: (years: Year[]) =>
                update((data) => {
                    data.static.years = [...years];
                    return data;
                }),
        },
        eventStore: {
            subscribe: eventStore.subscribe,
            sortedStore: derived(eventStore, (events) => sortEventList(events)),
            set: (events: CalEvent[]) =>
                update((data) => {
                    data.events = [...events];
                    return data;
                }),
            add: (event: CalEvent) =>
                update((data) => {
                    data.events.push({ ...event });
                    return data;
                }),
            update: (id: string, event: CalEvent) =>
                update((data) => {
                    const index = data.events.findIndex((e) => e.id === id);

                    data.events.splice(index, 1, { ...event });
                    return data;
                }),
            delete: (id: string) =>
                update((data) => {
                    data.events = data.events.filter((e) => e.id !== id);
                    return data;
                }),
        },
        categoryStore: {
            subscribe: categoryStore.subscribe,
            set: (categories: CalEventCategory[]) =>
                update((data) => {
                    data.categories = [...categories];
                    return data;
                }),
            add: (category: CalEventCategory) =>
                update((data) => {
                    data.categories.push({ ...category });
                    return data;
                }),
            update: (id: string, category: CalEventCategory) =>
                update((data) => {
                    const index = data.categories.findIndex((e) => e.id === id);

                    data.categories.splice(index, 1, { ...category });
                    return data;
                }),
            delete: (id: string) =>
                update((data) => {
                    data.categories = data.categories.filter(
                        (c) => c.id !== id
                    );
                    return data;
                }),
        },
        displaySeasonalColors: {
            subscribe: displaySeasonalColors.subscribe,
            set: (val: boolean) => {
                update((data) => {
                    data.seasonal.displayColors = val;
                    return data;
                });
            },
        },
        interpolateColors: {
            subscribe: interpolateColors.subscribe,
            set: (val: boolean) => {
                update((data) => {
                    data.seasonal.interpolateColors = val;
                    return data;
                });
            },
        },
        seasonOffset: {
            subscribe: seasonOffset.subscribe,
            set: (val: number) => {
                update((data) => {
                    data.seasonal.offset = val;
                    return data;
                });
            },
        },
        seasonType: {
            subscribe: seasonType.subscribe,
            set: (val: SeasonType) => {
                update((data) => {
                    data.seasonal.type = val;
                    if (data.seasonal.type === SeasonType.DATED) {
                        data.seasonal.seasons = data.seasonal.seasons.map(
                            (season, i) => {
                                return {
                                    id: season.id,
                                    name: season.name,
                                    color: season.color,
                                    type: SeasonType.DATED,
                                    kind: SeasonKind.NONE,
                                    month: 0,
                                    day: 1 + i,
                                    weatherOffset: season.weatherOffset,
                                    weatherPeak: season.weatherOffset * 0.1,
                                };
                            }
                        );
                    } else {
                        data.seasonal.seasons = data.seasonal.seasons.map(
                            (season) => {
                                return {
                                    id: season.id,
                                    name: season.name,
                                    color: season.color,
                                    type: SeasonType.PERIODIC,
                                    kind: SeasonKind.NONE,
                                    duration:
                                        getEffectiveYearLength(data) /
                                        data.seasonal.seasons.length,
                                    peak: 0,
                                    weatherOffset: season.weatherOffset,
                                    weatherPeak: season.weatherOffset * 0.1,
                                };
                            }
                        );
                    }
                    return data;
                });
            },
        },
        seasonStore: {
            subscribe: seasonStore.subscribe,
            set: (seasons: Season[]) =>
                update((data) => {
                    (data.seasonal.seasons as Season[]) = [...seasons];
                    return data;
                }),
            add: (season: Season) =>
                update((data) => {
                    (data.seasonal.seasons as Season[]).push({
                        ...season,
                    });
                    if (data.seasonal.type === SeasonType.DATED) {
                        data.seasonal.seasons.sort((a, b) => {
                            if (compare(a.month, b.month)) {
                                return a.month - b.month;
                            }
                            return a.day - b.day;
                        });
                    }
                    return data;
                }),
            update: (id: string, season: Season) =>
                update((data) => {
                    const index = data.seasonal.seasons.findIndex(
                        (e) => e.id === id
                    );

                    if (index < 0) {
                        (data.seasonal.seasons as Season[]).push({
                            ...season,
                        });
                    } else {
                        (data.seasonal.seasons as Season[]).splice(index, 1, {
                            ...season,
                        });
                    }
                    if (data.seasonal.type === SeasonType.DATED) {
                        data.seasonal.seasons.sort((a, b) => {
                            if (compare(a.month, b.month)) {
                                return a.month - b.month;
                            }
                            return a.day - b.day;
                        });
                    }

                    return data;
                }),
            delete: (id: string) =>
                update((data) => {
                    (data.seasonal.seasons as Season[]) =
                        data.seasonal.seasons.filter((c) => c.id !== id);
                    if (data.seasonal.type === SeasonType.DATED) {
                        data.seasonal.seasons.sort((a, b) => {
                            if (compare(a.month, b.month)) {
                                return a.month - b.month;
                            }
                            return a.day - b.day;
                        });
                    }
                    return data;
                }),
        },
        weatherStore: {
            subscribe: weatherStore.subscribe,
            enabled: {
                subscribe: weatherEnabledStore.subscribe,
                set: (val: boolean) =>
                    update((data) => {
                        data.seasonal.weather.enabled = val;
                        return data;
                    }),
            },
            seed: {
                subscribe: weatherSeedStore.subscribe,
                set: (val: number) =>
                    update((data) => {
                        data.seasonal.weather.seed = val;
                        return data;
                    }),
            },
            tempUnitsStore: {
                subscribe: tempUnitsStore.subscribe,
                set: (val: UnitSystem) =>
                    update((data) => {
                        data.seasonal.weather.tempUnits = val;
                        return data;
                    }),
            },
            freezingPointStore: {
                subscribe: freezingPointStore.subscribe,
                set: (val: number) =>
                    update((data) => {
                        data.seasonal.weather.freezingPoint = val;
                        return data;
                    }),
            },
            windUnitsStore: {
                subscribe: windUnitsStore.subscribe,
                set: (val: UnitSystem) =>
                    update((data) => {
                        data.seasonal.weather.windUnits = val;
                        return data;
                    }),
            },
        },
        locationStore: {
            subscribe: locationStore.subscribe,
            set: (locations: Location[]) =>
                update((data) => {
                    data.locations.locations = [...locations];
                    return data;
                }),
            add: (location: Location) =>
                update((data) => {
                    (data.locations.locations as Location[]).push({
                        ...copy(location),
                    });

                    return data;
                }),
            update: (id: string, location: Location) =>
                update((data) => {
                    const index = data.locations.locations.findIndex(
                        (e) => e.id === id
                    );

                    if (index < 0) {
                        data.locations.locations.push({
                            ...copy(location),
                        });
                    } else {
                        data.locations.locations.splice(index, 1, {
                            ...copy(location),
                        });
                    }

                    return data;
                }),
            delete: (id: string) =>
                update((data) => {
                    data.locations.locations = data.locations.locations.filter(
                        (c) => c.id !== id
                    );
                    if (data.locations.defaultLocation == id) {
                        data.locations.defaultLocation = NO_LOCATION;
                    }
                    return data;
                }),
            defaultLocationStore: {
                subscribe: defaultLocationStore.subscribe,
                set: (location: string) =>
                    update((data) => {
                        data.locations.defaultLocation = location;
                        return data;
                    }),
            },
        },
        displayMoons: {
            subscribe: displayMoons.subscribe,
            set: (val: boolean) => {
                update((data) => {
                    data.static.displayMoons = val;
                    return data;
                });
            },
        },
        moonStore: {
            subscribe: moonStore.subscribe,
            set: (moons: Moon[]) =>
                update((data) => {
                    data.static.moons = [...moons];
                    return data;
                }),
            add: (moon: Moon) =>
                update((data) => {
                    data.static.moons.push({ ...moon });
                    return data;
                }),
            update: (id: string, moon: Moon) =>
                update((data) => {
                    const index = data.static.moons.findIndex(
                        (e) => e.id === id
                    );

                    if (index < 0) {
                        data.static.moons.push({ ...moon });
                    } else {
                        data.static.moons.splice(index, 1, { ...moon });
                    }

                    return data;
                }),
            delete: (id: string) =>
                update((data) => {
                    data.static.moons = data.static.moons.filter(
                        (c) => c.id !== id
                    );
                    return data;
                }),
        },
        leapDayDisabled: derived(
            monthStore,
            (months) => months.filter((m) => m.name?.length).length == 0
        ),
        eraStore: {
            subscribe: eraStore.subscribe,
            set: (eras: Era[]) =>
                update((data) => {
                    data.static.eras = [...eras];
                    return data;
                }),
            add: (era: Era) =>
                update((data) => {
                    data.static.eras.push(copy(era));
                    return data;
                }),
            update: (id: string, era: Era) =>
                update((data) => {
                    const index = data.static.eras.findIndex(
                        (e) => e.id === id
                    );

                    data.static.eras.splice(index, 1, copy(era));
                    return data;
                }),
            delete: (id: string) =>
                update((data) => {
                    data.static.eras = data.static.eras.filter(
                        (c) => c.id !== id
                    );
                    return data;
                }),
        },
        leapDayStore: {
            subscribe: leapDayStore.subscribe,
            set: (leapDays: LeapDay[]) =>
                update((data) => {
                    data.static.leapDays = [...leapDays];
                    return data;
                }),
            add: (leapDay: LeapDay) =>
                update((data) => {
                    data.static.leapDays.push({ ...leapDay });
                    return data;
                }),
            update: (id: string, leapDay: LeapDay) =>
                update((data) => {
                    const index = data.static.leapDays.findIndex(
                        (e) => e.id === id
                    );

                    data.static.leapDays.splice(index, 1, { ...leapDay });
                    return data;
                }),
            delete: (id: string) =>
                update((data) => {
                    data.static.leapDays = data.static.leapDays.filter(
                        (c) => c.id !== id
                    );
                    return data;
                }),
        },
        /** History */
        canRedo,
        redo,
        canUndo,
        undo,
    };
}

export default createCreatorStore;
