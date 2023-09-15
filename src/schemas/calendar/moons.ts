import { z } from "zod";

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
