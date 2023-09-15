import { z } from "zod";
import { timeSpanSchema } from "./timespans";

export type BaseDay = z.infer<typeof baseDaySchema>;
export const baseDaySchema = timeSpanSchema.extend({
    type: z.union([z.literal("day"), z.literal("leapday")]),
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

const leapDayConditionSchema = z.object({
    ignore: z.boolean(),
    exclusive: z.boolean(),
    interval: z.number(),
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
