import type { InputDate } from "src/events/event.helper";

export function logError(
    message: string,
    input: InputDate | null,
    file: { path: string; basename: string } | null,
    datestring?: string
) {
    let log = [`Calendarium: ${message}.`];
    if (file) {
        log.push(`From '${file.path}'`);
    }
    log.push(`(date value: ${datestring ? datestring : input})`);
    console.error(log.join(" "));
}

export function logWarning(
    message: string,
    input: InputDate,
    file: { path: string; basename: string },
    datestring?: string
) {
    let log = [`Calendarium: ${message}.`];
    if (file) {
        log.push(`From '${file.path}'`);
    }
    log.push(`(date value: ${datestring ? datestring : input})`);
    console.log(log.join(" "));
}
