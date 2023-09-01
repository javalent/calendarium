/**
 * @vitest-environment happy-dom
 */
import { CalEventDate } from "../src/@types";
import { CalEventHelper } from "../src/events/event.helper";
import { PRESET_CALENDARS } from "../src/utils/presets";
import { test, expect } from "vitest";

import Moment from "moment";
Object.defineProperty(window, "moment", { value: Moment });

const GREGORIAN = PRESET_CALENDARS.find((p) => p.name == "Gregorian Calendar");
const file = {
    path: "path",
    basename: "basename",
};

const input: CalEventDate = {
    year: 1400,
    month: 1,
    day: 28,
};

test("YYYY-MM-DD", () => {
    const YMD = new CalEventHelper(GREGORIAN, true);
    const datestring = "1400-02-28";
    expect(YMD.formatDigest).toEqual("YMD");
    expect(YMD.toCalDateString(input)).toEqual(datestring);
    expect(YMD.parseCalDateString(datestring, file)).toEqual(
        expect.objectContaining(input)
    );
});
test("YYYY-MMM-DD", () => {
    GREGORIAN.dateFormat = "YYYY-MMM-DD";
    const YMD = new CalEventHelper(GREGORIAN, true);
    const datestring = "1400-February-28";
    expect(YMD.formatDigest).toEqual("YMD");
    expect(YMD.toCalDateString(input)).toEqual(datestring);
    expect(YMD.parseCalDateString(datestring, file)).toEqual(
        expect.objectContaining(input)
    );
});

test("M-D-Y", () => {
    GREGORIAN.dateFormat = "M-D-Y";
    const MDY = new CalEventHelper(GREGORIAN, true);
    const datestring = "2-28-1400";
    expect(MDY.formatDigest).toEqual("MDY");
    expect(MDY.toCalDateString(input)).toEqual(datestring);
    expect(MDY.parseCalDateString(datestring, file)).toEqual(
        expect.objectContaining(input)
    );
});

test("MM-D-Y", () => {
    GREGORIAN.dateFormat = "MM-D-Y";
    const MDY = new CalEventHelper(GREGORIAN, true);
    const datestring = "02-28-1400";
    expect(MDY.formatDigest).toEqual("MDY");
    expect(MDY.toCalDateString(input)).toEqual(datestring);
    expect(MDY.parseCalDateString(datestring, file)).toEqual(
        expect.objectContaining(input)
    );
});

test("DD-M-Y", () => {
    GREGORIAN.dateFormat = "DD-M-Y";
    const DMY = new CalEventHelper(GREGORIAN, true);
    const datestring = "28-2-1400";
    expect(DMY.formatDigest).toEqual("DMY");
    expect(DMY.toCalDateString(input)).toEqual(datestring);
    expect(DMY.parseCalDateString(datestring, file)).toEqual(
        expect.objectContaining(input)
    );
});

test("DD-MMM-Y", () => {
    GREGORIAN.dateFormat = "DD-MMM-Y";
    const DMY = new CalEventHelper(GREGORIAN, true);
    const datestring = "28-February-1400";
    expect(DMY.formatDigest).toEqual("DMY");
    expect(DMY.toCalDateString(input)).toEqual(datestring);
    expect(DMY.parseCalDateString(datestring, file)).toEqual(
        expect.objectContaining(input)
    );
});
