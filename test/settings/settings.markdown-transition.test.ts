/**
 * @vitest-environment happy-dom
 */
import { vi, test, expect } from "vitest";
import {
    shouldTransitionMarkdownSettings,
    MarkdownReason,
} from "../../src/settings/markdown-import";

test("No data", () => {
    expect(shouldTransitionMarkdownSettings(null)).toBe(MarkdownReason.NO_DATA);
});
test("Not object", () => {
    expect(shouldTransitionMarkdownSettings("abc")).toBe(
        MarkdownReason.NOT_OBJECT
    );
});
test("Empty object", () => {
    expect(shouldTransitionMarkdownSettings({})).toBe(MarkdownReason.EMPTY);
});
test("Transitioned", () => {
    expect(shouldTransitionMarkdownSettings({ transitioned: true })).toBe(
        MarkdownReason.TRANSITIONED
    );
});
test("No version", () => {
    expect(shouldTransitionMarkdownSettings({ abc: "def" })).toBe(
        MarkdownReason.NO_VERSION
    );
    expect(shouldTransitionMarkdownSettings({ version: "def" })).toBe(
        MarkdownReason.NO_VERSION
    );
});
test("No patch", () => {
    expect(shouldTransitionMarkdownSettings({ version: {} })).toBe(
        MarkdownReason.NO_PATCH
    );
    expect(shouldTransitionMarkdownSettings({ version: { patch: null } })).toBe(
        MarkdownReason.NO_PATCH
    );
});
test("Old version", () => {
    expect(
        shouldTransitionMarkdownSettings({ version: { patch: "0-b25" } })
    ).toBe(MarkdownReason.OLD_VERSION);
});

test("Good", () => {
    const good = {
        addToDefaultIfMissing: true,
        calendars: [],
        configDirectory: null,
        dailyNotes: false,
        dateFormat: "YYYY-MM-DD",
        defaultCalendar: "ID_c9ca2a79c8c9",
        eventPreview: false,
        exit: {
            saving: false,
            event: false,
            calendar: false,
        },
        eventFrontmatter: false,
        parseDates: false,
        settingsToggleState: {
            calendars: true,
            events: false,
            advanced: true,
        },
        showIntercalary: false,
        version: {
            major: 1,
            minor: 0,
            patch: 0,
            beta: 28,
        },
        debug: false,
        askedToMoveFC: true,
        currentCalendar: null,
        deletedCalendars: [],
    };
    const good2 = {
        addToDefaultIfMissing: true,
        calendars: [],
        configDirectory: null,
        dailyNotes: false,
        dateFormat: "YYYY-MM-DD",
        defaultCalendar: "ID_c9ca2a79c8c9",
        eventPreview: false,
        exit: {
            saving: false,
            event: false,
            calendar: false,
        },
        eventFrontmatter: false,
        parseDates: false,
        settingsToggleState: {
            calendars: true,
            events: false,
            advanced: true,
        },
        showIntercalary: false,
        version: {
            major: 1,
            minor: 0,
            patch: "0-b27",
        },
        debug: false,
        askedToMoveFC: true,
        currentCalendar: null,
        deletedCalendars: [],
    };
    expect(shouldTransitionMarkdownSettings(good)).toBe(MarkdownReason.NONE);
    expect(shouldTransitionMarkdownSettings(good2)).toBe(MarkdownReason.NONE);
});
