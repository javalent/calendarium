/**
 * @vitest-environment happy-dom
 */
import type {
    CalDate,
    CalEventDate,
    OneTimeCalEventDate,
    RecurringCalEvent,
    RecurringCalEventDate,
} from "../../src/@types";
import { CalEventHelper } from "../../src/events/event.helper";
import { PRESET_CALENDARS } from "../../src/utils/presets";
import { test, expect } from "vitest";

import Moment from "moment";
import { dateString, eventDateString } from "../../src/utils/functions";
import { EventType } from "../../src/events/event.types";
Object.defineProperty(window, "moment", { value: Moment });

const GREGORIAN = PRESET_CALENDARS.find((p) => p.name == "Gregorian Calendar");
const file = {
    path: "path",
    basename: "basename",
};

const input: CalDate = {
    year: 1400,
    month: 1,
    day: 28,
};

test("YYYY-MM-DD", () => {
    const YMD = new CalEventHelper(GREGORIAN, true);
    const datestring = "1400-02-28";
    expect(YMD.formatDigest).toEqual("YMD");
    expect(dateString(input, GREGORIAN, undefined, "YYYY-MM-DD")).toEqual(
        datestring
    );
    expect(YMD.parseCalDateString(datestring, file)).toEqual(
        expect.objectContaining(input)
    );
});
test("YYYY-MMM-DD", () => {
    GREGORIAN.dateFormat = "YYYY-MMM-DD";
    const YMD = new CalEventHelper(GREGORIAN, true);
    const datestring = "1400-Feb-28";
    expect(YMD.formatDigest).toEqual("YMD");
    expect(dateString(input, GREGORIAN, undefined, "YYYY-MMM-DD")).toEqual(
        datestring
    );
    expect(YMD.parseCalDateString(datestring, file)).toEqual(
        expect.objectContaining(input)
    );
});

test("M-D-Y", () => {
    GREGORIAN.dateFormat = "M-D-Y";
    const MDY = new CalEventHelper(GREGORIAN, true);
    const datestring = "2-28-1400";
    expect(dateString(input, GREGORIAN, undefined, "M-D-Y")).toEqual(
        datestring
    );
});

test("MM-D-Y", () => {
    GREGORIAN.dateFormat = "MM-D-Y";
    const MDY = new CalEventHelper(GREGORIAN, true);
    const datestring = "02-28-1400";
    expect(dateString(input, GREGORIAN)).toEqual(datestring);
});

test("DD-M-Y", () => {
    GREGORIAN.dateFormat = "DD-M-Y";
    const DMY = new CalEventHelper(GREGORIAN, true);
    const datestring = "28-2-1400";
    expect(dateString(input, GREGORIAN, undefined, "DD-M-Y")).toEqual(
        datestring
    );
});

test("DD-MMM-Y", () => {
    GREGORIAN.dateFormat = "DD-MMM-Y";
    const DMY = new CalEventHelper(GREGORIAN, true);
    const datestring = "28-Feb-1400";
    expect(dateString(input, GREGORIAN, undefined, "DD-MMM-Y")).toEqual(
        datestring
    );
});

test("Date Range: Different year", () => {
    GREGORIAN.dateFormat = "DD-MMM-Y";
    const DMY = new CalEventHelper(GREGORIAN, true);
    const start: CalDate = {
        year: 1400,
        month: 1,
        day: 28,
    };
    const end: CalDate = {
        year: 1401,
        month: 1,
        day: 28,
    };
    expect(dateString(start, GREGORIAN, end, "DD-MMMM-Y")).toEqual(
        "28-February-1400 — 28-February-1401"
    );
});

test("Date Range: Same year, different month", () => {
    GREGORIAN.dateFormat = "DD-MMM-Y";
    const DMY = new CalEventHelper(GREGORIAN, true);
    const start: CalDate = {
        year: 1400,
        month: 1,
        day: 28,
    };
    const end: CalDate = {
        year: 1400,
        month: 2,
        day: 28,
    };
    expect(dateString(start, GREGORIAN, end, "DD-MMM-Y")).toEqual(
        "February 28th — March 28th, 1400"
    );
});

test("Date Range: Same month, different day", () => {
    GREGORIAN.dateFormat = "DD-MMM-Y";
    const DMY = new CalEventHelper(GREGORIAN, true);
    const start: CalDate = {
        year: 1400,
        month: 1,
        day: 20,
    };
    const end: CalDate = {
        year: 1400,
        month: 1,
        day: 28,
    };
    expect(dateString(start, GREGORIAN, end, "DD-MMM-Y")).toEqual(
        "February 20th—28th, 1400"
    );
});

test("Repeating: Same day every month", () => {
    GREGORIAN.dateFormat = "DD-MMM-Y";
    const start: RecurringCalEvent = {
        type: EventType.Recurring,
        id: "",
        name: "",
        category: "",
        date: {
            day: 20,
            year: [null, null],
            month: [null, null],
        },
    };
    expect(eventDateString(start, GREGORIAN)).toEqual(
        "20th of every month, every year"
    );
});

test("Repeating interval: Same month/day every year", () => {
    GREGORIAN.dateFormat = "DD-MMM-Y";

    const start: RecurringCalEvent = {
        type: EventType.Recurring,
        id: "",
        name: "",
        category: "",
        date: {
            day: 20,
            year: [null, null],
            month: 1,
        },
    };
    expect(eventDateString(start, GREGORIAN)).toEqual(
        "20th of February, every year"
    );
});

test("Repeating interval: Same range of days every month", () => {
    GREGORIAN.dateFormat = "DD-MMM-Y";
    const start: RecurringCalEvent = {
        type: EventType.Recurring,
        id: "",
        name: "",
        category: "",
        date: {
            day: [20, 24],
            year: [null, null],
            month: [null, null],
        },
    };
    expect(eventDateString(start, GREGORIAN)).toEqual(
        "20th—24th of every month, every year"
    );
});

test("Repeating interval: Same month/day range every year", () => {
    GREGORIAN.dateFormat = "DD-MMM-Y";
    const start: RecurringCalEvent = {
        type: EventType.Recurring,
        id: "",
        name: "",
        category: "",
        date: {
            day: [20, 24],
            month: 1,
            year: [null, null],
        },
    };
    expect(eventDateString(start, GREGORIAN)).toEqual(
        "20th—24th of February, every year"
    );
});

test("Repeating interval: Same cross-month range of days every year", () => {
    GREGORIAN.dateFormat = "DD-MMM-Y";
    const start: RecurringCalEvent = {
        type: EventType.Recurring,
        id: "",
        name: "",
        category: "",
        date: {
            day: [20, 24],
            month: [1, 2],
            year: [null, null],
        },
    };
    expect(eventDateString(start, GREGORIAN)).toEqual(
        "20th—24th of February-March, every year"
    );
});
