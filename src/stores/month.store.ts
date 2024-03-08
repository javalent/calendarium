import { type StaticStore } from "./calendar.store";
import { YearStore } from "./years.store";
import { type Readable, derived } from "svelte/store";
import { nanoid, wrap } from "../utils/functions";
import type {
    Month,
    DayOrLeapDay,
    DefinedLeapDay,
} from "src/schemas/calendar/timespans";

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
                leapDays.filter((l) => !l.intercalary && l.timespan < index)
                    .length
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
        [
            this.year.firstDay,
            this.daysBefore,
            this.weekdays,
            this.staticStore.staticData,
        ],
        ([firstDayOfYear, daysBefore, weekdays, data]) => {
            if (!data.overflow) return 0;
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
                (daysBefore % weekdays.length) + firstDayOfYear + days - 1,
                weekdays.length
            );
        }
    );
    /**
     * This should return every day of the month, sorted into its appropriate week.
     * Each array represents 1 week.
     * Each element within each array represents 1 day.
     *
     * To "skip" days in the UI, null should be used.
     */
    daysAsWeeks: Readable<Array<(DayOrLeapDay | null)[]>> = derived(
        [
            this.weekdays,
            this.days,
            this.firstDay,
            this.leapDays,
            this.staticStore.staticData,
        ],
        ([weekdays, days, firstDay, leapDays, data]) => {
            let weekArray: (DayOrLeapDay | null)[][] = [];
            let daysAdded = 0;
            let intercals = 0;
            while (daysAdded < days) {
                //Initialize the day array.
                //The first week of the month should include negative numbers for the prior month.
                let dayArray: (DayOrLeapDay | null)[] =
                    weekArray.length === 0
                        ? [...Array(firstDay).keys()].reverse().map((k) => {
                              return {
                                  type: "day",
                                  number: -1 * k,
                                  name: null,
                                  id: nanoid(3),
                              };
                          })
                        : [];

                while (dayArray.length < weekdays.length) {
                    daysAdded++;

                    // Check if this should be a leap day instead of a "regular" day.
                    const leapday = leapDays.find(
                        (leapday) =>
                            leapday.after && leapday.after == daysAdded - 1
                    );

                    if (leapday) {
                        const definedLeapDay: DefinedLeapDay = {
                            ...leapday,
                            number: daysAdded,
                        };
                        if (!leapday.intercalary) {
                            dayArray.push(definedLeapDay);
                        } else {
                            for (let i = 0; i < intercals; i++) {
                                if (dayArray.length == weekdays.length) {
                                    weekArray.push(dayArray);
                                    dayArray = [];
                                }
                                dayArray.push({
                                    type: "day",
                                    number: daysAdded,
                                    name: null,
                                    id: nanoid(3),
                                });
                                daysAdded++;
                                definedLeapDay.number++;
                            }
                            intercals++;
                            if (dayArray.length) {
                                weekArray.push(dayArray);
                            }
                            weekArray.push([definedLeapDay]);
                            if (
                                dayArray.length > 0 &&
                                dayArray.length < weekdays.length
                            ) {
                                weekArray.push(
                                    [...Array(dayArray.length)].map((k) => null)
                                );
                            }
                            dayArray = [];
                            if (daysAdded === days) break;
                        }
                    } else {
                        dayArray.push({
                            type: "day",
                            number: daysAdded,
                            name: null,
                            id: nanoid(3),
                        });
                    }
                    // Too many days for this intercalary month, stop adding them.
                    // This prevents displaying the "overflow" days.
                    if (
                        daysAdded >= days &&
                        (this.month.type == "intercalary" || !data.overflow)
                    ) {
                        break;
                    }
                }
                weekArray.push(dayArray);
            }

            return weekArray;
        }
    );
    weeks = derived([this.daysAsWeeks], ([weeks]) => {
        return weeks.length;
    });

    firstWeekNumber = derived(
        [this.daysBeforeAll, this.weekdays, this.year.firstDay],
        ([daysBefore, week, firstDay]) => {
            return Math.floor((daysBefore + firstDay) / week.length);
        }
    );
}
