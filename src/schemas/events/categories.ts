import { z } from "zod";

export type CalEventCategory = z.infer<typeof calEventCategorySchema>;
export const calEventCategorySchema = z.object({
    name: z.string(),
    color: z.string(),
    id: z.string(),
});
