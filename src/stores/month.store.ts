import type { DayOrLeapDay, DefinedLeapDay, Month } from "src/@types";
import { type StaticStore } from "./calendar.store";
import { YearStore } from "./years.store";
import { type Readable, derived } from "svelte/store";
import { wrap } from "../utils/functions";

export class MonthStore {
    constructor(
        public month: Month,
        public year: YearStore,
        public staticStore: StaticStore
    ) {}
    get name() {
        return this.month.name;
    }
    index = derived([this.year.months], ([months]) => {
        return months.indexOf(this.month);
    });
    weekdays = derived([this.staticStore.weekdays], ([week]) => {
        if (this.month.type == "intercalary") return week;
        return this.month.week ?? week;
    });
    daysBefore = derived(
        [this.index, this.year.leapDays, this.year.months],
        ([index, leapDays, months]) => {
            return (
                months
                    .slice(0, index)
                    .filter((m) => m.type == "month")
                    .reduce((a, b) => a + b.length, 0) +
                leapDays.filter((l) => l.timespan < index).length
            );
        }
    );
    daysBeforeAll = derived(
        [this.index, this.year.leapDays, this.year.months],
        ([index, leapDays, months]) => {
            return (
                months.slice(0, index).reduce((a, b) => a + b.length, 0) +
                leapDays.filter((l) => l.timespan < index).length
            );
        }
    );
    firstDay = derived(
        [this.year.firstDay, this.daysBefore, this.weekdays],
        ([firstDayOfYear, daysBefore, weekdays]) => {
            return wrap(
                (daysBefore % weekdays.length) + firstDayOfYear,
                weekdays.length
            );
        }
    );
    leapDays = derived(
        [this.year.leapDays, this.index],
        ([leapDays, index]) => {
            return leapDays.filter((l) => {
                return l.timespan == index;
            });
        }
    );
    days = derived(this.leapDays, (leapDays) => {
        return this.month.length + leapDays.length;
    });
    lastDay = derived(
        [this.year.firstDay, this.daysBefore, this.weekdays, this.days],
        ([firstDayOfYear, daysBefore, weekdays, days]) => {
            return wrap(
                (daysBefore % weekdays.length) + firstDayOfYear + days,
                weekdays.length
            );
        }
    );
    weeks = derived(
        [this.weekdays, this.lastDay, this.firstDay],
        ([weekdays, lastDay, firstDay]) =>
            Math.ceil((firstDay + this.month.length) / weekdays.length) +
            (weekdays.length - lastDay <= weekdays.length / 2 ? 1 : 0)
    );

    daysAsWeeks: Readable<Array<(DayOrLeapDay | null)[]>> = derived(
        [this.weeks, this.weekdays, this.days, this.firstDay, this.leapDays],
        ([weeks, weekdays, days, firstDay, leapDays]) => {
            let weekArray: (DayOrLeapDay | null)[][] = [];
            for (let week = 0; week < weeks; week++) {
                let dayArray: (DayOrLeapDay | null)[] = [];
                let intercals = 0;
                for (
                    let weekday = 0;
                    weekday < weekdays.length + intercals;
                    weekday++
                ) {
                    let day: number;
                    if (weekday == 0 && weekArray.length) {
                        const lastWeek = weekArray[weekArray.length - 1];
                        day = lastWeek[lastWeek.length - 1]!.number;
                    } else if (dayArray.length) {
                        day = dayArray[dayArray.length - 1]!.number;
                    } else {
                        day = weekday + week * weekdays.length - firstDay;
                    }
                    if (day >= days && this.month.type == "intercalary") break;
                    const leapday = leapDays.find(
                        (leapday) => leapday.after == day
                    );
                    if (leapday) {
                        const definedLeapDay: DefinedLeapDay = {
                            ...leapday,
                            number: day + 1,
                        };
                        if (leapday.intercalary) {
                            if (dayArray.length) weekArray.push(dayArray);
                            weekArray.push([definedLeapDay]);
                            if (
                                definedLeapDay.after &&
                                definedLeapDay.after > 0
                            ) {
                                dayArray = [
                                    ...Array(dayArray.length + 1).keys(),
                                ].map((k) => null);
                            } else {
                                intercals++;
                                dayArray = [];
                            }
                        } else {
                            dayArray.push(definedLeapDay);
                        }
                    } else {
                        dayArray.push({
                            type: "day",
                            number: day + 1,
                            name: null,
                            id: null,
                        });
                    }
                }
                weekArray.push(dayArray);
            }
            return weekArray;
        }
    );

    firstWeekNumber = derived(
        [this.daysBeforeAll, this.weekdays, this.year.firstDay],
        ([daysBefore, week, firstDay]) => {
            return Math.floor((daysBefore + firstDay) / week.length);
        }
    );
}
