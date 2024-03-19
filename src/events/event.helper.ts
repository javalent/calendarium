import type { FrontMatterCache, TFile } from "obsidian";
import { nanoid, testLeapDay, toPaddedString, wrap } from "../utils/functions";
import { DOMParser } from "xmldom";
import { Err, Ok, type Result } from "@sniptt/monads";
import type {
    Calendar,
    CalEvent,
    CalEventCategory,
    CalEventDate,
    CalEventSort,
    RecurringCalEventDate,
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
        const dateString =
            frontmatter[dateField] ??
            (this.useFilenameForEvents ? file.basename : null);
        if (!dateString) return;

        const event = this.parseEvent(
            {
                dateString: dateString,
                eventName: frontmatter["fc-display-name"] ?? file.basename,
                eventDesc: frontmatter["fc-description"],
                eventImage: frontmatter["fc-img"],
                categoryString:
                    frontmatter?.["fc-category"] ?? this.category?.id ?? null,
                endDateString: frontmatter["fc-end"],
            },

            file
        );
        if (!event) return;

        publish(event);
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
                const event = this.parseEvent(
                    {
                        dateString: element.dataset.date,
                        eventName: element.dataset.title,
                        eventDesc: element.content,
                        eventImage: element.dataset.img,
                        endDateString: element.dataset.end,
                        categoryString: element.dataset.class,
                    },
                    file
                );
                if (event) {
                    publish(event);
                }
            }
        }
    }
    resolveDates(date: ParseDate, end: ParseDate | null): CalEventInfo {
        let event: CalEventInfo;
        if (
            Array.isArray(date.day) ||
            Array.isArray(date.month) ||
            Array.isArray(date.year)
        ) {
            event = {
                type: EventType.Recurring,
                date: date as RecurringCalEventDate,
            };
        } else if (
            date.year === null ||
            date.month === null ||
            date.day === null
        ) {
            if (date.year === null) {
                date.year = [null, null];
            }
            if (date.month === null) {
                date.month = [null, null];
            }
            if (date.day === null) {
                date.day = [null, null];
            }
            event = {
                type: EventType.Recurring,
                date: date as RecurringCalEventDate,
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
                type: EventType.Range,
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

    parseEvent(
        {
            dateString,
            eventName,
            eventDesc,
            eventImage,
            endDateString,
            categoryString,
        }: {
            dateString: string;
            eventName?: string | null;
            eventDesc?: string | null;
            eventImage?: string | null;
            endDateString?: string | null;
            categoryString?: string | null;
        },
        file: { path: string; basename: string }
    ): CalEvent | null {
        if (!dateString) {
            return null;
        }
        let date = this.parseDate(dateString, file);

        if (!date) return null;
        let cat: CalEventCategory | undefined;
        if (categoryString) {
            cat = this.calendar.categories.find(
                (cat) =>
                    cat?.name == categoryString || cat?.id == categoryString
            );
            if (!cat) {
                cat = {
                    id: nanoid(6),
                    color: randomColor(),
                    name: categoryString,
                };
                this.onNewCategory?.(cat);
                this.calendar.categories.push(cat);
            }
        }
        let end = endDateString ? this.parseDate(endDateString, file) : null;
        const info = this.resolveDates(date, end);
        let event: CalEvent = {
            id: nanoid(6),
            name: eventName ?? file.basename,
            description: eventDesc,
            sort: this.parsedToTimestamp(date),
            note: file.path,
            category: (cat ?? this.category)?.id ?? null,
            img: eventImage,
            ...info,
        };

        return event;
    }

    parseFilenameDate(file: {
        path: string;
        basename: string;
    }): ParseDate | null {
        return this.parseDate(file.basename, file);
    }

    parseDate(
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

    resolveMonth(month: DateBit | string, input: any): number | null {
        if (month === null) return 0;
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
    resolveDay(
        day: DateBit,
        months: DateBit | DateBit[],
        years: DateBit | DateBit[],
        input: InputDate
    ): Result<number | null, string> {
        // validate the day against the month (and perhaps year)
        if (typeof day === "number" && day < 1) return Ok(1);
        if (typeof day === "number") {
            for (const month of [months].flat()) {
                if (!month) continue;
                for (const year of [years].flat()) {
                    const days = this.daysForMonth(month, year);
                    if (day > days) {
                        return Err(
                            `Day '${input.day}' is incorrect for month '${input.month}', which has ${days} day(s)`
                        );
                    }
                }
            }
            return Ok(day);
        }
        let leapday = this.calendar.static.leapDays.find(
            (l) => l.name && l.name.startsWith(input.month)
        );

        if (leapday) {
            for (const month of [months].flat()) {
                if (!month) continue;
                for (const year of [years].flat()) {
                    day = this.findLeapDay(leapday, month, year);
                    if (day == null) {
                        return Err(
                            `Leap day '${input.day}' isn't valid for year '${input.year}'`
                        );
                    } else if (input.year !== "*") {
                        return Ok(day);
                    }
                }
            }
        }
        if (day == null) return Ok(1);

        return Ok(day);
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
        let year = wildNullNumber(input.year);
        let month = wildNullNumber(input.month);
        let day = wildNullNumber(input.day);

        if (input.year === "*") {
            year = [null, null];
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
            month = [null, null];
        } else if (Array.isArray(month)) {
            month = month.map((m) => this.resolveMonth(m, input.month)) as [
                DateBit,
                DateBit
            ];
        } else {
            month = this.resolveMonth(month, input.month);
        }
        if (input.day === "*") {
            day = [null, null];
        } else if (Array.isArray(day)) {
            const results = day.map((d) =>
                this.resolveDay(d, month, year, input)
            );
            let days: DateBit[] = [];
            for (const result of results) {
                if (result.isErr()) {
                    logError(result.unwrapErr(), input, file, datestring);
                    return null;
                } else {
                    days.push(result.unwrap());
                }
            }
            day = [...days] as [DateBit, DateBit];
        } else {
            // short form, assume first day of month
            const result = this.resolveDay(day, month, year, input);
            if (result.isErr()) {
                logError(result.unwrapErr(), input, file, datestring);
                return null;
            } else {
                day = result.unwrap();
            }
        }
        return {
            year,
            month,
            day,
            order: input.order || "",
        };
    }
    #stringifyDateBit(bit: string[]): string {
        return (
            (bit.length > 1 ? "[" : "") +
            bit.join("-") +
            (bit.length > 1 ? "]" : "")
        );
    }
    generateTimeStamp(date: ParseDate): string {
        const year = Array.isArray(date.year)
            ? [date.year].flat().map((y) => `${y ?? "*"}`)
            : [`${date.year ?? "*"}`];

        const month = [date.month]
            .flat()
            .map((m) => toPaddedString(m, this.calendar, "month"));
        const day = [date.day]
            .flat()
            .map((m) => toPaddedString(m, this.calendar, "day"));
        return `${this.#stringifyDateBit(year)}-${this.#stringifyDateBit(
            month
        )}-${this.#stringifyDateBit(day)}`;
    }
    parsedToTimestamp(date: ParseDate): CalEventSort {
        // put repeating events off to the side
        if (
            [date.year].flat().every((y) => y == null) ||
            [date.month].flat().every((m) => m == null) ||
            [date.day].flat().every((d) => d == null)
        ) {
            return {
                timestamp: Number.MIN_VALUE,
                order: date.order ? date.order : this.generateTimeStamp(date),
            };
        }
        let year: number;
        if (Array.isArray(date.year)) {
            year = date.year[0] ?? Number.MIN_VALUE;
        } else {
            year = date.year ?? Number.MIN_VALUE;
        }

        // otherwise create a date string
        return {
            timestamp: Number(
                `${year}${toPaddedString(
                    [date.month].flat()[0],
                    this.calendar,
                    "month"
                )}${toPaddedString([date.day].flat()[0], this.calendar, "day")}`
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
        year: number | null
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
    if (typeof data == "string" && /\[.+?\]/.test(data)) {
        const transformed = data
            .slice(1, -1)
            .split("-")
            .map((v) => wildNullNumber(v) as DateBit)
            .sort((a, b) => {
                if (typeof a === "number" && typeof b === "number") {
                    return a - b;
                }
                return 0;
            });
        if (transformed.length === 1) return transformed[0];
        if (transformed.length > 2) return [transformed[0], transformed.pop()!];
        return transformed as [DateBit, DateBit];
    }

    return parseInt(data); // may return NaN, that's ok
}
