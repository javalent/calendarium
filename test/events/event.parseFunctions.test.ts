/**
 * @vitest-environment happy-dom
 */
import type { Loc, Pos } from "obsidian";
import type {
    CalEvent,
    Calendar,
    DatedCalEvent,
    RangeCalEvent,
} from "../../src/@types";
import { CalEventHelper, ParseDate } from "../../src/events/event.helper";
import { PRESET_CALENDARS } from "../../src/utils/presets";
import { test, expect } from "vitest";

import Moment from "moment";
import { EventType } from "../../src/events/event.types";
Object.defineProperty(window, "moment", { value: Moment });

const GREGORIAN: Calendar = PRESET_CALENDARS.find(
    (p) => p.name == "Gregorian Calendar"
);
const gregorian = new CalEventHelper(GREGORIAN, true);

const file = {
    path: "path",
    basename: "1966-04",
};
const loc: Loc = {
    line: 0,
    col: 0,
    offset: 0,
};
const position: Pos = {
    start: loc,
    end: loc,
};

test("Preset padding", () => {
    expect(GREGORIAN.static.padDays).toEqual(2);
    expect(GREGORIAN.static.padMonths).toEqual(2);
});

test("Bad Year", () => {
    expect(gregorian.parseCalDateString("", file)).toBeNull();
});

test("Timestamp", () => {
    const expected: ParseDate = {
        year: 1966,
        month: 3,
        day: 1,
        order: "",
    };

    expect(gregorian.parsedToTimestamp(expected)).toEqual({
        timestamp: 19660301,
        order: "",
    });
});

test("parseFrontmatterDate / parseFilename", () => {
    const expected: ParseDate = {
        year: 1966,
        month: 3,
        day: 1,
        order: "",
    };
    // read date string from frontmatter
    expect(gregorian.parseDate("1966-04", file)).toEqual(expected);

    // read date from filename
    expect(
        gregorian.parseFilenameDate({
            ...file,
            basename: "1966-04",
        })
    ).toEqual(expected);

    // read date from object
    expect(
        gregorian.parseDate(
            {
                year: 1966,
                month: 4,
                day: 1,
            },
            file
        )
    ).toEqual(expected);
});

test("parseFrontmatterDate / parseFilenameDate: extra", () => {
    const expected: ParseDate = {
        year: 1966,
        month: 3,
        day: 1,
        order: "01 some extra flavor",
    };
    // read date string from frontmatter
    expect(
        gregorian.parseDate("1966-04-01-01 some extra flavor", file)
    ).toEqual(expected);

    // read date from filename
    expect(
        gregorian.parseFilenameDate({
            ...file,
            basename: "1966-04-01-01 some extra flavor",
        })
    ).toEqual(expected);

    // read date from object
    expect(
        gregorian.parseDate(
            {
                year: 1966,
                month: 4,
                day: 1,
                order: "01 some extra flavor",
            },
            file
        )
    ).toEqual(expected);
});

test("parseFrontmatterEvent", () => {
    let category = gregorian.calendar.categories[0];
    let actual: RangeCalEvent[] = [];
    gregorian.category = category;
    gregorian.parseFrontmatterEvent(
        {
            "fc-start": "1966-05-23",
            "fc-end": {
                year: 1966,
                month: 8,
                day: 1,
            },
            "fc-display-name": "Pretty name",
            "fc-description": "Fun text",
            "fc-img": "attachments/thing.png",
            position,
        },
        file,
        (event) => {
            actual.push(event as RangeCalEvent);
        }
    );

    expect(actual.length).toEqual(1);
    expect(actual[0].id).toBeDefined();
    expect(actual[0].type).toBe(EventType.Range);
    expect(actual[0].name).toEqual("Pretty name");
    expect(actual[0].description).toEqual("Fun text");
    expect(actual[0].date).toEqual(
        expect.objectContaining({
            year: 1966,
            month: 4, // 0-index
            day: 23,
        })
    );
    expect(actual[0].end).toEqual(
        expect.objectContaining({
            year: 1966,
            month: 7,
            day: 1,
        })
    );
    expect(actual[0].sort).toEqual({
        timestamp: 19660423,
        order: "",
    });
    expect(actual[0].note).toEqual(file.path);
    expect(actual[0].category).toEqual(category.id);
    expect(actual[0].img).toEqual("attachments/thing.png");
});

test("parseTimelineEvent", () => {
    let category = gregorian.calendar.categories[0];
    let actual: RangeCalEvent[] = [];

    gregorian.parseInlineEvents(
        "<span class='ob-timelines'   \n" +
            " data-category='Natural Events' \n" +
            " data-date='1966-05-23-00'\n" +
            " data-end='1966-08-1-00'  \n" +
            " data-img='attachments/thing.png'  \n" +
            " data-name='Pretty name'>\n" +
            "Fun text" +
            "</span>",
        file,
        (event) => {
            actual.push(event as RangeCalEvent);
        },
        () => {}
    );

    expect(actual.length).toEqual(1);
    expect(actual[0].id).toBeDefined();
    expect(actual[0].type).toBe(EventType.Range);
    expect(actual[0].name).toEqual("Pretty name");
    expect(actual[0].description?.trim()).toEqual("Fun text");
    expect(actual[0].date).toEqual(
        expect.objectContaining({
            year: 1966,
            month: 4, // 0-index
            day: 23,
        })
    );
    expect(actual[0].end).toEqual(
        expect.objectContaining({
            year: 1966,
            month: 7,
            day: 1,
        })
    );
    expect(actual[0].sort).toEqual({
        timestamp: 19660423,
        order: "00",
    });
    expect(actual[0].note).toEqual(file.path);
    expect(actual[0].category).toEqual(category.id);
    expect(actual[0].img).toEqual("attachments/thing.png");
});

test("Repeating events", () => {
    const expected: ParseDate = {
        year: [null, null],
        month: [null, null],
        day: [null, null],
        order: "",
    };
    expect(gregorian.parseCalDateString("*-*-*", file)).toEqual(expected);

    expect(gregorian.parseDate({}, file)).toEqual(expected);

    expect(gregorian.parsedToTimestamp(expected)).toEqual({
        timestamp: Number.MIN_VALUE,
        order: "[*-*]-[*-*]-[*-*]",
    });
});

test("Repeating events with extra", () => {
    const expected: ParseDate = {
        year: [null, null],
        month: [null, null],
        day: [null, null],
        order: "01 some extra flavor",
    };
    expect(
        gregorian.parseCalDateString("*-*-*-01 some extra flavor", file)
    ).toEqual(expected);

    expect(
        gregorian.parseDate(
            {
                order: "01 some extra flavor",
            },
            file
        )
    ).toEqual(expected);

    expect(gregorian.parsedToTimestamp(expected)).toEqual({
        timestamp: Number.MIN_VALUE,
        order: "01 some extra flavor",
    });
});

test("Repeating events with extra", () => {
    const expected: ParseDate = {
        year: [null, null],
        month: [null, null],
        day: [null, null],
        order: "01 some extra flavor",
    };
    expect(
        gregorian.parseCalDateString("*-*-*-01 some extra flavor", file)
    ).toEqual(expected);

    expect(
        gregorian.parseDate(
            {
                order: "01 some extra flavor",
            },
            file
        )
    ).toEqual(expected);

    expect(gregorian.parsedToTimestamp(expected)).toEqual({
        timestamp: Number.MIN_VALUE,
        order: "01 some extra flavor",
    });
});
test("Range Events", () => {
    expect(gregorian.parseCalDateString("[2018-2024]-03-01", file)).toEqual({
        year: [2018, 2024],
        month: 2,
        day: 1,
        order: "",
    });
    expect(gregorian.parseCalDateString("[1991-*]-01-10", file)).toEqual({
        year: [1991, null],
        month: 0,
        day: 10,
        order: "",
    });

    expect(gregorian.parseCalDateString("2024-[02-03]-01", file)).toEqual({
        year: 2024,
        month: [1, 2],
        day: 1,
        order: "",
    });

    expect(gregorian.parseCalDateString("2024-03-[01-10]", file)).toEqual({
        year: 2024,
        month: 2,
        day: [1, 10],
        order: "",
    });
});
