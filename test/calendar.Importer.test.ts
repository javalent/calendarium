/**
 * @vitest-environment happy-dom
 */
import Importer from "../src/settings/import/importer";
import { vi, test, expect } from "vitest";

const GREGORIAN_EXPORT = require("./data/exports/gregorian-export.json");
const HARPTOS_EXPORT = require("./data/exports/harptos-custom-export.json");
const IMPERIAL_EXPORT = require("./data/exports/imperial-export.json");

global.createDiv = vi.fn(
    (
        o?: DomElementInfo | string,
        callback?: (el: HTMLDivElement) => void
    ): HTMLDivElement => {
        return document.createElement("div") as HTMLDivElement;
    }
);

test("Import Gregorian", () => {
    const importedCalendars = Importer.import([GREGORIAN_EXPORT]);
    expect(importedCalendars.length).toBe(1);

    const calendar = importedCalendars[0];

    expect(calendar.name).toBe("Gregorian Calendar");
});
test("Import Harptos", () => {
    const importedCalendars = Importer.import([HARPTOS_EXPORT]);
    expect(importedCalendars.length).toBe(1);

    const calendar = importedCalendars[0];

    expect(calendar.name).toBe("Events");
});
test("Import Imperial", () => {
    const importedCalendars = Importer.import([IMPERIAL_EXPORT]);
    expect(importedCalendars.length).toBe(1);

    const calendar = importedCalendars[0];

    expect(calendar.name).toBe("Third Imperium");
});
