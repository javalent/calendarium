import { CanceableCalendariumModal } from "src/settings/modals/modal";
import type { Weather } from "src/schemas/calendar/weather";
import { Setting } from "obsidian";

export default class SetWeatherModal extends CanceableCalendariumModal<Weather> {
    async display(): Promise<void> {
        this.setTitle("Set weather");
        this.contentEl.empty();

        new Setting(this.contentEl).setName("Current temperature");
        new Setting(this.contentEl).setName("Temperature range");
        new Setting(this.contentEl).setName("Precipitation");
        new Setting(this.contentEl).setName("Cloudiness");
        new Setting(this.contentEl).setName("Windiness");
    }
}
