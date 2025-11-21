import type { Calendar } from "../src/@types";
import { daysFromYearOne, getFirstDayOfYear } from "../src/utils/functions";
import { PRESET_CALENDARS } from "../src/utils/presets";
import { vi, test, expect } from "vitest";

const GREGORIAN: Calendar = PRESET_CALENDARS.find(
    (p) => p.name == "Gregorian Calendar"
);
const NALOREN: Calendar = PRESET_CALENDARS.find(
    (p) => p.name == "Naloren Calendar"
);

test("Days Before Year (Gregorian)", () => {
    expect(
        daysFromYearOne(1, GREGORIAN.static.months, GREGORIAN.static.leapDays)
    ).toBe(0);
    expect(
        daysFromYearOne(2, GREGORIAN.static.months, GREGORIAN.static.leapDays)
    ).toBe(365);
    expect(
        daysFromYearOne(5, GREGORIAN.static.months, GREGORIAN.static.leapDays)
    ).toBe(365 * 4 + 1);
    expect(
        daysFromYearOne(20, GREGORIAN.static.months, GREGORIAN.static.leapDays)
    ).toBe(365 * 19 + 4);
});
test("Days Before Negative Year (Gregorian)", () => {
    expect(
        daysFromYearOne(-1, GREGORIAN.static.months, GREGORIAN.static.leapDays)
    ).toBe(365);
    expect(
        daysFromYearOne(-2, GREGORIAN.static.months, GREGORIAN.static.leapDays)
    ).toBe(365 * 2);
    expect(
        daysFromYearOne(-4, GREGORIAN.static.months, GREGORIAN.static.leapDays)
    ).toBe(365 * 4 + 1);
    expect(
        daysFromYearOne(-20, GREGORIAN.static.months, GREGORIAN.static.leapDays)
    ).toBe(365 * 20 + 5);
});

test("First Weekday (Gregorian)", () => {
    expect(
        getFirstDayOfYear(
            2023,
            GREGORIAN.static.months,
            GREGORIAN.static.weekdays,
            GREGORIAN.static.leapDays,
            GREGORIAN.static.overflow,
            GREGORIAN.static.firstWeekDay,
            GREGORIAN.static.offset
        )
    ).toBe(0);
    expect(
        getFirstDayOfYear(
            2024,
            GREGORIAN.static.months,
            GREGORIAN.static.weekdays,
            GREGORIAN.static.leapDays,
            GREGORIAN.static.overflow,
            GREGORIAN.static.firstWeekDay,
            GREGORIAN.static.offset
        )
    ).toBe(1);
    expect(
        getFirstDayOfYear(
            2024,
            GREGORIAN.static.months,
            GREGORIAN.static.weekdays,
            GREGORIAN.static.leapDays,
            GREGORIAN.static.overflow,
            GREGORIAN.static.firstWeekDay,
            GREGORIAN.static.offset
        )
    ).toBe(1);
});

test("Leap month fuck with weekdays (Naloren)", () => {
    expect(
        getFirstDayOfYear(
            3,
            NALOREN.static.months,
            NALOREN.static.weekdays,
            NALOREN.static.leapDays,
            NALOREN.static.overflow,
            NALOREN.static.firstWeekDay,
            NALOREN.static.offset
        )
    ).toBe(1);
    expect(
        getFirstDayOfYear(
            4,
            NALOREN.static.months,
            NALOREN.static.weekdays,
            NALOREN.static.leapDays,
            NALOREN.static.overflow,
            NALOREN.static.firstWeekDay,
            NALOREN.static.offset
        )
    ).toBe(0);
})
test("Days before year (Naloren)", () => {
    expect(
        daysFromYearOne(1, NALOREN.static.months, NALOREN.static.leapDays)
    ).toBe(0);
    expect(
        daysFromYearOne(2, NALOREN.static.months, NALOREN.static.leapDays)
    ).toBe(354);
    // year three is the first with a leap month
    expect(
        daysFromYearOne(4, NALOREN.static.months, NALOREN.static.leapDays)
    ).toBe(354 * 3 + 30);
    // The full 19-year cycle is 6936 days plus a few leap days long
    expect(
        daysFromYearOne(20, NALOREN.static.months, NALOREN.static.leapDays)
    ).toBe(6936 + 3 /* specifically 3 leap days: y5, y10, y15 */);
    expect(
        daysFromYearOne(21, NALOREN.static.months, NALOREN.static.leapDays)
    ).toBe(6936 + 354 + 4 /* leap days: y5, y10, y15, y20 */);
    expect(
        daysFromYearOne(77, NALOREN.static.months, NALOREN.static.leapDays)
    ).toBe(4 * 6936 + 15);
    expect(
        daysFromYearOne(80, NALOREN.static.months, NALOREN.static.leapDays)
    ).toBe(4 * 6936 + 3 * 354 + 30 + 15);
    expect(
        daysFromYearOne(191, NALOREN.static.months, NALOREN.static.leapDays)
    ).toBe(10 * 6936 + 38);
    expect(
        daysFromYearOne(381, NALOREN.static.months, NALOREN.static.leapDays)
    ).toBe(20 * 6936 + 76);
    expect(
        daysFromYearOne(773, NALOREN.static.months, NALOREN.static.leapDays)
    ).toBe(40 * 6936 + 12 * 354 + 4 * 30 + 154);
    // After 23,751 years the day/night and tropical year cycle match up *precisely*
    expect(
        daysFromYearOne(23_751, NALOREN.static.months, NALOREN.static.leapDays)
    ).toBe(8_674_731);
})
