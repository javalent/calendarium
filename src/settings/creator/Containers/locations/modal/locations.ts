import copy from "fast-copy";
import { setIcon, Setting } from "obsidian";
import type { Location } from "src/schemas/calendar/locations";
import {
    getWeatherData,
    SeasonKind,
    type Season,
} from "src/schemas/calendar/seasonal";
import { CanceableCalendariumModal } from "src/settings/modals/modal";
import { nanoid, stringifyTemperature } from "src/utils/functions";
import { EDIT } from "src/utils/icons";
import { WeatherDataModal } from "../../seasonal/seasons/modal/seasons";
import type { UnitSystem } from "src/schemas/weather/weather";

export class LocationModal extends CanceableCalendariumModal<Location> {
    constructor(
        public item: Location,
        public seasons: Season[],
        public units: UnitSystem,
        public creating = true
    ) {
        super();

        this.titleEl.setText(`${this.creating ? "Create" : "Modify"} location`);
    }
    async display() {
        this.contentEl.empty();
        new Setting(this.contentEl).setName("Name").addText((t) => {
            t.setValue(this.item.name ?? "").onChange(
                (v) => (this.item.name = v)
            );
        });

        for (const season of this.seasons) {
            const seasonEl = this.contentEl.createDiv();
            new Setting(seasonEl).setHeading().setName(season.name);
            const weatherEl = seasonEl.createDiv("setting-container");
            const seasonData = this.item.seasons[season.id];
            const kind = new Setting(weatherEl)
                .setName("Kind")
                .setDesc(
                    createFragment((f) => {
                        const data = getWeatherData(seasonData);
                        const units = this.units;
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
                            text: `${Number(
                                (data.precipitationChance * 100).toPrecision(2)
                            )}%`,
                        });
                        const intensity = e.createDiv("weather-icon");
                        setIcon(intensity, "cloud-lightning");
                        intensity.createSpan({
                            text: `${Number(
                                (data.precipitationIntensity * 100).toPrecision(
                                    2
                                )
                            )}%`,
                        });
                        const wind = e.createDiv("weather-icon");
                        setIcon(wind, "wind");
                        wind.createSpan({
                            text: `${Number(
                                (data.windy * 100).toPrecision(2)
                            )}%`,
                        });
                        const clouds = e.createDiv("weather-icon");
                        setIcon(clouds, "cloudy");
                        clouds.createSpan({
                            text: `${Number(
                                (data.cloudy * 100).toPrecision(2)
                            )}%`,
                        });
                    })
                )
                .addDropdown((d) => {
                    for (const value of Object.values(SeasonKind)) {
                        d.addOption(value, value);
                    }
                    d.setValue(seasonData.kind).onChange((v) => {
                        const prior = getWeatherData(seasonData);

                        seasonData.kind = v as SeasonKind;
                        if (
                            seasonData.kind === SeasonKind.CUSTOM &&
                            prior &&
                            !("weather" in seasonData)
                        ) {
                            (seasonData as any).weather = copy(prior);
                        }
                        this.display();
                    });
                });
            if (seasonData.kind === SeasonKind.CUSTOM) {
                kind.addExtraButton((b) =>
                    b.setIcon(EDIT).onClick(() => {
                        if (seasonData.kind === SeasonKind.CUSTOM) {
                            const modal = new WeatherDataModal(
                                copy(seasonData.weather),
                                this.units
                            );
                            modal.onClose = () => {
                                if (seasonData.kind === SeasonKind.CUSTOM) {
                                    seasonData.weather = copy(modal.item);
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
