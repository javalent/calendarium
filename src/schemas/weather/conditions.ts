import type { EffectID } from "./effects";

export const WeatherEffectConditionType = {
    GT: "Greater than",
    LT: "Less than",
    EQUAL: "Equal to",
    LOCATION: "Location",
} as const;
export type WeatherEffectConditionType =
    (typeof WeatherEffectConditionType)[keyof typeof WeatherEffectConditionType];

interface BaseWeatherEffectCondition {}

/**
 * @param comparator This is the ID of the
 */
interface GreaterThanCondition extends BaseWeatherEffectCondition {
    type: typeof WeatherEffectConditionType.GT;
    comparator: EffectID;
    value: number;
}
interface LessThanCondition extends BaseWeatherEffectCondition {
    type: typeof WeatherEffectConditionType.LT;
    comparator: EffectID;
    value: number;
}
interface EqualCondition extends BaseWeatherEffectCondition {
    type: typeof WeatherEffectConditionType.EQUAL;
    comparator: EffectID;
    value: number;
}
interface LocationCondition extends BaseWeatherEffectCondition {
    type: typeof WeatherEffectConditionType.EQUAL;
    comparator: EffectID;
    value: number;
}

export type WeatherEffectCondition =
    | GreaterThanCondition
    | LessThanCondition
    | EqualCondition
    | LocationCondition;
