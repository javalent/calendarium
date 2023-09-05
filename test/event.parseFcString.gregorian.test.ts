/**
 * @vitest-environment happy-dom
 */
import { CalDate, CalEvent } from "../src/@types";
import { CalEventHelper, ParseDate } from "../src/events/event.helper";
import { dateString, sortEventList } from "../src/utils/functions";
import { PRESET_CALENDARS } from "../src/utils/presets";
import { vi, test, expect } from "vitest";

import Moment from "moment";
Object.defineProperty(window, "moment", { value: Moment });

const GREGORIAN = PRESET_CALENDARS.find((p) => p.name == "Gregorian Calendar");
const helper = new CalEventHelper(GREGORIAN, false);
const file = {
    path: "path",
    basename: "basename",
};

// test("Leap Days (Gregorian)", () => {
//     expect(leapDaysBeforeYear(1, GREGORIAN)).toBe(0);
//     expect(leapDaysBeforeYear(5, GREGORIAN)).toBe(1);
//     expect(leapDaysBeforeYear(9, GREGORIAN)).toBe(2);
//     expect(leapDaysBeforeYear(100, GREGORIAN)).toBe(24);
//     expect(leapDaysBeforeYear(401, GREGORIAN)).toBe(97);
//     expect(leapDaysBeforeYear(2022, GREGORIAN)).toBe(490);
// });

test("Parse January", () => {
    const expected: ParseDate = {
        year: 0,
        month: 0,
        day: 1,
        order: "",
    };
    // Mess around with year 0 for fun
    expect(helper.parseCalDateString("0", file)).toEqual(expected);
    expect(helper.parseCalDateString("0-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("0-01-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("0-Jan", file)).toEqual(expected);
    expect(helper.parseCalDateString("0-January-01", file)).toEqual(expected);
});
test("Parse February", () => {
    const expected: ParseDate = {
        year: 0,
        month: 1,
        day: 1,
        order: "",
    };
    expect(helper.parseCalDateString("0-02", file)).toEqual(expected);
    expect(helper.parseCalDateString("0-02-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("0-Feb", file)).toEqual(expected);
    expect(helper.parseCalDateString("0-February-01", file)).toEqual(expected);
    // brought into range
    expect(helper.parseCalDateString("0-02-00", file)).toEqual(expected);
    // Bad day
    expect(helper.parseCalDateString("1900-Feb-30", file)).toBeNull();
});
test("Parse February: Leap year", () => {
    const expected: ParseDate = {
        year: 0,
        month: 1,
        day: 29,
        order: "",
    };

    // Leap years
    expect(helper.parseCalDateString("1996-February-29", file)).toEqual({
        ...expected,
        year: 1996,
    });
    expect(helper.parseCalDateString("1600-February-29", file)).toEqual({
        ...expected,
        year: 1600,
    });
    expect(helper.parseCalDateString("2000-February-29", file)).toEqual({
        ...expected,
        year: 2000,
    });
    // Not leap years
    expect(helper.parseCalDateString("1700-Feb-29", file)).toBeNull();
    expect(helper.parseCalDateString("1800-Feb-29", file)).toBeNull();
    expect(helper.parseCalDateString("1900-Feb-29", file)).toBeNull();

    const formatThis = {
        ...expected,
        year: 1996,
    } as CalDate;

    expect(dateString(formatThis, GREGORIAN)).toEqual("1996-02-29");
    expect(dateString(formatThis, GREGORIAN, undefined, 'D MMMM, YYYY')).toEqual("29 February, 1996");
    expect(dateString(formatThis, GREGORIAN, undefined, 'YYYY-MMM-DD')).toEqual("1996-Feb-29");
});
test("Parse March", () => {
    const expected: ParseDate = {
        year: 0,
        month: 2,
        day: 31,
        order: "some extra",
    };
    // Mess around with year 0 for fun
    expect(helper.parseCalDateString("0-03-31-some extra", file)).toEqual(
        expected
    );
    expect(helper.parseCalDateString("0-Mar-31-some extra", file)).toEqual(
        expected
    );
    expect(helper.parseCalDateString("0-March-31-some extra", file)).toEqual(
        expected
    );
});

test("Sort Gregorian dates", () => {
    const events = [
        helper.parseCalDateString(
            "1954-January-01-all the things happened",
            file
        ), // 0
        helper.parseCalDateString("1954-January-01-misc", file), // 1
        helper.parseCalDateString("1954-January-01", file), // 2
        helper.parseCalDateString("0-February-01-other stuff", file), // 3
        helper.parseCalDateString("0-February-01-02", file), // 4
        helper.parseCalDateString("2000-February-29", file), // 5
        helper.parseCalDateString("0-March-31-some extra", file), // 6
    ];

    const fcEvents: CalEvent[] = events.map((x) => {
        return {
            date: x,
            description: "Test",
            id: "test",
            name: "Test",
            note: "Test",
            category: "Test",
            sort: helper.parsedToTimestamp(x),
            type: "Test",
        };
    });

    const sorted = sortEventList(fcEvents);
    console.log(sorted);

    expect(sorted[0].date).toEqual(events[4]);
    expect(sorted[1].date).toEqual(events[3]);
    expect(sorted[2].date).toEqual(events[6]);
    expect(sorted[3].date).toEqual(events[2]);
    expect(sorted[4].date).toEqual(events[0]);
    expect(sorted[5].date).toEqual(events[1]);
    expect(sorted[6].date).toEqual(events[5]);

    console.log(sorted);
});
