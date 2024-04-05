import type { Calendar, CalDate, CalEventCategory, EventLike } from "src/@types";
import {
    type Readable,
    type Writable,
    derived,
    get,
    writable,
} from "svelte/store";
import { YearStoreCache } from "./years.store";
import { compareDates, compareEvents, dateString } from "src/utils/functions";
import { MoonCache } from "./cache/moon-cache";
import type Calendarium from "src/main";
import { EventStore } from "./events.store";
import type { MoonState } from "src/schemas/calendar/moons";
import { EraCache } from "./cache/era-cache";

export type CalendarStore = ReturnType<typeof createCalendarStore>;

export interface CalendarStoreState {
    ephemeral: EphemeralState;
    calendar: string;
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
    const eraCache = new EraCache(staticStore.eras);

    let ephemeralStore = getEphemeralStore(
        store,
        staticStore,
        calendar,
        yearCalculator
    );

    return {
        getStoreState: () => {
            return {
                calendar: calendar.id,
                ephemeral: ephemeralStore.getEphemeralState(),
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
            plugin.saveCalendars();
        },
        updateCalendar: (calendar: Calendar) => update((cal) => calendar),
        eventStore,

        getEventsForDate: (date: CalDate): Readable<EventLike[]> => {
            const events = eventStore.getEventsForDate(date);
            const eras = eraCache.getItemsOrRecalculate(date);
            return derived([events, eras], ([events, eras]) => {
                return [
                    ...events,
                    ...eras.filter(e => e.isEvent)
                ]
            })
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
        eraCache,
        categories,
        //Readable store containing static calendar data
        staticStore,

        ephemeralStore,
        getEphemeralStore: () => {
            ephemeralStore = getEphemeralStore(
                store,
                staticStore,
                calendar,
                yearCalculator
            );
            return ephemeralStore;
        },
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

    return {
        initializeFromState: (state: EphemeralState) => {
            viewState.set(state.viewState);
            displayDayNumber.set(state.displayDayNumber);
            displayMoons.set(state.displayMoons);
            displayWeeks.set(state.displayWeeks);
            hideEra.set(state.hideEra);
            displayAbsoluteYear.set(state.displayAbsoluteYear);
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
                config.useCustomYears ? years[date.year].name : date.year
        ),
        previousMonth: derived([displaying], ([displaying]) => {
            let { year, month } = displaying;
            let yearStore = yearCalculator.getYearFromCache(year);
            if (month == 0) {
                year = year - 1 || -1;
                yearStore = yearCalculator.getYearFromCache(year);
                month = get(yearStore.months).length - 1;
            } else {
                month = month - 1;
            }
            return yearStore.getMonthFromCache(month);
        }),
        getPreviousMonth: (month: number, year: number) => {
            let yearStore = yearCalculator.getYearFromCache(year);
            if (month == 0) {
                year = year - 1 || -1;
                yearStore = yearCalculator.getYearFromCache(year);
                month = get(yearStore.months).length - 1;
            } else {
                month = month - 1;
            }
            return yearStore.getMonthFromCache(month);
        },
        goToPrevious: () =>
            displaying.update((displaying) => {
                switch (currentState) {
                    case ViewState.Year:
                        return {
                            ...displaying,
                            month: 0,
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
                            next = decrementMonth(next, yearCalculator);
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
                                    next = decrementMonth(next, yearCalculator);
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
                        return decrementMonth(displaying, yearCalculator);
                    case ViewState.Day:
                        return incrementDay(displaying, yearCalculator);
                }
            }),

        nextMonth: derived([displaying], ([displaying]) => {
            let yearStore = yearCalculator.getYearFromCache(displaying.year);
            const months = get(yearStore.months);
            let month = displaying.month;
            if (displaying.month == months.length - 1) {
                yearStore = yearCalculator.getYearFromCache(
                    displaying.year + 1 || 1
                );
                month = 0;
            } else {
                month = month + 1;
            }
            return yearStore.getMonthFromCache(month);
        }),
        getNextMonth: (month: number, year: number) => {
            let yearStore = yearCalculator.getYearFromCache(year);
            const months = get(yearStore.months);
            if (month == months.length - 1) {
                yearStore = yearCalculator.getYearFromCache(year + 1 || 1);
                month = 0;
            } else {
                month = month + 1;
            }
            return yearStore.getMonthFromCache(month);
        },
        goToNext: () =>
            displaying.update((displaying) => {
                switch (currentState) {
                    case ViewState.Year:
                        return {
                            ...displaying,
                            month: 0,
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
                            next = incrementMonth(next, yearCalculator);
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
                                    next = incrementMonth(next, yearCalculator);
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
                        return incrementMonth(displaying, yearCalculator);
                    case ViewState.Day:
                        return incrementDay(displaying, yearCalculator);
                }
            }),

        //Viewed Date (day view)
        viewing,
        goToPreviousDay: () =>
            viewing.update((viewing) => {
                if (!viewing) return viewing;
                return decrementDay(viewing, yearCalculator);
            }),
        goToNextDay: () =>
            viewing.update((viewing) => {
                if (!viewing) return viewing;
                return incrementDay(viewing, yearCalculator);
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
    console.log("🚀 ~ file: calendar.store.ts:403 ~ eras:", get(eras));

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

function incrementMonth(date: CalDate, yearCalculator: YearStoreCache) {
    const next = { ...date };
    const year = yearCalculator.getYearFromCache(date.year);
    const months = get(year.months);
    if (next.month == months.length - 1) {
        next.month = 0;
        next.year = next.year + 1 || 1;
    } else {
        next.month++;
    }
    return next;
}
function decrementMonth(date: CalDate, yearCalculator: YearStoreCache) {
    const next = { ...date };
    if (next.month == 0) {
        next.year = next.year - 1 || -1;

        const year = yearCalculator.getYearFromCache(next.year);
        const months = get(year.months);
        next.month = months.length - 1;
    } else {
        next.month--;
    }
    return next;
}

function incrementDay(date: CalDate, yearCalculator: YearStoreCache) {
    let next = { ...date };
    const days = get(
        yearCalculator.getYearFromCache(next.year).getMonthFromCache(next.month)
            .days
    );
    if (next.day + 1 > days) {
        next = incrementMonth(date, yearCalculator);
        next.day = 1;
    } else {
        next.day++;
    }
    return next;
}
function decrementDay(date: CalDate, yearCalculator: YearStoreCache) {
    let next = { ...date };

    if (next.day - 1 <= 0) {
        next = decrementMonth(date, yearCalculator);
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
