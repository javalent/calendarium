import { App, setIcon, Setting } from "obsidian";

import {
    getEffectiveYearLength,
    nanoid,
    stringifyTemperature,
    translateTemperature,
} from "../../../../../../utils/functions";
import { CanceableCalendariumModal } from "../../../../../modals/modal";
import {
    getWeatherData,
    SeasonKind,
    SeasonType,
    type Season,
    type SeasonalWeatherData,
} from "src/schemas/calendar/seasonal";
import randomColor from "randomcolor";
import type { Calendar } from "src/schemas";
import DateWithValidation from "src/settings/creator/Utilities/DateWithValidation.svelte";
import { writable } from "svelte/store";
import type { CreatorStore } from "src/settings/creator/stores/calendar";
import { EDIT } from "src/utils/icons";
import copy from "fast-copy";
import WeatherData from "./WeatherData.svelte";
import type { UnitSystem } from "src/schemas/calendar/weather";

export function getDefaultSeason(type: SeasonType, name?: string): Season {
    if (type === SeasonType.DATED) {
        return {
            id: nanoid(6),
            name: name ?? "",
            type: SeasonType.DATED,
            color: randomColor(),
            month: 0,
            day: 1,
            weatherOffset: 56,
            weatherPeak: 5,
            kind: SeasonKind.NONE,
        };
    }
    return {
        id: nanoid(6),
        name: name ?? "",
        type: SeasonType.PERIODIC,
        color: randomColor(),
        duration: 0,
        peak: 0,
        weatherOffset: 56,
        weatherPeak: 5,
        kind: SeasonKind.NONE,
    };
}

export class CreateSeasonModal extends CanceableCalendariumModal<Season> {
    creating: boolean;
    valid = true;
    constructor(
        public calendar: Calendar,
        public store: CreatorStore,
        type: SeasonType,
        name: string,
        item?: Season
    ) {
        super();
        if (!item) {
            this.creating = true;
        }

        this.item = item ? { ...item } : getDefaultSeason(type, name);

        this.titleEl.setText(`${this.creating ? "Create" : "Modify"} season`);
    }
    async display() {
        this.contentEl.empty();
        let settingEl = this.contentEl;
        if (this.calendar.weather.enabled) {
            new Setting(this.contentEl)
                .setName("Seasonal information")
                .setHeading()
                .setClass("has-children");
            settingEl = this.contentEl.createDiv("setting-container");
        }
        new Setting(settingEl).setName("Name").addText((t) => {
            t.setValue(this.item.name ?? "").onChange(
                (v) => (this.item.name = v)
            );
        });
        new Setting(settingEl).setName("Color").addColorPicker((t) => {
            t.setValue(this.item.color ?? "").onChange(
                (v) => (this.item.color = v)
            );
        });

        if (this.item.type === SeasonType.DATED) {
            const date = new DateWithValidation({
                target: settingEl.createDiv(),
                props: {
                    date: writable({
                        month: this.item.month,
                        day: this.item.day,
                        year: 0,
                    }),
                    enableYear: false,
                    store: this.store,
                },
            });
            date.$on("date", (evt) => {
                if (this.item.type === SeasonType.DATED) {
                    this.item.month = evt.detail.month;
                    this.item.day = evt.detail.day;
                }
            });
            date.$on("valid", (evt) => (this.valid = evt.detail));
        }
        if (this.item.type === SeasonType.PERIODIC) {
            let periodic = this.item;
            new Setting(settingEl)
                .setName("Duration")
                .setDesc(
                    "Seasons will transition to the next season over this number of days."
                )
                .addText((t) => {
                    t.inputEl.type = "number";
                    t.setValue(`${periodic.duration}`).onChange((v) => {
                        if (isNaN(Number(v))) return;
                        periodic.duration = Number(v);
                    });
                })
                .addExtraButton((b) =>
                    b.setIcon("calculator").onClick(() => {
                        let period = getEffectiveYearLength(this.calendar);
                        for (const season of this.calendar.seasonal.seasons) {
                            if (season.type !== SeasonType.PERIODIC) continue;
                            if (season.id === this.item.id) continue;
                            period -= season.duration;
                        }
                        periodic.duration = Number(period.toPrecision(10));
                        this.display();
                    })
                );
            new Setting(settingEl)
                .setName("Peak duration")
                .setDesc(
                    "Seasons will remain in effect for this number of days before beginning to transition."
                )
                .addText((t) => {
                    t.inputEl.type = "number";
                    t.setValue(`${periodic.peak}`).onChange((v) => {
                        if (isNaN(Number(v))) return;
                        periodic.peak = Number(v);
                    });
                });
        }

        if (this.calendar.weather.enabled) {
            new Setting(this.contentEl)
                .setName("Weather")
                .setHeading()
                .setDesc(
                    createFragment((e) => {
                        e.createSpan({
                            text: "The weather will be calculated using this data during this season.",
                        });
                        e.createEl("p", {
                            text: "The surrounding seasons will also affect the weather, but the closer you are to the peak, the stronger the current effect is.",
                        });
                    })
                )
                .setClass("has-children");

            const weatherEl = this.contentEl.createDiv("setting-container");

            new Setting(weatherEl)
                .setName("Peak weather offset")
                .setDesc(
                    "Number of days before the 'peak' weather of the season. Typically this occurs a few months into the season."
                )
                .addText(
                    (t) =>
                        (t
                            .setValue(`${this.item.weatherOffset}`)
                            .onChange(
                                (v) => (this.item.weatherOffset = Number(v))
                            ).inputEl.type = "number")
                );
            new Setting(weatherEl)
                .setName("Peak weather duration")
                .setDesc("How long a season's peak weather lasts.")
                .addText(
                    (t) =>
                        (t
                            .setValue(`${this.item.weatherPeak}`)
                            .onChange(
                                (v) => (this.item.weatherPeak = Number(v))
                            ).inputEl.type = "number")
                );

            const kind = new Setting(weatherEl)
                .setName("Kind")
                .setDesc(
                    createFragment((f) => {
                        const data = getWeatherData(this.item);
                        const units = this.calendar.weather.tempUnits;
                        if (!data) {
                            f.createSpan({ text: "No weather data set" });
                            return;
                        }
                        let e = f.createDiv("weather-data");
                        const temps = e.createDiv("weather-icon");
                        setIcon(temps, "thermometer");
                        temps.createSpan({
                            text: `${stringifyTemperature(
                                data.tempRange[0],
                                units
                            )}–${stringifyTemperature(
                                data.tempRange[1],
                                units
                            )}`,
                        });
                        const chance = e.createDiv("weather-icon");
                        setIcon(chance, "droplets");
                        chance.createSpan({
                            text: `${data.precipitationChance * 100}%`,
                        });
                        const intensity = e.createDiv("weather-icon");
                        setIcon(intensity, "cloud-lightning");
                        intensity.createSpan({
                            text: `${data.precipitationIntensity * 100}%`,
                        });
                        const wind = e.createDiv("weather-icon");
                        setIcon(wind, "wind");
                        wind.createSpan({
                            text: `${data.windy * 100}%`,
                        });
                        const clouds = e.createDiv("weather-icon");
                        setIcon(clouds, "cloudy");
                        clouds.createSpan({
                            text: `${data.cloudy * 100}%`,
                        });
                    })
                )
                .addDropdown((d) => {
                    for (const value of Object.values(SeasonKind)) {
                        d.addOption(value, value);
                    }
                    d.setValue(this.item.kind).onChange((v) => {
                        const prior = getWeatherData(this.item);
                        this.item.kind = v as SeasonKind;
                        if (
                            this.item.kind === SeasonKind.CUSTOM &&
                            prior &&
                            !("weather" in this.item)
                        ) {
                            (this.item as any).weather = copy(prior);
                        }
                        this.display();
                    });
                });
            if (this.item.kind === SeasonKind.CUSTOM) {
                kind.addExtraButton((b) =>
                    b.setIcon(EDIT).onClick(() => {
                        if (this.item.kind === SeasonKind.CUSTOM) {
                            const modal = new WeatherDataModal(
                                copy(this.item.weather),
                                this.calendar.weather.tempUnits
                            );
                            modal.onClose = () => {
                                if (this.item.kind === SeasonKind.CUSTOM) {
                                    this.item.weather = copy(modal.item);
                                }
                                this.display();
                            };
                            modal.open();
                        }
                    })
                );
            }
        }
    }
}

export class WeatherDataModal extends CanceableCalendariumModal<SeasonalWeatherData> {
    constructor(public item: SeasonalWeatherData, public units: UnitSystem) {
        super();
    }
    async display() {
        this.contentEl.empty();
        new WeatherData({
            target: this.contentEl,
            props: {
                data: this.item,
                units: this.units,
            },
        });
    }
}
