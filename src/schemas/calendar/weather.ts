import type { CalDate } from "./calendar";

export type CalWeatherCondition = {
    id: string;
    name: string;
    color: string;
}

export type WeatherState = {
    id: string
    date: CalDate
    conditionId: string
}