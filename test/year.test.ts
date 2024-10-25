import type { Calendar } from "../src/@types";
import { daysFromYearOne, getFirstDayOfYear } from "../src/utils/functions";
import { PRESET_CALENDARS } from "../src/utils/presets";
import { vi, test, expect } from "vitest";

const GREGORIAN: Calendar = PRESET_CALENDARS.find(
    (p) => p.name == "Gregorian Calendar"
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
