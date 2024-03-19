/**
 * @vitest-environment happy-dom
 */
import type { CalDate, CalEvent, CalEventDate } from "../../src/@types";
import { CalEventHelper, ParseDate } from "../../src/events/event.helper";
import { dateString, sortEventList } from "../../src/utils/functions";
import { PRESET_CALENDARS } from "../../src/utils/presets";
import { vi, test, expect } from "vitest";

import Moment from "moment";
import { EventType } from "../../src/events/event.types";
Object.defineProperty(window, "moment", { value: Moment });

const HARPTOS = PRESET_CALENDARS.find((p) => p.name == "Calendar of Harptos");
const helper = new CalEventHelper(HARPTOS, false);
const file = {
    path: "path",
    basename: "basename",
};

// index | fc-date | calendar reckoning | Month name
//  0 |  1 |  1 | Hammer
//  1 |  2 |  - | Midwinter
//  2 |  3 |  2 | Alturiak
//  3 |  4 |  3 | Ches
//  4 |  5 |  4 | Tarsakh
//  5 |  6 |  - | Greengrass
//  6 |  7 |  5 | Mirtul
//  7 |  8 |  6 | Kythorn
//  8 |  9 |  7 | Flamerule
//  9 | 10 |  - | Midsummer (Shieldmeet)
// 10 | 11 |  8 | Elesias
// 11 | 12 |  9 | Eleint
// 12 | 13 |  - | Highharvestide
// 13 | 14 | 10 | Marpenoth
// 14 | 15 | 11 | Uktar
// 15 | 16 |  - | Feast of the Moon
// 16 | 17 | 12 | Nightal

test("Preset padding", () => {
    expect(HARPTOS.static.padDays).toEqual(2);
    expect(HARPTOS.static.padMonths).toEqual(2);
});

test("daysForMonth", () => {
    expect(helper.daysForMonth(0, 1499)).toEqual(30);
    expect(helper.daysForMonth(1, 1499)).toEqual(1);
    expect(helper.daysForMonth(5, 1499)).toEqual(1);
    expect(helper.daysForMonth(9, 1499)).toEqual(1);
    expect(helper.daysForMonth(9, 1372)).toEqual(2);
    expect(helper.daysForMonth(12, 1499)).toEqual(1);
    expect(helper.daysForMonth(16, 1499)).toEqual(30);
});

//  0 |  1 |  1 | Hammer
test("Parse Harptos: 1499-01, Hammer", () => {
    const expected: ParseDate = {
        year: 1499,
        month: 0,
        day: 1,
        order: "",
    };
    // em dash and en dash
    expect(helper.parseCalDateString("1499", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499—01", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499–01-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Hammer", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Hammer-01", file)).toEqual(expected);

    expect(dateString(expected as CalDate, HARPTOS)).toEqual("1499-Hammer-01");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "D MMMM, YYYY")
    ).toEqual("1 Hammer (Deepwinter), 1499");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MM-DD")
    ).toEqual("1499-01-01");
});
//  1 |  2 |  - | Midwinter
test("Parse Harptos: 1499-02, Midwinter", () => {
    const expected: ParseDate = {
        year: 1499,
        month: 1, // Midwinter
        day: 1,
        order: "",
    };
    expect(helper.parseCalDateString("1499-02", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-02-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Midwinter", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Midwinter-01", file)).toEqual(
        expected
    );

    expect(dateString(expected as CalDate, HARPTOS)).toEqual("1499-Midwinter");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "D MMMM, YYYY")
    ).toEqual("Midwinter, 1499");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MM-DD")
    ).toEqual("1499-02-01");

    // Midwinter has only one day...
    expect(helper.parseCalDateString("1499-02-03", file)).toBeNull();
});
//  2 |  3 |  2 | Alturiak
test("Parse Harptos: 1499-03, Alturiak", () => {
    const expected: ParseDate = {
        year: 1499,
        month: 2, // month numbers line up for Alturiak (2), Ches (3), Tarsahk (4)
        day: 1,
        order: "",
    };
    expect(helper.parseCalDateString("1499-03", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-03-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Alturiak", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Alturiak-01", file)).toEqual(
        expected
    );

    expect(dateString(expected as CalDate, HARPTOS)).toEqual(
        "1499-Alturiak-01"
    );
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "D MMMM, YYYY")
    ).toEqual("1 Alturiak (The Claw of Winter), 1499");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MM-DD")
    ).toEqual("1499-03-01");
});
//  3 |  4 |  3 | Ches
//  4 |  5 |  4 | Tarsakh
//  5 |  6 |  - | Greengrass
test("Parse Harptos: 1499-06, Greengrass", () => {
    const expected: ParseDate = {
        year: 1499,
        month: 5, // Greengrass
        day: 1,
        order: "",
    };
    expect(helper.parseCalDateString("1499-06", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-06-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Greengrass", file)).toEqual(
        expected
    );
    expect(helper.parseCalDateString("1499-Greengrass-01", file)).toEqual(
        expected
    );

    expect(dateString(expected as CalDate, HARPTOS)).toEqual("1499-Greengrass");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "D MMMM, YYYY")
    ).toEqual("Greengrass, 1499");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MM-DD")
    ).toEqual("1499-06-01");

    const ordered: ParseDate = { ...expected, order: "03" };
    expect(helper.parseCalDateString("1499-Greengrass-01-03", file)).toEqual(
        ordered
    );
    // Greengrass has only one day...
    expect(helper.parseCalDateString("1499-06-03", file)).toBeNull();
});
//  6 |  7 |  5 | Mirtul
test("Parse Harptos: 1499-06, Mirtul", () => {
    const expected: ParseDate = {
        year: 1499,
        month: 6,
        day: 1,
        order: "",
    };
    expect(helper.parseCalDateString("1499-07", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-07-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Mir", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Mirtul-01", file)).toEqual(expected);

    expect(dateString(expected as CalDate, HARPTOS)).toEqual("1499-Mirtul-01");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "D MMMM, YYYY")
    ).toEqual("1 Mirtul (The Melting), 1499");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MM-DD")
    ).toEqual("1499-07-01");
});
//  7 |  8 |  6 | Kythorn
//  8 |  9 |  7 | Flamerule
//  9 | 10 |  - | Midsummer (Shieldmeet)
test("Parse Harptos: 1499-09, Midsummer", () => {
    const expected: ParseDate = {
        year: 1499,
        month: 9,
        day: 1,
        order: "",
    };
    expect(helper.parseCalDateString("1499-10", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-10-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Midsum", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Midsummer-01", file)).toEqual(
        expected
    );

    expect(dateString(expected as CalDate, HARPTOS)).toEqual("1499-Midsummer");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "D MMMM, YYYY")
    ).toEqual("Midsummer, 1499");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MM-DD")
    ).toEqual("1499-10-01");

    const ordered: ParseDate = { ...expected, order: "03" };
    expect(helper.parseCalDateString("1499-Midsummer-01-03", file)).toEqual(
        ordered
    );
});
test("Parse Harptos: 1372-Shieldmeet", () => {
    const expected: ParseDate = {
        year: 1372,
        month: 9,
        day: 2,
        order: "",
    };
    expect(helper.parseCalDateString("1372-10-02", file)).toEqual(expected);
    expect(helper.parseCalDateString("1372-Shieldmeet", file)).toEqual(
        expected
    );
    expect(helper.parseCalDateString("1372-Shieldmeet-02", file)).toEqual(
        expected
    );

    const ordered: ParseDate = { ...expected, order: "03" };
    expect(helper.parseCalDateString("1372-Shieldmeet-02-03", file)).toEqual(
        ordered
    );

    expect(dateString(expected as CalDate, HARPTOS)).toEqual("1372-Shieldmeet");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "D MMMM, YYYY")
    ).toEqual("Shieldmeet, 1372");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MM-DD")
    ).toEqual("1372-10-02");

    // Shieldmeet is a leapday (not in 1499)
    expect(helper.parseCalDateString("1499-10-02", file)).toBeNull();
});
// 10 | 11 |  8 | Eleasis
test("Parse Harptos: 1499-11, Eleasis", () => {
    const expected: ParseDate = {
        year: 1499,
        month: 10,
        day: 1,
        order: "",
    };
    expect(helper.parseCalDateString("1499-11", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-11-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Eleas", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Eleasis-01", file)).toEqual(
        expected
    );

    expect(dateString(expected as CalDate, HARPTOS)).toEqual("1499-Eleasis-01");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "D MMMM, YYYY")
    ).toEqual("1 Eleasis (Highsun), 1499");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MM-DD")
    ).toEqual("1499-11-01");
});
// 11 | 12 |  9 | Eleint
// 12 | 13 |  - | Highharvestide
test("Parse Harptos: 1499-13, Highharvestide", () => {
    const expected: ParseDate = {
        year: 1499,
        month: 12,
        day: 1,
        order: "",
    };
    expect(helper.parseCalDateString("1499-13", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-13-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-High", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Highharvestide-01", file)).toEqual(
        expected
    );

    expect(dateString(expected as CalDate, HARPTOS)).toEqual(
        "1499-Highharvestide"
    );
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "D MMMM, YYYY")
    ).toEqual("Highharvestide, 1499");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MM-DD")
    ).toEqual("1499-13-01");
});
// 13 | 14 | 10 | Marpenoth
test("Parse Harptos: 1499-14, Marpenoth", () => {
    const expected: ParseDate = {
        year: 1499,
        month: 13,
        day: 1,
        order: "",
    };
    expect(helper.parseCalDateString("1499-14", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-14-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Marp", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-Marpenoth-01", file)).toEqual(
        expected
    );

    expect(dateString(expected as CalDate, HARPTOS)).toEqual(
        "1499-Marpenoth-01"
    );
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "D MMMM, YYYY")
    ).toEqual("1 Marpenoth (Leaffall), 1499");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MM-DD")
    ).toEqual("1499-14-01");
});
// 14 | 15 | 11 | Uktar
// 15 | 16 |  - | Feast of the Moon
test("Parse Harptos: 1499-15, Feast of the Moon", () => {
    const expected: ParseDate = {
        year: 1499,
        month: 15,
        day: 1,
        order: "",
    };
    expect(helper.parseCalDateString("1499-16", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-16-01", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-The Feast", file)).toEqual(expected);
    expect(helper.parseCalDateString("1499-FeastOfTheMoon", file)).toEqual(
        expected
    ); // short name
    expect(
        helper.parseCalDateString("1499-The Feast of the Moon-01", file)
    ).toEqual(expected);

    expect(dateString(expected as CalDate, HARPTOS)).toEqual(
        "1499-FeastOfTheMoon"
    );
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "D MMMM, YYYY")
    ).toEqual("The Feast of the Moon, 1499");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MMMM-DD")
    ).toEqual("1499-The Feast of the Moon");
    expect(
        dateString(expected as CalDate, HARPTOS, undefined, "YYYY-MM-DD")
    ).toEqual("1499-16-01");
});
// 16 | 17 | 12 | Nightal

test("Sort Harptos dates", () => {
    const events = [
        helper.parseCalDateString("1499-Midsummer-01-02", file), // 0
        helper.parseCalDateString("1499-Greengrass-01-04", file), // 1
        helper.parseCalDateString("1499-Hammer-01-03", file), // 2
        helper.parseCalDateString("1372-Shieldmeet-02-03", file), // 3
        helper.parseCalDateString("1372-Shieldmeet", file), // 4
        helper.parseCalDateString("1499-Alturiak", file), // 5
        helper.parseCalDateString("1499-Alturiak-01", file), // 6
        helper.parseCalDateString("1499-Greengrass-01-03", file), // 7
        helper.parseCalDateString("1499-Hammer", file), // 8
        helper.parseCalDateString("1499-Hammer-01", file), // 9
        helper.parseCalDateString("1499-Highharvestide-01", file), // 10
        helper.parseCalDateString("1499-Marpenoth-01", file), // 11
        helper.parseCalDateString("1499-Midsummer-01-03", file), // 12
        helper.parseCalDateString("1499-Alturiak-01-whatever", file), // 13
        helper.parseCalDateString("1499-Alturiak-01-ok?", file), // 14
    ];

    const fcEvents: CalEvent[] = events.map((x) => {
        return {
            date: x! as CalEventDate,
            description: "Test",
            id: "test",
            name: "Test",
            note: "Test",
            category: "Test",
            sort: helper.parsedToTimestamp(x!),
            type: EventType.Date,
        };
    });

    const sorted = sortEventList(fcEvents);

    expect(sorted[0].date).toEqual(events[4]);
    expect(sorted[1].date).toEqual(events[3]);
    expect(sorted[2].date).toEqual(events[8]);
    expect(sorted[3].date).toEqual(events[9]);
    expect(sorted[4].date).toEqual(events[2]);
    expect(sorted[5].date).toEqual(events[5]);
    expect(sorted[6].date).toEqual(events[6]);
    expect(sorted[7].date).toEqual(events[14]);
    expect(sorted[8].date).toEqual(events[13]);
    expect(sorted[9].date).toEqual(events[7]);
    expect(sorted[10].date).toEqual(events[1]);
    expect(sorted[11].date).toEqual(events[0]);
    expect(sorted[12].date).toEqual(events[12]);
    expect(sorted[13].date).toEqual(events[10]);
    expect(sorted[14].date).toEqual(events[11]);
});
