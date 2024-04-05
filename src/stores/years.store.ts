import { derived, get } from "svelte/store";
import type { StaticStore } from "./calendar.store";
import type { CalEvent } from "src/@types";
import { sortEventList, wrap } from "../utils/functions";
import { MonthStore } from "./month.store";
import type { Month, Week, LeapDay, Era } from "src/schemas/calendar/timespans";

/* export type YearStore = ReturnType<typeof createYearStore>; */
export type YearCalculatorCache = Map<number, YearStore>;

export class YearStoreCache {
    cache: YearCalculatorCache = new Map();
    constructor(public staticStore: StaticStore) {}
    getYearFromCache(year: number) {
        if (!this.cache.has(year)) {
            this.cache.set(year, new YearStore(year, this.staticStore));
        }
        return this.cache.get(year)!;
    }
}

export class YearStore {
    monthCache = new Map<number, MonthStore>();
    constructor(public year: number, public staticStore: StaticStore) {}
    months = derived(this.staticStore.months, (months) => {
        return months.filter(
            (m) =>
                !m.interval || (this.year - (m.offset ?? 0)) % m.interval == 0
        );
    });
    eras = derived(this.staticStore.eras, (eras) => {
        const sorted = sortEventList(eras);

        const list: Era[] = [];
        for (let i = sorted.length - 1; i >= 0; i--) {
            const era = sorted[i];
            if (era.isStartingEra) {
                if (!list.length) list.push(era);
            } else if (era.date.year <= this.year) {
                if (era.end && era.end.year < this.year) {
                    break;
                }
                list.push(era);
            }
        }
        return list;
    });
    daysBefore = derived(
        [this.months, this.staticStore.leapDays],
        ([months, leapDays]) => {
            return daysFromYearOne(this.year, months, leapDays);
        }
    );
    firstDay = derived(
        [
            this.staticStore.staticConfiguration,
            this.months,
            this.staticStore.weekdays,
            this.staticStore.leapDays,
        ],
        ([config, months, weekdays, leapDays]) => {
            return getFirstDayOfYear(
                this.year,
                months,
                weekdays,
                leapDays,
                config.overflow,
                config.firstWeekDay,
                config.offset
            );
        }
    );
    display = derived(
        [this.staticStore.years, this.staticStore.staticConfiguration],
        ([years, config]) => {
            if (!config.useCustomYears) return this.year;
            return years[this.year].name;
        }
    );
    leapDays = derived([this.staticStore.leapDays], ([leapDays]) => {
        return leapDays.filter((leapday) =>
            leapday.interval
                .sort((a, b) => a.interval - b.interval)
                .some(({ interval, exclusive }, index, array) => {
                    if (!interval) return false;
                    if (exclusive && index == 0) {
                        return (
                            (this.year - (leapday.offset ?? 0)) % interval != 0
                        );
                    }

                    if (exclusive) return;

                    if (array[index + 1] && array[index + 1].exclusive) {
                        return (
                            (this.year - (leapday.offset ?? 0)) % interval ==
                                0 &&
                            (this.year - (leapday.offset ?? 0)) %
                                array[index + 1].interval !=
                                0
                        );
                    }
                    return (this.year - (leapday.offset ?? 0)) % interval == 0;
                })
        );
    });
    getMonthFromCache(month: number) {
        const monthStore =
            this.monthCache.get(month) ??
            new MonthStore(get(this.months)[month], this, this.staticStore);
        if (!this.monthCache.has(month)) {
            this.monthCache.set(month, monthStore);
        }
        return monthStore;
    }
}

export function getFirstDayOfYear(
    year: number,
    months: Month[],
    weekdays: Week,
    leapDays: LeapDay[],
    overflow: boolean,
    firstWeekDay: number,
    offset?: number
) {
    if (!overflow) return 0;
    if (year === 1) return firstWeekDay;

    /** If the year is negative, then everything needs to be inverted. */
    const mult = year < 0 ? -1 : 1;

    return wrap(
        mult *
            ((daysFromYearOne(year, months, leapDays) % weekdays.length) +
                mult * firstWeekDay +
                mult * (offset ?? 0)),
        weekdays.length
    );
}

/**
 * This needs to calculate how many days there are between a given year and a hypothetical "year zero".
 *
 * If the year passed in is negative, it should calcaulate "up".
 */
export function daysFromYearOne(
    original: number,
    months: Month[],
    leapDays: LeapDay[],
    includeIntercalary: boolean = false
) {
    if (original == 1) return 0;
    let year = original >= 1 ? original : original + 1;

    return (
        Math.abs(year - 1) *
            months
                .filter((m) => includeIntercalary || m.type == "month")
                .reduce((a, b) => a + b.length, 0) +
        leapDaysBeforeYear(original, leapDays)
    );
}

export function leapDaysBeforeYear(original: number, leapDays: LeapDay[]) {
    let year = Math.abs(original);

    /** If we're checking year 1, there are no leap days. */
    if (year == 1) return 0;
    /** Subtract 1 from tester. We're looking for leap days BEFORE the year.
     * If the year is negative, then we don't want to substract anything.
     */
    const yearPrior = original < 0 ? year : year - 1;

    let total = 0;
    /** Iterate over each leap day. */
    for (const { interval, offset } of leapDays.filter((l) => !l.intercalary)) {
        let leapdays = 0;

        /** Iterate over each condition on each leapday. */
        for (let i = 0; i < interval.length; i++) {
            const condition = interval[i];
            /** Determine how many leap days match non-exclusive rules AFTER this rule.
             * This has to be done to avoid "double-counting" days for days that match multiple rules.
             */
            const rest = interval
                .slice(i + 1)
                .filter((c) => !c.exclusive)
                .map((c) =>
                    Math.floor(
                        (yearPrior + (c.ignore ? 0 : offset)) / c.interval
                    )
                )
                .reduce((a, b) => a + b, 0);
            /** Calculate how many days match this rule. */
            const calc = Math.floor(
                (yearPrior + (condition.ignore ? 0 : offset)) /
                    condition.interval
            );
            if (condition.exclusive) {
                /** If the rule is exlusive, subtract the result from the total, then add in the rest. */
                leapdays -= calc;
                leapdays += rest;
            } else {
                /** If the rule is exlusive, add the result to the total, then subtract out the rest. */
                leapdays += calc;
                leapdays -= rest;
            }
        }
        total += leapdays;
    }
    return total;
}
