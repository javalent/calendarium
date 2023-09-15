import { z } from "zod";
import { daySchema } from "../timespans/days";
import { monthSchema } from "../timespans/months";
import { calDateSchema } from "src/schemas/data";

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
