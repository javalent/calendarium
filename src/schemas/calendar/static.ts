import { z } from "zod";
import { weekSchema, leapDaySchema } from "./timespans/days";
import { monthSchema } from "./timespans/months";
import { yearSchema } from "./timespans/years";
import { moonSchema } from "./moons";
import { eraSchema } from "./static/misc";

export type StaticCalendarData = z.infer<typeof staticCalendarDataSchema>;
export const staticCalendarDataSchema = z.object({
    firstWeekDay: z.number().nullable(),
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
