export * from "../schemas";

export interface CalendariumCodeBlockParameters {
    /** Name of the calendar you wish to display.
     * If omitted, the code block will display the default calendar specified in settings.
     */
    calendar?: string;
}
