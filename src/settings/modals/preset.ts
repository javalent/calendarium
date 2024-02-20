import copy from "fast-copy";
import { ButtonComponent, ExtraButtonComponent } from "obsidian";
import type { Calendar, PresetCalendar } from "src/@types";
import { nanoid } from "src/utils/functions";
import { PRESET_CALENDARS } from "src/utils/presets";
import { CalendariumModal } from "./modal";
import { CLOSE } from "src/utils/icons";

export class CalendarPresetModal extends CalendariumModal {
    preset: PresetCalendar | Calendar;
    saved: boolean;
    async onOpen() {
        await this.display();
    }
    async display() {
        this.containerEl.addClass("calendarium-choose-preset");
        this.contentEl.empty();
        this.contentEl.createEl("h3", {
            text: "Choose a Preset Calendar",
        });

        const presetEl = this.contentEl.createDiv(
            "calendarium-preset-container"
        );

        for (const preset of PRESET_CALENDARS) {
            const button = new ButtonComponent(presetEl).onClick(() => {
                this.preset = preset;
                this.display();
            });
            if (this.preset == preset) button.setCta();
            button.buttonEl.createDiv({
                cls: "setting-item-name",
                text: preset.name ?? "",
            });
            button.buttonEl.createDiv({
                cls: "setting-item-description",
                text: preset.description ?? "",
            });
        }

        const buttonEl = this.contentEl.createDiv(
            "calendarium-confirm-buttons"
        );
        new ButtonComponent(buttonEl)
            .setButtonText("Apply")
            .onClick(() => {
                this.saved = true;
                this.preset = copy(this.preset);
                this.preset.id = nanoid(6);
                this.close();
            })
            .setCta();
        new ExtraButtonComponent(buttonEl).setIcon(CLOSE).onClick(() => {
            this.close();
        });
    }
}
