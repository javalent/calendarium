import { CanceableCalendariumModal } from "src/settings/modals/modal";

import type { Calendar } from "src/schemas";
import type { CreatorStore } from "src/settings/creator/stores/calendar";
import { nanoid } from "src/utils/functions";
import {
    WeatherEffectCadence,
    WeatherEffectDisplay,
    WeatherEffectKind,
    WeatherUnitKind,
    type ChanceTableEntry,
    type WeatherEffect,
} from "src/schemas/weather/effects";
import EditEffectModal from "./EditEffectModal.svelte";
import { getIconIds, Setting } from "obsidian";
import { IconSuggester } from "./icon";

export default class WeatherEffectModal extends CanceableCalendariumModal<WeatherEffect> {
    creating: boolean = false;
    constructor(
        public calendar: Calendar,
        public store: CreatorStore,
        name: string,
        item?: WeatherEffect
    ) {
        super();
        if (!item) {
            this.creating = true;
        }

        this.item = item
            ? { ...item }
            : {
                  id: nanoid(12),
                  name,
                  kind: WeatherEffectKind.RANGE,
                  cadence: WeatherEffectCadence.STATIC,
                  unit: WeatherUnitKind.NONE,
                  display: WeatherEffectDisplay.NONE,
                  conditions: [],
                  data: [0, 100],
              };

        this.titleEl.setText(`${this.creating ? "Create" : "Modify"} effect`);
    }

    async display(): Promise<void> {
        this.contentEl.empty();
        this.titleEl.setText("Editing effect");

        new EditEffectModal({
            target: this.contentEl,
            props: {
                effect: this.item,
                calendar: this.calendar,
            },
        });
    }
}

export class ChanceTableItemModal extends CanceableCalendariumModal<ChanceTableEntry> {
    constructor(public item: ChanceTableEntry) {
        super();
    }
    icons = getIconIds().map((v) => v.replace(/^lucide-/, ""));
    async display(): Promise<void> {
        this.contentEl.empty();

        new Setting(this.contentEl)
            .setName("Name")
            .addText((t) =>
                t.setValue(this.item.name).onChange((v) => (this.item.name = v))
            );
        new Setting(this.contentEl)
            .setName("Chance")
            .addText(
                (t) =>
                    (t
                        .setValue(`${Math.round(this.item.chance * 100)}`)
                        .onChange(
                            (v) =>
                                (this.item.chance = Number(
                                    (Number(v) / 100).toPrecision(2)
                                ))
                        ).inputEl.type = "number")
            );

        new Setting(this.contentEl)
            .setName("Icon")
            .setDesc("When set, this icon will be displayed for the effect")
            .addText((t) => {
                t.setValue(this.item.icon ?? "").onChange(
                    (v) => (this.item.icon = v)
                );
                const modal = new IconSuggester(this.app, t, this.icons);

                modal.onSelect(async (match) => {
                    this.item.icon = match.item;
                    t.setValue(match.item);
                    modal.close();
                });
            });
    }
}
