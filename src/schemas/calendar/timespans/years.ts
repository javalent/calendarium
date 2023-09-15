import { z } from "zod";
import { timeSpanSchema } from "./timespans";

export type Year = z.infer<typeof yearSchema>;
export const yearSchema = timeSpanSchema;
