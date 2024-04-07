import { type StaticStore } from "./calendar.store";
import { YearStore } from "./years.store";
import { type Readable, derived, get } from "svelte/store";
import { nanoid, wrap } from "../utils/functions";
import type {
    Month,
    DayOrLeapDay,
    DefinedLeapDay,
    Era,
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
            if (this.month.type === "intercalary") return 0;
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
    eras = derived(this.year.eras, (eras) => {
        const list: Era[] = [];
        const index = get(this.index);
        for (let i = 0; i < eras.length; i++) {
            const era = eras[i];
            if (era.isStartingEra) {
                list.push(era);
                break;
            }
            if (era.date.year === this.year.year && era.date.month === index) {
                list.push(era);
                break;
            }
            if (
                era.date.year < this.year.year ||
                (era.date.year === this.year.year && era.date.month < index)
            ) {
                if (
                    era.end &&
                    (era.end.year < this.year.year ||
                        (era.end.year === this.year.year &&
                            era.end.month < index))
                ) {
                    break;
                }
                list.push(era);
            }
        }
        return list;
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
            this.eras,
            this.staticStore.eras,
        ],
        ([weekdays, days, firstDay, leapDays, data, eras, allEras]) => {
            let weekArray: (DayOrLeapDay | null)[][] = [];
            let daysAdded = 0;
            let intercals = 0;
            while (daysAdded < days) {
                //Initialize the day array.
                //The first week of the month should include negative numbers for the prior month.
                //If the year before this was ended early due to an era and I am the first month, I should not
                //show negatives.
                let showNegatives = true;
                if (!weekArray.length && get(this.index) === 0) {
                    for (let i = allEras.length - 1; i >= 0; i--) {
                        const era = allEras[i];

                        if (era.isStartingEra) break;
                        if (!era.endsYear) continue;
                        if (era.date.year !== this.year.year - 1) continue;

                        /** Normalize the year to consider off the last era that ended the year. */
                        showNegatives = false;
                        break;
                    }
                }

                let dayArray: (DayOrLeapDay | null)[] =
                    weekArray.length === 0
                        ? [...Array(firstDay).keys()].reverse().map((k) => {
                              return showNegatives
                                  ? {
                                        type: "day",
                                        number: -1 * k,
                                        name: null,
                                        id: nanoid(3),
                                    }
                                  : null;
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
                    let shouldEndEra = eras.find(
                        (era) =>
                            era.endsYear &&
                            era.date.year === this.year.year &&
                            era.date.month === get(this.index)
                    );
                    if (shouldEndEra && shouldEndEra.date.day === daysAdded) {
                        weekArray.push(dayArray);
                        return weekArray;
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
