import type { LeapDay, Day, Month } from "src/schemas/calendar/timespans";
import type {
    Calendar,
    CalDate,
    CalEvent,
    FullCalEventDateBit,
    OneTimeCalEventDate,
} from "../@types";
import { DEFAULT_FORMAT } from "./constants";
import { type DateBit } from "src/events/event.helper";
import { EventType } from "src/events/event.types";

export function daysBetween(date1: Date, date2: Date) {
    const d1 = window.moment(date1);
    const d2 = window.moment(date2);

    let days = d2.diff(d1, "days");

    if (
        (d1.year() < d2.year() || d1.dayOfYear() < d2.dayOfYear()) &&
        (d1.hour() > d2.hour() ||
            d1.minute() > d2.minute() ||
            d1.second() > d2.second() ||
            d1.millisecond() > d2.millisecond())
    ) {
        days += 1;
    }
    return days;
}

export function wrap(value: number, size: number): number {
    return ((value % size) + size) % size;
}

export function nanoid(len: number) {
    return "ID_xyxyxyxyxyxy".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function getIntervalDescription(leapday: LeapDay) {
    if (!leapday.interval?.length) return "";
    const intervals = leapday.interval.sort(
        (a, b) =>
            (a.interval ?? Number.MIN_VALUE) - (b.interval ?? Number.MIN_VALUE)
    );
    let description = [];
    for (let interval of intervals) {
        if (interval.interval == undefined) continue;
        const length = interval.interval;
        const offset =
            leapday.offset && !interval.ignore
                ? ` (offset by ${leapday.offset})`
                : "";
        if (interval.exclusive) {
            if (length == 1) {
                description.push(`not every year${offset}`);
            } else {
                description.push(`not every ${ordinal(length)} year${offset}`);
            }
        } else {
            const index = intervals.indexOf(interval);
            const also = index > 0 && intervals[index - 1].exclusive;
            if (length == 1) {
                description.push(`${also ? "also " : ""}every year${offset}`);
            } else {
                description.push(
                    `${also ? "also " : ""}every ${ordinal(
                        length
                    )} year${offset}`
                );
            }
        }
    }
    const join = description.join(", but ");
    return join[0].toUpperCase() + join.slice(1).toLowerCase();
}

export function ordinal(i: number) {
    const j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

function getRecurringYear(year: FullCalEventDateBit): string {
    if (!Array.isArray(year)) return `${year}`;
    if (year.every((y) => y == null)) {
        return `every year`;
    }
    if (year[0] === null) {
        return `every year until ${year[1]}`;
    }
    if (year[1] === null) {
        return `every year starting ${year[0]}`;
    }
    return `${year[0]}-${year[1]}`;
}

function getRecurringMonth(
    month: FullCalEventDateBit,
    months: Month[]
): string {
    if (!Array.isArray(month)) {
        return `${months[month].name}`;
    }
    if (month[0] == null && month[1] == null) {
        return `every month`;
    }
    const first = month[0] === null ? 0 : month[0];
    const second = month[1] === null ? months.length - 1 : month[1];

    return `${months[first].name}-${months[second].name}`;
}
function getRecurringDay(day: FullCalEventDateBit): string {
    if (!Array.isArray(day)) {
        return ordinal(day);
    }
    if (day[0] == null && day[1] == null) {
        return `every day`;
    }
    if (day[0] == null && day[1] != null) {
        return `every day until ${day[1]}`;
    }
    if (day[1] == null && day[0] != null) {
        return `every day after ${day[0]}`;
    }
    return `${day[0]}-${day[1]}`;
}
export function eventDateString(event: CalEvent, calendar: Calendar) {
    switch (event.type) {
        case EventType.Recurring: {
            const { year, month, day } = event.date;
            const { months, years, useCustomYears } = calendar.static;
            let recurring: string = `${getRecurringDay(
                day
            )} of ${getRecurringMonth(month, months)}, ${getRecurringYear(
                year
            )}`;

            return recurring[0].toUpperCase() + recurring.slice(1);
        }
        case EventType.Range: {
            return dateString(event.date, calendar, event.end);
        }
        case EventType.Undated: {
            return "No date";
        }
        case EventType.Date:
        default: {
            return dateString(event.date, calendar);
        }
    }
}

export function dateString(
    date: OneTimeCalEventDate,
    calendar: Calendar,
    end?: OneTimeCalEventDate | null,
    dateFormat?: string
) {
    if (!date || date.day == undefined) {
        return "";
    }
    if (!dateFormat) {
        // default calendar format is DEFAULT_FORMAT (YYYY-MM-DD).. should this be flipped?
        dateFormat = calendar.dateFormat || DEFAULT_FORMAT;
    }
    const { day, month, year } = date;
    const { months, years, useCustomYears } = calendar.static;
    let startY: string = `${year}`;
    if (useCustomYears && years?.length && year) {
        startY = years[year - 1].name ?? startY;
    }
    if (month != undefined && !months[month]) return "Invalid Date";

    const startM = month == undefined ? undefined : months[month].name;
    const startD = ordinal(day);

    if (end && end.day) {
        const endDay = end.day;
        const endMonth = end.month;
        const endYear = end.year;
        let endY: string = `${endYear}`;
        if (useCustomYears && years?.length && endYear) {
            endY = years[endYear - 1]?.name ?? endY;
        }
        const endM = endMonth == undefined ? endMonth : months[endMonth].name;
        const endD = ordinal(endDay);

        // \u2014 is em dash
        if (
            month != undefined &&
            endMonth != undefined &&
            year != undefined &&
            year != endYear
        ) {
            const startStr = format(
                calendar,
                dateFormat,
                startY,
                date as CalDate
            );
            const endStr = format(calendar, dateFormat, endY, end as CalDate);
            return `${startStr} — ${endStr}`;
        }
        if (
            month != undefined &&
            endMonth != undefined &&
            year != undefined &&
            endMonth != month
        ) {
            return `${startM} ${startD} — ${endM} ${endD}, ${startY}`;
        }
        if (month != undefined && endMonth != undefined && year != undefined) {
            return `${startM} ${startD}—${endD}, ${startY}`;
        }
        if (month != undefined && endMonth != undefined && endMonth != month) {
            return `${startM} ${startD} — ${endM} ${endD} of every year`;
        }
        if (month != undefined && endMonth != undefined) {
            return `${startM} ${startD}—${endD} of every year`;
        }
        return `${startD}—${endD} of every month`;
    }

    if (month != undefined && year != undefined) {
        return format(calendar, dateFormat, startY, date as CalDate);
    }
    if (month != undefined) {
        return `${startM} ${startD} of every year`;
    }
    return `${startD} of every month`;
}

function format(
    calendar: Calendar,
    dateFormat: string,
    year: string | number,
    date: CalDate
): string {
    let format = dateFormat
        .replace(/[Yy]+/g, "🂡")
        .replace(/[Mm]{4,}/g, "🂢") // MMMM
        .replace(/[Mm]{3,}/g, "🂣") // MMM
        .replace(/[Mm]{2,}/g, "🂤") // MM
        .replace(/[Mm]/g, "🂥") // M
        .replace(/[Dd]{2,}/g, "🂦")
        .replace(/[Dd]/g, "🂧");

    // If we have an intercalary month and are using "pretty names", well...
    if (
        format.match(/🂢|🂣/g) &&
        calendar.static.months[date.month].type == "intercalary"
    ) {
        // It's an intercalary month with only one day? Remove the day.
        if (calendar.static.months[date.month].length == 1 && date.day == 1) {
            format = format
                .replace(/^🂦|🂧[ -]/g, "") // day at the beginning
                .replace(/[ -]🂦|🂧/g, ""); // day in the middle or end
        } else {
            const leapday = calendar.static.leapDays.find(
                (l: LeapDay) => l.timespan == date.month
            );
            if (leapday && testLeapDay(leapday, date.year)) {
                // It's a well-known intercalary leap day! Huzzah!
                // Use that as the month name, and remove the day.
                format = format
                    .replace("🂢", leapday.name ?? "") // MMMM
                    .replace(
                        "🂣",
                        shorten(leapday.short ?? "", leapday.name ?? "")
                    ) // MMM
                    .replace(/^🂦|🂧[ -]/g, "") // day at the beginning
                    .replace(/[ -]🂦|🂧/g, ""); // day in the middle or end
            }
        }
    }

    return format
        .replace("🂡", `${year}`)
        .replace("🂢", toMonthString(date.month, calendar)) // MMMM
        .replace("🂣", toShortMonthString(date.month, calendar)) // MMM
        .replace("🂤", toPaddedString(date.month + 1, calendar, "month")) // to human index (intercalary?)
        .replace("🂥", `${date.month + 1}`) // M
        .replace("🂦", toPaddedString(date.day, calendar, "day"))
        .replace("🂧", `${date.day}`)
        .trim();
}

function shorten(short: string, name: string) {
    return short ? short : name.slice(0, 3);
}

export function toMonthString(
    month: Nullable<number>,
    calendar: Calendar
): string {
    return month == null ? "*" : calendar.static.months[month]?.name ?? "*";
}

export function toShortMonthString(
    month: Nullable<number>,
    calendar: Calendar
): string {
    return month == null
        ? "*"
        : shorten(
              calendar.static.months[month].short ?? "",
              calendar.static.months[month].name ?? ""
          );
}

export function toPaddedString(
    data: [DateBit, DateBit] | DateBit,
    calendar: Calendar,
    field: "month" | "day" | "year"
): string {
    const padding =
        field == "month" ? calendar.static.padMonths : calendar.static.padDays;
    return data == null ? "*" : String(data).padStart(padding ?? 0, "0");
}

export function isValidDay(day: number | null, calendar: Calendar) {
    if (day == null) return false;
    if (calendar?.current?.month == null) return false;
    if (day < 1) return false;
    if (
        day < 1 ||
        day > calendar?.static?.months[calendar.current?.month]?.length ||
        !calendar?.static?.months[calendar.current?.month]?.length
    )
        return false;
    return true;
}

export function isValidMonth(month: number | null, calendar: Calendar) {
    if (month == null) return false;
    if (!calendar?.static?.months?.length) return false;
    if (month < 0 || month >= calendar?.static?.months?.length) return false;
    return true;
}

export function isValidYear(year: number | null, calendar: Calendar) {
    if (year == null) return false;
    if (calendar?.static?.useCustomYears) {
        if (!calendar?.static?.years?.length) return false;
        if (year < 0 || year > calendar?.static?.years?.length) return false;
    }
    return true;
}

/**
 * Test if a leap day occurs in a given year.
 */
export function testLeapDay(leapday: LeapDay, year: number) {
    return leapday.interval
        .sort(
            (a, b) =>
                (a.interval ?? Number.MIN_VALUE) -
                (b.interval ?? Number.MIN_VALUE)
        )
        .some(({ interval, exclusive }, index, array) => {
            if (interval == undefined) return false;
            if (exclusive && index == 0) {
                return (year - (leapday.offset ?? 0)) % interval != 0;
            }

            if (exclusive) return;

            if (array[index + 1] && array[index + 1].exclusive) {
                return (
                    (year - (leapday.offset ?? 0)) % interval == 0 &&
                    (year - (leapday.offset ?? 0)) %
                        (array[index + 1].interval ?? 0) !=
                        0
                );
            }
            return (year - (leapday.offset ?? 0)) % interval == 0;
        });
}

function resolve(number: FullCalEventDateBit | null): number {
    if (Array.isArray(number)) return Number.MIN_VALUE;
    return number ?? Number.MIN_VALUE;
}
function compare(a: FullCalEventDateBit | null, b: FullCalEventDateBit | null) {
    return resolve(a) != resolve(b);
}

export function compareEvents(a: CalEvent, b: CalEvent) {
    if (a.sort && b.sort) {
        if (a.sort.timestamp == b.sort.timestamp) {
            return a.sort.order.localeCompare(b.sort.order);
        }
        return a.sort.timestamp - b.sort.timestamp;
    }
    if (compare(a.date.year, b.date.year)) {
        return resolve(a.date.year) - resolve(b.date.year);
    }
    if (compare(a.date.month, b.date.month)) {
        return resolve(a.date.month) - resolve(b.date.month);
    }
    return resolve(a.date.day) - resolve(b.date.day);
}

export function sortEventList(list: CalEvent[]): CalEvent[] {
    return list.sort((a, b) => compareEvents(a, b));
}

export function getAbbreviation(day: Day) {
    return day.abbreviation ? day.abbreviation : (day.name ?? "").slice(0, 3);
}
