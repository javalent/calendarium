import { z } from "zod";

export type CalDate = z.infer<typeof calDateSchema>;
export const calDateSchema = z.object({
    year: z.number(),
    month: z.number(),
    day: z.number(),
});

/**
 * Events
 */
export type CalEventSort = z.infer<typeof calEventSortSchema>;
export const calEventSortSchema = z.object({
    timestamp: z.number(),
    order: z.string(),
});

export type CalEventDate = z.infer<typeof calEventDateSchema>;
export const calEventDateSchema = z.object({
    year: z.number().nullable(),
    month: z.number().nullable(),
    day: z.number().nullable(),
});

const formulaIntervalSchema = z.object({
    type: z.literal("interval"),
    number: z.number(),
    timespan: z.literal("days"),
});

export type CalEventCondition = z.infer<typeof calEventConditionSchema>;
export const calEventConditionSchema = z.object({});
const eventFormulaSchema = formulaIntervalSchema;

export type CalEvent = z.infer<typeof calEventSchema>;
export const calEventSchema = z.object({
    name: z.string(),
    description: z.string().nullable(),
    date: calEventDateSchema,
    end: calEventDateSchema.nullish(),
    id: z.string(),
    note: z.string().nullable(),
    category: z.string().nullable(),
    sort: calEventSortSchema,
    formulas: z.array(eventFormulaSchema).optional(),
    img: z.string().optional(),
});

export type ColorEvent = z.infer<typeof colorEventSchema>;
export const colorEventSchema = calEventSchema.extend({
    color: z.string(),
});

export type CalEventCategory = z.infer<typeof calEventCategorySchema>;
export const calEventCategorySchema = z.object({
    name: z.string(),
    color: z.string(),
    id: z.string(),
});

/**
 * Moons
 */

export type Moon = z.infer<typeof moonSchema>;
export const moonSchema = z.object({
    name: z.string(),
    cycle: z.number(),
    offset: z.number(),
    faceColor: z.string(),
    shadowColor: z.string(),
    id: z.string(),
});

export type Phase = z.infer<typeof phaseSchema>;
export const phaseSchema = z.union([
    z.undefined(),
    z.literal("New Moon"),
    z.literal("New Moon Fading"),
    z.literal("New Moon Faded"),
    z.literal("Waxing Crescent Rising"),
    z.literal("Waxing Crescent Risen"),
    z.literal("Waxing Crescent"),
    z.literal("Waxing Crescent Fading"),
    z.literal("Waxing Crescent Faded"),
    z.literal("First Quarter Rising"),
    z.literal("First Quarter Risen"),
    z.literal("First Quarter"),
    z.literal("First Quarter Fading"),
    z.literal("First Quarter Faded"),
    z.literal("Waxing Gibbous Rising"),
    z.literal("Waxing Gibbous Risen"),
    z.literal("Waxing Gibbous"),
    z.literal("Waxing Gibbous Fading"),
    z.literal("Waxing Gibbous Faded"),
    z.literal("Full Moon Rising"),
    z.literal("Full Moon Risen"),
    z.literal("Full Moon"),
    z.literal("Full Moon Fading"),
    z.literal("Full Moon Faded"),
    z.literal("Waning Gibbous Rising"),
    z.literal("Waning Gibbous Risen"),
    z.literal("Waning Gibbous"),
    z.literal("Waning Gibbous Fading"),
    z.literal("Waning Gibbous Faded"),
    z.literal("Last Quarter Rising"),
    z.literal("Last Quarter Risen"),
    z.literal("Last Quarter"),
    z.literal("Last Quarter Fading"),
    z.literal("Last Quarter Faded"),
    z.literal("Waning Crescent Rising"),
    z.literal("Waning Crescent Risen"),
    z.literal("Waning Crescent"),
    z.literal("Waning Crescent Fading"),
    z.literal("Waning Crescent Faded"),
    z.literal("New Moon Rising"),
    z.literal("New Moon Risen"),
]);

export type MoonState = z.infer<typeof moonStateSchema>;
export const moonStateSchema = moonSchema.extend({
    phase: phaseSchema,
});
/**
 * Timespans
 */

export type TimeSpan = z.infer<typeof timeSpanSchema>;
export const timeSpanSchema = z.object({
    type: z.string(),
    name: z.string(),
    id: z.string(),
});

/**
 * Days
 */
export type BaseDay = z.infer<typeof baseDaySchema>;
export const baseDaySchema = timeSpanSchema.extend({
    type: z.union([z.literal("day"), z.literal("leapday")]),
    name: z.string().nullable(),
    id: z.string().nullable(),
});

export type DefinedBaseDay = z.infer<typeof definedBaseDaySchema>;
export const definedBaseDaySchema = z.object({
    number: z.number(),
});

export type Day = z.infer<typeof daySchema>;
export const daySchema = baseDaySchema.extend({
    type: z.literal("day"),
    abbreviation: z.string().optional(),
});

export const definedDaySchema = daySchema.merge(definedBaseDaySchema);

export type Week = z.infer<typeof weekSchema>;
export const weekSchema = z.array(daySchema);

export type LeapDayCondition = z.infer<typeof leapDayConditionSchema>;
const leapDayConditionSchema = z.object({
    ignore: z.boolean().nullable(),
    exclusive: z.boolean().nullable(),
    interval: z.number().nullable(),
});

export type LeapDay = z.infer<typeof leapDaySchema>;
export const leapDaySchema = baseDaySchema.extend({
    type: z.literal("leapday"),
    short: z.string().optional(),
    interval: z.array(leapDayConditionSchema),
    timespan: z.number(),
    intercalary: z.boolean(),
    offset: z.number(),
    numbered: z.boolean().optional(),
    after: z.number().optional(),
});

export type DefinedLeapDay = z.infer<typeof definedLeapDaySchema>;
export const definedLeapDaySchema = leapDaySchema.merge(definedBaseDaySchema);

export type DayOrLeapDay = z.infer<typeof dayOrLeapDaySchema>;
export const dayOrLeapDaySchema = z.discriminatedUnion("type", [
    definedLeapDaySchema,
    definedDaySchema,
]);
/**
 * Months
 */
const baseMonthSchema = timeSpanSchema.extend({
    length: z.number(),
    interval: z.number(),
    offset: z.number(),
    type: z.union([z.literal("month"), z.literal("intercalary")]),
    subtitle: z.string().optional(),
    short: z.string().optional(),
});

export type IntercalaryMonth = z.infer<typeof intercalaryMonthSchema>;
export const intercalaryMonthSchema = baseMonthSchema.extend({
    type: z.literal("intercalary"),
});

export type RegularMonth = z.infer<typeof regularMonthSchema>;
export const regularMonthSchema = baseMonthSchema.extend({
    type: z.literal("month"),
    week: weekSchema.optional(),
});

export type Month = z.infer<typeof monthSchema>;
export const monthSchema = z.discriminatedUnion("type", [
    regularMonthSchema,
    intercalaryMonthSchema,
]);

/**
 * Years
 */
export type Year = z.infer<typeof yearSchema>;
export const yearSchema = timeSpanSchema;

/**
 * Misc
 */
export type Season = z.infer<typeof seasonSchema>;
export const seasonSchema = z.object({
    name: z.string(),
    start: z.object({
        month: monthSchema,
        day: daySchema,
    }),
});
export type Era = z.infer<typeof eraSchema>;
export const eraSchema = z.object({
    id: z.string(),
    name: z.string(),
    format: z.string(),
    restart: z.boolean(),
    endsYear: z.boolean(),
    event: z.boolean(),
    start: calDateSchema,
    eventDescription: z.string().optional(),
    eventCategory: z.string().optional(),
    description: z.string().optional(),
});

/**
 * Static
 */
export type StaticCalendarData = z.infer<typeof staticCalendarDataSchema>;
export const staticCalendarDataSchema = z.object({
    firstWeekDay: z.number(),
    overflow: z.boolean(),
    weekdays: weekSchema,
    months: z.array(monthSchema),
    leapDays: z.array(leapDaySchema),
    moons: z.array(moonSchema),
    displayMoons: z.boolean(),
    displayDayNumber: z.boolean(),
    eras: z.array(eraSchema),
    offset: z.number().optional(),
    incrementDay: z.boolean(),
    useCustomYears: z.boolean().optional(),
    years: z.array(yearSchema).optional(),
    padMonths: z.number().optional(),
    padDays: z.number().optional(),
});

/**
 * Calendar
 */
export type Calendar = z.infer<typeof calendarSchema>;
export const calendarSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    static: staticCalendarDataSchema,
    current: calDateSchema,
    events: z.array(calEventSchema),
    categories: z.array(calEventCategorySchema),
    date: z.number().optional(),
    displayWeeks: z.boolean().optional(),
    autoParse: z.boolean(),
    path: z.array(z.string()),
    supportInlineEvents: z.boolean().nullish(),
    inlineEventTag: z.string().nullish(),
    dateFormat: z.string().optional(),
    showIntercalarySeparately: z.boolean(),
});
export type DeletedCalendar = z.infer<typeof deletedCalendarSchema>;
export const deletedCalendarSchema = calendarSchema.extend({
    deletedTimestamp: z.number(),
});
export type PresetCalendar = z.infer<typeof presetCalendarSchema>;
export const presetCalendarSchema = calendarSchema.extend({
    id: z.string().nullable(),
    name: z.string().nullable(),
    current: calDateSchema.merge(
        z.object({
            year: z.number().nullable(),
            month: z.number().nullable(),
            day: z.number().nullable(),
        })
    ),
});

/**
 * Data
 */
export type CalendariumCodeBlockParameters = z.infer<
    typeof calendariumCodeBlockParametersSchema
>;
export const calendariumCodeBlockParametersSchema = z.object({
    calendar: z.string().optional(),
});

export type CalendariumData = z.infer<typeof calendariumDataSchema>;
export const SyncBehavior = z.enum(["Ask", "Always", "Never"]);
export type SyncBehavior = z.infer<typeof SyncBehavior>;
export const calendariumDataSchema = z.object({
    addToDefaultIfMissing: z.boolean(),
    calendars: z.array(calendarSchema),
    deletedCalendars: z.array(deletedCalendarSchema),
    configDirectory: z.string().nullable(),
    dailyNotes: z.boolean(),
    dateFormat: z.string(),
    defaultCalendar: z.nullable(z.string()),
    eventFrontmatter: z.boolean(),
    eventPreview: z.boolean(),
    exit: z.object({
        saving: z.boolean(),
        event: z.boolean(),
        calendar: z.boolean(),
    }),
    parseDates: z.boolean(),
    version: z.object({
        major: z.number().nullable(),
        minor: z.number().nullable(),
        patch: z.number().nullable(),
        beta: z.number().nullable(),
        /* patch: z.union([z.number(), z.string()]).nullable(), */
    }),
    debug: z.boolean(),
    askedToMoveFC: z.boolean(),
    askedAboutSync: z.boolean(),
    syncBehavior: SyncBehavior,
});

export type MarkdownCalendariumData = z.infer<
    typeof markdownCalendariumDataSchema
>;
export const markdownCalendariumDataSchema = calendariumDataSchema.omit({});
