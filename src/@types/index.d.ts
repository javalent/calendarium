export * from "../schemas";

export type Nullable<T> = T | null;

export interface CalendariumCodeBlockParameters {
    /** Name of the calendar you wish to display.
     * If omitted, the code block will display the default calendar specified in settings.
     */
    calendar?: string;
}
