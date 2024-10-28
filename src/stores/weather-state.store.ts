import type { CalDate, Calendar } from "src/@types";
import { type Writable, derived, get, writable } from "svelte/store";
import type { WeatherState } from "../schemas/calendar/weather";
import { WeatherStateCache } from "./cache/weather-state-cache";
import { SettingsService } from "../settings/settings.service";

export class WeatherStateStore {
    readonly #weatherStates: Writable<Map<string, WeatherState>>;

    public getWeatherStates() {
        return [...get(this.#weatherStates).values()];
    }

    #weatherStateCache: WeatherStateCache;
    #calendar: Calendar;

    constructor(public calendar: Calendar) {
        this.#weatherStates = writable(
            new Map((calendar.weatherStates ?? []).map((e) => [e.id, e]))
        );
        this.#weatherStateCache = new WeatherStateCache(
            derived(this.#weatherStates, (e) => [...e.values()])
        );
        this.#calendar = calendar;
    }

    public getWeatherStatesForDate(date: CalDate) {
        return this.#weatherStateCache.getItemsOrRecalculate(date);
    }

    public async insertWeatherState(state: WeatherState) {
        this.#weatherStates.update((SAVED_STATE) => {
            SAVED_STATE.set(state.id, state);
            return SAVED_STATE;
        });
        this.#calendar.weatherStates?.push(state);
        this.#weatherStateCache.invalidate(state.date);
        await SettingsService.saveCalendars();
    }

    public async removeWeatherState(state: WeatherState) {
        this.#weatherStates.update((SAVED_STATE) => {
            SAVED_STATE.delete(state.id);
            this.#weatherStateCache.invalidate(state.date);
            return SAVED_STATE;
        });
        this.#calendar.weatherStates?.remove(state);
        this.#weatherStateCache.invalidate(state.date);
        await SettingsService.saveCalendars();
    }
}
