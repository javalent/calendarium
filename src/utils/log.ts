import type { InputDate } from "src/events/event.helper";

export function logError(
    message: string,
    input: InputDate | null,
    file: { path: string; basename: string },
    datestring?: string
) {
    console.error(
        "Calendarium: %s. From '%s', date value: %o",
        message,
        file.path,
        datestring ? datestring : input
    );
}

export function logWarning(
    message: string,
    input: InputDate,
    file: { path: string; basename: string },
    datestring?: string
) {
    console.warn(
        "Calendarium: %s. From '%s', date value: '%o'",
        message,
        file.path,
        datestring ? datestring : input
    );
}
