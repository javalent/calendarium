import { z } from "zod";

export type TimeSpan = z.infer<typeof timeSpanSchema>;
export const timeSpanSchema = z.object({
    type: z.string(),
    name: z.string(),
    id: z.string(),
});
