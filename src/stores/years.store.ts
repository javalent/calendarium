import { derived, get } from "svelte/store";
import { type StaticStore } from "./calendar.store";
import { type CalDate } from "src/schemas";
import { daysFromYearOne, getFirstDayOfYear } from "../utils/functions";
import { MonthStore } from "./month.store";
import { type Era } from "src/schemas/calendar/timespans";

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
    daysBefore(date: CalDate): number {
        const year = this.getYearFromCache(date.year);
        const yearDaysBefore = get(year.daysBefore);
        const month = year.getMonthFromCache(date.month);
        return yearDaysBefore + get(month.daysBefore) + date.day - 1;
    }
    daysBetween(start: CalDate, end: CalDate): number {
        //start
        let startDB = this.daysBefore(start);
        let endDB = this.daysBefore(end);

        return Math.max(startDB, endDB) - Math.min(startDB, endDB);
    }
}

export class YearStore {
    monthCache = new Map<number, MonthStore>();
    constructor(public year: number, public staticStore: StaticStore) {}
    eras = derived(this.staticStore.eras, (eras) => {
        const list: Era[] = [];
        for (let i = eras.length - 1; i >= 0; i--) {
            const era = eras[i];
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
    months = derived([this.staticStore.months, this.eras], ([months, eras]) => {
        let end = eras.find(
            (era) => era.endsYear && era.date.year === this.year
        );
        if (end) {
            months = months.slice(0, (end.date as CalDate).month + 1);
        }
        return months.filter(
            (m) =>
                !m.interval || (this.year - (m.offset ?? 0)) % m.interval == 0
        );
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
            this.staticStore.months,
            this.staticStore.weekdays,
            this.staticStore.leapDays,
            this.staticStore.eras,
        ],
        ([config, months, weekdays, leapDays, eras]) => {
            let year = this.year;

            //find the
            for (let i = eras.length - 1; i >= 0; i--) {
                const era = eras[i];
                if (era.isStartingEra) break;
                if (!era.endsYear) continue;
                if (era.date.year >= this.year) continue;
                /** Normalize the year to consider off the last era that ended the year. */
                year = this.year - era.date.year;
            }
            return getFirstDayOfYear(
                year,
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
