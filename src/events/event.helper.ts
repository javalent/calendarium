import type { FrontMatterCache, TFile } from "obsidian";
import { nanoid, testLeapDay, toPaddedString, wrap } from "../utils/functions";
import { DOMParser } from "xmldom";
import type {
    Calendar,
    CalEvent,
    CalEventCategory,
    CalEventDate,
    CalEventSort,
    RangedCalEventDate,
    CalEventInfo,
    DatedCalEvent,
} from "../@types";
import { DEFAULT_FORMAT } from "../utils/constants";
import randomColor from "randomcolor";
import { logError, logWarning } from "../utils/log";
import type { LeapDay } from "src/schemas/calendar/timespans";
import { EventType } from "./event.types";

const inlineDateSpans: RegExp = /<(span|div)[\s\S]*?<\/(span|div)>/g;

export type CalEventCallback = (
    fcEvent: CalEvent,
    category?: CalEventCategory
) => void;

export type CalEventElement = {
    dataset: {
        calendar: string | null;
        date: string | null;
        end: string | null;
        class: string | null;
        title: string | null;
        img: string | null;
    };
    content: string | null;
};

export interface InputDate {
    year?: any;
    month?: any;
    day?: any;
    order?: any;
}

export type DateBit = number | null;

export interface ParseDate {
    year: [DateBit, DateBit] | DateBit;
    month: [DateBit, DateBit] | DateBit;
    day: [DateBit, DateBit] | DateBit;
    order: string;
}

export class CalEventHelper {
    calendar: Calendar;
    useFilenameForEvents: boolean;
    formatString: string;
    formatDigest: string;

    /**
     * Creates an instance of EventHelper.
     * @param {Calendar} calendar
     */
    constructor(calendar: Calendar, parseTitleForEvents: boolean) {
        this.calendar = calendar;
        this.useFilenameForEvents = parseTitleForEvents;
        this.formatString = calendar.dateFormat || DEFAULT_FORMAT;
        this.formatDigest = this.formatString
            .toUpperCase()
            .replace(/[^\w]/g, "")
            .replace(/Y+/g, "Y")
            .replace(/M+/g, "M")
            .replace(/D+/g, "D");
    }

    onNewCategory: (category: CalEventCategory) => void;

    category?: CalEventCategory | null = null;
    parseFrontmatterEvent(
        frontmatter: FrontMatterCache | undefined,
        file: { path: string; basename: string },
        publish: CalEventCallback
    ) {
        if (!frontmatter) return;
        const dateField = "fc-date" in frontmatter ? "fc-date" : "fc-start";

        let cat: CalEventCategory | undefined, newCategory: boolean;
        if (frontmatter?.["fc-category"] && !this.category) {
            cat = this.calendar.categories.find(
                (cat) => cat?.name == frontmatter["fc-category"]
            );
            if (!cat) {
                cat = {
                    id: nanoid(6),
                    color: randomColor(),
                    name: frontmatter["fc-category"],
                };
                newCategory = true;
                this.calendar.categories.push(cat);
            }
        }

        let date = frontmatter[dateField]
            ? this.parseFrontmatterDate(frontmatter[dateField], file)
            : this.useFilenameForEvents
            ? this.parseFilenameDate(file)
            : null;
        if (!date) return;

        let end = frontmatter["fc-end"]
            ? this.parseFrontmatterDate(frontmatter["fc-end"], file)
            : null;

        const info = this.resolveDates(date, end);
        let event: CalEvent = {
            id: nanoid(6),
            name: frontmatter["fc-display-name"] ?? file.basename,
            description: frontmatter["fc-description"],
            sort: this.parsedToTimestamp(date),
            note: file.path,
            category: (cat ?? this.category)?.id ?? null,
            img: frontmatter["fc-img"],
            ...info,
        };

        publish(event);
    }

    resolveDates(date: ParseDate, end: ParseDate | null): CalEventInfo {
        let event: CalEventInfo;
        if (
            Array.isArray(date.day) ||
            Array.isArray(date.month) ||
            Array.isArray(date.year)
        ) {
            event = {
                type: EventType.Range,
                date: date as RangedCalEventDate,
            };
        } else if (end) {
            if (
                Array.isArray(end.day) ||
                Array.isArray(end.month) ||
                Array.isArray(end.year)
            ) {
                /* logError("End dates cannot be ranges.", end as InputDate, file); */
            }
            event = {
                type: EventType.Span,
                date: date as CalEventDate,
                end: end as CalEventDate,
            };
        } else {
            event = {
                type: EventType.Date,
                date: date as CalEventDate,
            };
        }

        return event;
    }

    parseInlineEvents(
        contents: string,
        file: { path: string; basename: string },
        publish: CalEventCallback,
        calendarCallback: (calendar: string, element: CalEventElement) => void
    ) {
        const domparser = new DOMParser();
        // span or div with attributes:
        // <span
        //     data-category='orange'    // optional
        //     data-date='144-Ches'      // mixed/short: year-...
        //     data-end='144-Ches-03-07' // mixed/full with -07 as additional for order
        //     data-img = 'Inline Example/Event_2.jpg'
        //     data-name='Another Event'>
        //     Event description
        // </span>
        // 4 segments: year-\d+-\d+-\d+ or year-monthName-\d+-\d+
        // For repeating events, use *
        for (const match of contents.matchAll(inlineDateSpans)) {
            const doc = domparser.parseFromString(match[0], "text/html");
            const element: CalEventElement = {
                dataset: {
                    // Calendarium mixed-date format
                    date: doc.documentElement.getAttribute("data-date"),
                    end: doc.documentElement.getAttribute("data-end"),
                    // event attributes
                    title: doc.documentElement.getAttribute("data-name"),
                    class: doc.documentElement.getAttribute("data-category"),
                    img: doc.documentElement.getAttribute("data-img"),
                    calendar: doc.documentElement.getAttribute("data-calendar"),
                },
                content: doc.documentElement.textContent,
            };
            if (!element.dataset.date) {
                continue; // span must contain a date
            }
            if (
                element.dataset.calendar &&
                element.dataset.calendar != this.calendar.name
            ) {
                //different calendar
                calendarCallback(element.dataset.calendar, element);
            } else {
                const event = this.parseEventElement(element, file);
                if (event) {
                    publish(event);
                }
            }
        }
    }

    parseEventElement(
        element: CalEventElement,
        file: { path: string; basename: string }
    ): CalEvent | null {
        // parse date strings, will return with all elements present: year, month, day, hour/order
        if (!element.dataset.date) {
            return null; // span must contain a date
        }
        let date = this.parseCalDateString(element.dataset.date, file);
        if (!date) return null;
        let cat: CalEventCategory | undefined;
        if (element.dataset.class) {
            cat = this.calendar.categories.find(
                (cat) => cat?.name == element.dataset.class
            );
            if (!cat) {
                cat = {
                    id: nanoid(6),
                    color: randomColor(),
                    name: element.dataset.class,
                };
                this.onNewCategory?.(cat);
                this.calendar.categories.push(cat);
            }
        }
        let end = element.dataset.end
            ? this.parseCalDateString(element.dataset.end, file)
            : null;
        const info = this.resolveDates(date, end);
        let event: CalEvent = {
            id: nanoid(6),
            name: element.dataset.title ?? file.basename,
            description: element.content,
            sort: this.parsedToTimestamp(date),
            note: file.path,
            category: (cat ?? this.category)?.id ?? null,
            img: element.dataset.img,
            ...info,
        };

        return event;
    }

    parseFilenameDate(file: {
        path: string;
        basename: string;
    }): ParseDate | null {
        // TODO: Filename formatter for this calendar?
        return this.parseCalDateString(file.basename, file);
    }

    parseFrontmatterDate(
        date: string | InputDate,
        file: { path: string; basename: string }
    ): ParseDate | null {
        if (typeof date === "string") {
            return this.parseCalDateString(date, file);
        }

        // replace any missing segments with '*'
        // to indicate a wildcard/repeating event
        return this.dateFromSegments(
            {
                year: date.year || "*",
                month: date.month || "*",
                day: date.day || "*",
                order: date.order,
            },
            file
        );
    }

    /**
     * Date in segments starting with year:
     * - year[-\d+[-\d+[-order]]]
     * - year[-monthName[-\d+[-order]]]
     *
     * Notes:
     * - '*' for repeating segment: year, month, and/or day
     * - order is a simple string to determine the order of events
     *   falling on the same year/month/day
     *
     * @param datestring
     * @param file Source file
     * @returns ParseDate instance
     */
    parseCalDateString(
        datestring: string,
        file: { path: string; basename: string }
    ): ParseDate | null {
        let datebits = datestring.split(/(?!^)[-–—](?![^[]*])/);
        console.log("🚀 ~ file: event.helper.ts:306 ~ datebits:", datebits);

        if (this.formatDigest != "YMD" && datebits.length < 3) {
            logError(
                `Must specify all three segments in ${this.formatString} order`,
                null,
                file,
                datestring
            );
            return null;
        }

        return this.dateFromSegments(
            {
                year: datebits[this.formatDigest.indexOf("Y")] || null,
                month: datebits[this.formatDigest.indexOf("M")] || null,
                day: datebits[this.formatDigest.indexOf("D")] || null,
                order: datebits[3] ? datebits[3] : "",
            },
            file,
            datestring
        );
    }

    resolveMonth(month: number | null | string, input: any): number | null {
        if (month === null) return null;
        if (typeof month === "number" && !Number.isNaN(month))
            return wrap(month - 1, this.calendar.static.months.length);
        if (Number.isNaN(month)) {
            // Note: Number.isNaN(null) == false
            // A null input month will not enter this block.
            // Name in the month segment
            let m = this.calendar.static.months.find(
                (m) => m.name?.startsWith(input) || m.short?.startsWith(input)
            );
            if (m) {
                return this.calendar.static.months.indexOf(m);
            } else {
                // Is this a well-known leapday?
                let leapday = this.calendar.static.leapDays.find(
                    (l) => l.name && l.name.startsWith(input)
                );
                if (leapday) {
                    return leapday.timespan;
                }
            }
        }
        return 0;
    }

    /**
     * Create a fully formed date from parsed data segments
     *
     * @param input InputDate, * for repeating, null for omitted
     * @param file Source file
     * @param order Optional extra data to disambiguate or order events with the same date
     * @param datestring Optional/original datestring
     * @returns ParseDate instance
     */
    dateFromSegments(
        input: InputDate,
        file: { path: string; basename: string },
        datestring?: string
    ): ParseDate | null {
        const year = wildNullNumber(input.year);
        let month = wildNullNumber(input.month);
        console.log("🚀 ~ file: event.helper.ts:345 ~ month:", month);

        let day = wildNullNumber(input.day);

        if (input.year === "*") {
            // repeating, this is fine
        } else if (!input.year || [year].flat().some((y) => Number.isNaN(y))) {
            logError(
                `Must specify a valid year: ${year}`,
                input,
                file,
                datestring
            );
            return null;
        }
        
        if (input.month === "*") {
            // repeating, this is fine
        } else if (Array.isArray(month)) {
            month = month.map((m) => this.resolveMonth(m, input.month)) as [
                DateBit,
                DateBit
            ];
        } else {
            month = this.resolveMonth(month, input.month);
        }

        if (input.day === "*") {
            // repeating, this is fine
        } else if (day != null && Number.isInteger(day)) {
            if (day < 1) {
                logWarning(
                    `Must specify a valid day. Using 1`,
                    input,
                    file,
                    datestring
                );
                day = 1;
            } else if (month) {
                // validate the day against the month (and perhaps year)
                const days = this.daysForMonth(month, year);
                if (day > days) {
                    logError(
                        `Day '${input.day}' is incorrect for month '${input.month}', which has ${days} day(s)`,
                        input,
                        file,
                        datestring
                    );
                    return null;
                }
            }
        } else if (leapday && month != null && year != null) {
            // short form (omitted date), but a well-known leapday (e.g. Harptos Shieldmeet)
            day = this.findLeapDay(leapday, month, year);
            if (day == null) {
                logError(
                    `Leap day '${input.day}' isn't valid for year '${input.year}'`,
                    input,
                    file,
                    datestring
                );
                return null;
            } else if (!year && input.year !== "*") {
                logWarning(
                    `Unable to validate '${input.day}' for year '${input.year}'. Using ${day}`,
                    input,
                    file,
                    datestring
                );
            }
        } else {
            // short form, assume first day of month
            day = 1;
        }

        console.log("🚀 ~ file: event.helper.ts:444", {
            year,
            month,
            day,
            order: input.order || "",
        });
        return {
            year,
            month,
            day,
            order: input.order || "",
        };
    }

    parsedToTimestamp(date: ParseDate): CalEventSort {
        // put repeating events off to the side
        if (date.year == null || date.month == null || date.day == null) {
            return {
                timestamp: Number.MIN_VALUE,
                order: date.order
                    ? date.order
                    : `${date.year || "*"}-${toPaddedString(
                          date.month,
                          this.calendar,
                          "month"
                      )}-${toPaddedString(date.day, this.calendar, "day")}`,
            };
        }
        // otherwise create a date string
        // TODO: pad month by number of months & days by max days
        return {
            timestamp: Number(
                `${date.year}${toPaddedString(
                    date.month,
                    this.calendar,
                    "month"
                )}${toPaddedString(date.day, this.calendar, "day")}`
            ),
            order: date.order || "",
        };
    }

    timestampForCalEvent(
        event: Partial<CalEvent>,
        old?: CalEventSort
    ): CalEventSort {
        if (!old && event.sort) {
            return event.sort;
        }
        // rebuild the timestamp
        return this.parsedToTimestamp({
            ...(event as DatedCalEvent).date!,
            order: old?.order || "",
        });
    }

    /**
     * Find day in month
     */
    findLeapDay(
        leapday: LeapDay,
        month: number,
        year: number
    ): Nullable<number> {
        const cm = this.calendar.static.months[month];
        const leapdays: LeapDay[] = this.calendar.static.leapDays.filter(
            (l) =>
                (l.timespan == month && !l.intercalary) ||
                (l.intercalary && l.numbered)
        );
        if (year && !testLeapDay(leapday, year)) {
            return null;
        }
        const day = cm.length + leapdays.indexOf(leapday) + 1;
        return day;
    }

    /**
     * Get the number of days in a month
     */
    daysForMonth(month: number, year: Nullable<number>): number {
        const cm = this.calendar.static.months[month];
        const leapdays: LeapDay[] = this.calendar.static.leapDays.filter(
            (l) =>
                (l.timespan == month && !l.intercalary) ||
                (l.intercalary && l.numbered)
        );

        if (year) {
            let count = leapdays.filter((l) => testLeapDay(l, year)).length;
            return cm.length + count;
        }

        // no year, any date in this rage is plausible
        return cm.length + leapdays.length;
    }
}

/**
 * Convert a string/null value to null, NaN, number, or array of numbers.
 * - null or `*` are not a number, but are different than a string
 * - if the value fails to parse as a number, it is a string month name
 * @param data
 * @returns null, a number, or NaN
 */
function wildNullNumber(data: any): [DateBit, DateBit] | DateBit {
    if (data == null || data === "*") {
        return null;
    }
    if (typeof data == "number") {
        return data;
    }
    if (typeof data == "string" && /[-–—]/.test(data)) {
        return data
            .slice(1, -1)
            .split("-")
            .map((v) => wildNullNumber(v) as DateBit) as [DateBit, DateBit];
    }

    return parseInt(data); // may return NaN, that's ok
}
