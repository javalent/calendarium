import type { Calendar } from "../src/schemas/calendar";
import {
    getEffectiveYearLength,
    leapDaysBeforeYear,
} from "../src/utils/functions";
import { PRESET_CALENDARS } from "../src/utils/presets";
import { vi, test, expect } from "vitest";

const GREGORIAN: Calendar = PRESET_CALENDARS.find(
    (p) => p.name == "Gregorian Calendar"
);
const GOLARION: Calendar = PRESET_CALENDARS.find(
    (p) => p.name == "Calendar of Golarion"
);
const HARPTOS: Calendar = PRESET_CALENDARS.find(
    (p) => p.name == "Calendar of Harptos"
);

test("Leap Days (Gregorian)", () => {
    expect(leapDaysBeforeYear(1, GREGORIAN.static.leapDays)).toBe(0);
    expect(leapDaysBeforeYear(5, GREGORIAN.static.leapDays)).toBe(1);
    expect(leapDaysBeforeYear(9, GREGORIAN.static.leapDays)).toBe(2);
    expect(leapDaysBeforeYear(100, GREGORIAN.static.leapDays)).toBe(24);
    expect(leapDaysBeforeYear(401, GREGORIAN.static.leapDays)).toBe(97);
    expect(leapDaysBeforeYear(2022, GREGORIAN.static.leapDays)).toBe(490);
});
test("Leap Days (Golarion)", () => {
    expect(leapDaysBeforeYear(1, GOLARION.static.leapDays)).toBe(0);
    expect(leapDaysBeforeYear(5, GOLARION.static.leapDays)).toBe(0);
    expect(leapDaysBeforeYear(9, GOLARION.static.leapDays)).toBe(1);
    expect(leapDaysBeforeYear(100, GOLARION.static.leapDays)).toBe(12);
    expect(leapDaysBeforeYear(401, GOLARION.static.leapDays)).toBe(50);
    expect(leapDaysBeforeYear(2022, GOLARION.static.leapDays)).toBe(252);
});
test("Leap Days (Harptos)", () => {
    expect(leapDaysBeforeYear(1, HARPTOS.static.leapDays)).toBe(0);
    expect(leapDaysBeforeYear(5, HARPTOS.static.leapDays)).toBe(1);
    expect(leapDaysBeforeYear(9, HARPTOS.static.leapDays)).toBe(2);
    expect(leapDaysBeforeYear(100, HARPTOS.static.leapDays)).toBe(24);
    expect(leapDaysBeforeYear(401, HARPTOS.static.leapDays)).toBe(100);
    expect(leapDaysBeforeYear(2022, HARPTOS.static.leapDays)).toBe(505);
});
test("Effective days in year", () => {
    expect(getEffectiveYearLength(GREGORIAN)).toBe(365.2425);
    expect(getEffectiveYearLength(HARPTOS)).toBe(365.25);
    expect(getEffectiveYearLength(GOLARION)).toBe(365.125);
});
