import { z } from "zod";
import { timeSpanSchema } from "./timespans";
import { weekSchema } from "./days";

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
