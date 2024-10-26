import type {
    Calendar,
    CalDate,
    CalEventCategory,
    EventLike,
    StaticCalendarData,
} from "src/@types";
import {
    type Readable,
    type Writable,
    derived,
    get,
    writable,
} from "svelte/store";
import { YearStoreCache } from "./years.store";
import { compareDates, dateString } from "src/utils/functions";
import { MoonCache } from "./cache/moon-cache";
import type Calendarium from "src/main";
import { EventStore } from "./events.store";
import type { MoonState } from "src/schemas/calendar/moons";
import { SettingsService } from "src/settings/settings.service";
import type { WeatherState } from "../schemas/calendar/weathers";
import { WeatherStateStore } from "./weather-state.store";

export type CalendarStore = ReturnType<typeof createCalendarStore>;

export interface CalendarStoreState {
    ephemeral: EphemeralState;
    calendar: string;
    id: string;
    child?: string;
}
export function createCalendarStore(calendar: Calendar, plugin: Calendarium) {
    const store = writable(calendar);
    const { set, update, subscribe } = store;

    const staticStore = createStaticStore(store);

    const current = derived(store, (cal) => cal.current);

    /** Event Cache */
    /** This cache is a Map< year number, year event cache > */
    const eventStore = new EventStore(calendar);
    const categories = derived(store, (c) => c.categories);

    /** Year Calculator Cache */
    const yearCalculator = new YearStoreCache(staticStore);
    const moonStates: Readable<MoonState[]> = derived(
        staticStore.moons,
        (moons) =>
            moons.map((m) => {
                return { ...m, phase: undefined };
            })
    );
    const moonCache = new MoonCache(moonStates, yearCalculator);

    const weatherStateStore = new WeatherStateStore(calendar);
    const weatherConditions = derived(store, (c) => c.weatherConditions)

    const EPHEMERAL_STORE_CACHE: Map<string, EphemeralStore> = new Map();

    const _getEphemeralStore = (id: string) => {
        if (EPHEMERAL_STORE_CACHE.has(id)) {
            return EPHEMERAL_STORE_CACHE.get(id)!;
        }
        const ephemeralStore = getEphemeralStore(
            store,
            staticStore,
            calendar,
            yearCalculator
        );
        EPHEMERAL_STORE_CACHE.set(id, ephemeralStore);
        return ephemeralStore;
    };

    return {
        getStoreState: (id: string) => {
            return {
                calendar: calendar.id,
                ephemeral: _getEphemeralStore(id).getEphemeralState(),
            };
        },

        set,
        update,
        subscribe,

        current,
        currentDisplay: derived([current, store], ([current, calendar]) => {
            return dateString(current, calendar);
        }),
        getDaysBeforeDate: (date: CalDate) => {
            return (
                get(yearCalculator.getYearFromCache(date.year).daysBefore) +
                get(
                    yearCalculator
                        .getYearFromCache(date.year)
                        .getMonthFromCache(date.month).daysBeforeAll
                ) +
                date.day
            );
        },
        getYearStoreForDate: (date: CalDate) => {
            return yearCalculator.getYearFromCache(date.year);
        },
        getMonthStoreForDate: (date: CalDate) => {
            return yearCalculator
                .getYearFromCache(date.year)
                .getMonthFromCache(date.month);
        },
        setCurrentDate: (date: CalDate) => {
            store.update((cal) => {
                cal.current = { ...date };
                return cal;
            });
            SettingsService.saveCalendars();
        },
        updateCalendar: (calendar: Calendar) => update((cal) => calendar),
        eventStore,

        getEventsForDate: (date: CalDate): Readable<EventLike[]> => {
            const events = eventStore.getEventsForDate(date);
            const eras = yearCalculator
                .getYearFromCache(date.year)
                .getMonthFromCache(date.month).eras;
            return derived([events, eras], ([events, eras]) => {
                return [
                    ...events,
                    ...eras.filter((e) => e.isEvent && e.date.day === date.day),
                ];
            });
        },
        /* addEvent: (date: CalDate) => {
            const modal = new CreateEventModal(plugin, calendar, null, date);

            modal.onClose = async () => {
                if (!modal.saved) return;
                calendar.events.push(modal.event);
                eventCache.invalidate(modal.event.date);

                await plugin.saveCalendars();
            };

            modal.open();
        }, */

        moonCache,

        weatherStateStore,
        getWeatherStatesForDate: (date: CalDate): Readable<WeatherState[]> => {
            return weatherStateStore.getWeatherStatesForDate(date);
        },

        categories,
        weatherConditions,
        //Readable store containing static calendar data
        staticStore,

        getEphemeralStore: _getEphemeralStore,
        yearCalculator,
        hasCategory: (category: string) =>
            get(categories).find((f) => f.id === category) != null,
        addCategory: (category: CalEventCategory) => {
            update((store) => {
                store.categories.push(category);
                return store;
            });
        },
    };
}

export type EphemeralStore = ReturnType<typeof getEphemeralStore>;
export enum ViewState {
    Year,
    Month,
    Week,
    Day,
}
export interface EphemeralState {
    viewState: ViewState;
    displayMoons: boolean;
    displayWeeks: boolean;
    displayDayNumber: boolean;
    hideEra: boolean;
    displayAbsoluteYear: boolean;
    displaying: CalDate;
    viewing: CalDate | null;
}
export function getEphemeralStore(
    store: Writable<Calendar>,
    staticStore: StaticStore,
    base: Calendar,
    yearCalculator: YearStoreCache
) {
    const displaying = writable({ ...base.current });

    const viewing = writable<CalDate | null>();

    const displayMoons = writable(base.static.displayMoons);
    const displayDayNumber = writable(base.static.displayDayNumber);
    const displayWeeks = writable(base.displayWeeks);
    const hideEra = writable(base.hideEra);
    const displayAbsoluteYear = writable(base.displayAbsoluteYear);
    const viewState = writable<ViewState>(ViewState.Month);
    let currentState = ViewState.Month;
    viewState.subscribe((v) => (currentState = v));

    const ephemeralStore: Readable<EphemeralState> = derived(
        [
            viewState,
            displayDayNumber,
            displayMoons,
            displayWeeks,
            hideEra,
            displayAbsoluteYear,
            displaying,
            viewing,
        ],
        ([
            viewState,
            displayDayNumber,
            displayMoons,
            displayWeeks,
            hideEra,
            displayAbsoluteYear,
            displaying,
            viewing,
        ]) => {
            return {
                viewState,
                displayDayNumber,
                displayMoons,
                displayWeeks,
                hideEra,
                displayAbsoluteYear,
                displaying,
                viewing,
            };
        }
    );

    return {
        ephemeralStore,
        initializeFromState: (state: EphemeralState) => {
            viewState.set(state.viewState);
            displayDayNumber.set(state.displayDayNumber);
            displayMoons.set(state.displayMoons);
            displayWeeks.set(state.displayWeeks);
            hideEra.set(state.hideEra);
            displayAbsoluteYear.set(state.displayAbsoluteYear);
            const config = get(staticStore.staticData);

            if (
                config.useCustomYears &&
                (state.displaying.year < 0 ||
                    state.displaying.year > (config.years?.length ?? 0) - 1)
            ) {
                state.displaying.year = 0;
            }

            displaying.set(state.displaying);
            viewing.set(state.viewing);
        },
        getEphemeralState: (): EphemeralState => {
            return {
                viewing: get(viewing),
                viewState: get(viewState),
                displaying: get(displaying),
                displayDayNumber: get(displayDayNumber),
                hideEra: get(hideEra),
                displayAbsoluteYear: get(displayAbsoluteYear),
                displayMoons: get(displayMoons),
                displayWeeks: get(displayWeeks),
            };
        },
        displayMoons,
        displayDayNumber,
        displayWeeks,
        hideEra,
        displayAbsoluteYear,
        viewState,

        //Displayed Date
        displaying,
        goToToday: () => displaying.set({ ...base.current }),
        displayDate: (date: CalDate | null) => {
            if (!date) date = base.current;
            displaying.set({ ...date });
        },
        displayingDisplay: derived(
            [displaying, store],
            ([display, calendar]) => {
                return dateString(display, calendar);
            }
        ),
        displayingMonth: derived([displaying], ([date]) =>
            yearCalculator
                .getYearFromCache(date.year)
                .getMonthFromCache(date.month)
        ),
        displayingYear: derived(
            [displaying, staticStore.years, staticStore.staticConfiguration],
            ([date, years, config]) =>
                config.useCustomYears ? years[date.year]?.name : date.year
        ),
        getPreviousMonth: (month: number, year: number) => {
            let yearStore = yearCalculator.getYearFromCache(year);
            if (month == 0) {
                const config = get(staticStore.staticConfiguration);
                if (config.useCustomYears && year > 0) {
                    year = year - 1 || -1;
                    yearStore = yearCalculator.getYearFromCache(year);
                    month = get(yearStore.months).length - 1;
                }
            } else {
                month = month - 1;
            }
            return yearStore.getMonthFromCache(month);
        },
        goToPrevious: () =>
            displaying.update((displaying) => {
                switch (currentState) {
                    case ViewState.Year:
                        let month =
                            (displaying.year - 1 || -1) === base.current.year
                                ? base.current.month
                                : 0;
                        return {
                            ...displaying,
                            month,
                            year: displaying.year - 1 || -1,
                        };
                    case ViewState.Week: {
                        let next = { ...displaying };
                        let year = yearCalculator.getYearFromCache(next.year);
                        let month = year.getMonthFromCache(next.month);
                        let weekArray = get(month.daysAsWeeks);
                        let weekIndex = weekArray.findIndex((w) =>
                            w.find((d) => d && d.number == displaying.day)
                        );
                        if (weekIndex < 1) {
                            next = decrementMonth(
                                next,
                                yearCalculator,
                                get(staticStore.staticData)
                            );
                            year = yearCalculator.getYearFromCache(next.year);
                            month = year.getMonthFromCache(next.month);
                            weekArray = get(month.daysAsWeeks);
                            weekIndex = weekArray.length;
                            let monthLength = get(month.days);
                            while (
                                !weekArray[weekIndex - 1].every(
                                    (d) => d && d.number <= monthLength
                                )
                            ) {
                                weekIndex--;
                                if (weekIndex < 1) {
                                    next = decrementMonth(
                                        next,
                                        yearCalculator,
                                        get(staticStore.staticData)
                                    );
                                    year = yearCalculator.getYearFromCache(
                                        next.year
                                    );
                                    month = year.getMonthFromCache(next.month);
                                    weekArray = get(month.daysAsWeeks);
                                    monthLength = get(month.days);
                                    weekIndex = weekArray.length;
                                }
                            }
                        }
                        next.day = weekArray[weekIndex - 1][0]!.number;

                        return next;
                    }
                    case ViewState.Month:
                        return decrementMonth(
                            displaying,
                            yearCalculator,
                            get(staticStore.staticData)
                        );
                    case ViewState.Day:
                        return incrementDay(
                            displaying,
                            yearCalculator,
                            get(staticStore.staticData)
                        );
                }
            }),
        getNextMonth: (month: number, year: number) => {
            let yearStore = yearCalculator.getYearFromCache(year);
            const months = get(yearStore.months);
            if (month == months.length - 1) {
                const config = get(staticStore.staticData);
                if (
                    config.useCustomYears &&
                    year < (config.years?.length ?? 0)
                ) {
                    yearStore = yearCalculator.getYearFromCache(year + 1 || 1);
                    month = 0;
                }
            } else {
                month = month + 1;
            }
            return yearStore.getMonthFromCache(month);
        },
        goToNext: () =>
            displaying.update((displaying) => {
                switch (currentState) {
                    case ViewState.Year:
                        let month =
                            (displaying.year + 1 || 1) === base.current.year
                                ? base.current.month
                                : 0;
                        return {
                            ...displaying,
                            month,
                            year: displaying.year + 1 || 1,
                        };
                    case ViewState.Week: {
                        let next = { ...displaying };
                        let year = yearCalculator.getYearFromCache(next.year);
                        let month = year.getMonthFromCache(next.month);
                        let weekArray = get(month.daysAsWeeks);
                        let weekIndex = weekArray.findIndex((w) =>
                            w.find((d) => d && d.number == displaying.day)
                        );
                        let monthLength = get(month.days);
                        if (
                            weekIndex + 1 >= weekArray.length ||
                            weekArray[weekIndex].some(
                                (d) => d && d.number >= monthLength
                            )
                        ) {
                            next = incrementMonth(
                                next,
                                yearCalculator,
                                get(staticStore.staticData)
                            );
                            year = yearCalculator.getYearFromCache(next.year);
                            month = year.getMonthFromCache(next.month);
                            weekArray = get(month.daysAsWeeks);
                            weekIndex =
                                weekArray.findIndex((w) =>
                                    w.every((d) => d && d.number > 0)
                                ) - 1;
                            monthLength = get(month.days);

                            while (
                                weekArray[weekIndex + 1].some(
                                    (d) => d && d.number > monthLength
                                )
                            ) {
                                weekIndex++;
                                if (weekIndex + 1 >= weekArray.length) {
                                    next = incrementMonth(
                                        next,
                                        yearCalculator,
                                        get(staticStore.staticData)
                                    );
                                    year = yearCalculator.getYearFromCache(
                                        next.year
                                    );
                                    month = year.getMonthFromCache(next.month);
                                    weekArray = get(month.daysAsWeeks);
                                    monthLength = get(month.days);
                                    weekIndex = 0;
                                }
                            }
                        }
                        next.day = weekArray[weekIndex + 1][0]!.number;
                        return next;
                    }
                    case ViewState.Month:
                        return incrementMonth(
                            displaying,
                            yearCalculator,
                            get(staticStore.staticData)
                        );
                    case ViewState.Day:
                        return incrementDay(
                            displaying,
                            yearCalculator,
                            get(staticStore.staticData)
                        );
                }
            }),

        //Viewed Date (day view)
        viewing,
        goToPreviousDay: () =>
            viewing.update((viewing) => {
                if (!viewing) return viewing;
                return decrementDay(
                    viewing,
                    yearCalculator,
                    get(staticStore.staticData)
                );
            }),
        goToNextDay: () =>
            viewing.update((viewing) => {
                if (!viewing) return viewing;
                return incrementDay(
                    viewing,
                    yearCalculator,
                    get(staticStore.staticData)
                );
            }),
    };
}
export type StaticStore = ReturnType<typeof createStaticStore>;
function createStaticStore(store: Writable<Calendar>) {
    /** Static Calendar Data */
    const staticData = derived(store, (cal) => cal.static);
    const leapDays = derived(staticData, (data) => data.leapDays);
    const months = derived(staticData, (data) => data.months);
    const moons = derived(staticData, (data) => data.moons);
    const weekdays = derived(staticData, (data) => data.weekdays);
    const years = derived(staticData, (data) => data.years ?? []);
    const eras = derived(staticData, (data) =>
        (data.eras ?? []).sort((a, b) => {
            if (a.isStartingEra) return Number.NEGATIVE_INFINITY;
            if (b.isStartingEra) return Number.POSITIVE_INFINITY;
            return compareDates(a.date, b.date);
        })
    );

    function getDaysInAYear() {
        return get(months).reduce((a, b) => a + b.length, 0);
    }

    const staticConfiguration = derived(staticData, (data) => {
        return {
            firstWeekDay: data.firstWeekDay,
            overflow: data.overflow,
            offset: data.offset,
            incrementDay: data.incrementDay,
            useCustomYears: data.useCustomYears,
            dayDisplayCallback: data.dayDisplayCallback,
        };
    });
    return {
        getDaysInAYear,

        staticData,
        leapDays,
        months,
        moons,
        staticConfiguration,
        weekdays,
        years,
        eras,
    };
}

function incrementMonth(
    date: CalDate,
    yearCalculator: YearStoreCache,
    config: StaticCalendarData
) {
    const next = { ...date };
    const year = yearCalculator.getYearFromCache(date.year);
    const months = get(year.months);
    if (next.month == months.length - 1) {
        if (
            !config.useCustomYears ||
            next.year < (config.years?.length || 0) - 1
        ) {
            next.month = 0;
            next.year = next.year + 1 || 1;
        }
    } else {
        next.month++;
    }
    return next;
}
function decrementMonth(
    date: CalDate,
    yearCalculator: YearStoreCache,
    config: StaticCalendarData
) {
    const next = { ...date };
    if (next.month == 0) {
        if (!config.useCustomYears || next.year - 1 > -1) {
            next.year = config.useCustomYears
                ? next.year - 1
                : next.year - 1 || -1;

            const year = yearCalculator.getYearFromCache(next.year);
            const months = get(year.months);
            next.month = months.length - 1;
        }
    } else {
        next.month--;
    }
    return next;
}

function incrementDay(
    date: CalDate,
    yearCalculator: YearStoreCache,
    config: StaticCalendarData
) {
    let next = { ...date };
    const days = get(
        yearCalculator.getYearFromCache(next.year).getMonthFromCache(next.month)
            .days
    );
    if (next.day + 1 > days) {
        next = incrementMonth(date, yearCalculator, config);
        next.day = 1;
    } else {
        next.day++;
    }
    return next;
}
function decrementDay(
    date: CalDate,
    yearCalculator: YearStoreCache,
    config: StaticCalendarData
) {
    let next = { ...date };

    if (next.day - 1 <= 0) {
        next = decrementMonth(date, yearCalculator, config);
        next.day = get(
            yearCalculator
                .getYearFromCache(next.year)
                .getMonthFromCache(next.month).days
        );
    } else {
        next.day--;
    }
    return next;
}
