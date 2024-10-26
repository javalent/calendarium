import type { CalDate } from "./calendar";

export type CalWeatherCondition = {
    name: string;
    color: string;
    id: string;
}

export type WeatherState = {
    id: string
    date: CalDate
    conditionId: string
}