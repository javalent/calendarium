import { z } from "zod";

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
