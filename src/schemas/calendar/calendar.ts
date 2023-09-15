import { z } from "zod";
import { calDateSchema } from "../data";
import { staticCalendarDataSchema } from "./static";
import { calEventSchema } from "../events/events";
import { calEventCategorySchema } from "../events/categories";

export type Calendar = z.infer<typeof calendarSchema>;
export const calendarSchema = z.object({
    deleted: z.boolean().optional(),
    deletedTimestamp: z.number().optional(),
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
