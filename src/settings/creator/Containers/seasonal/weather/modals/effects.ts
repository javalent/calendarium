import { CanceableCalendariumModal } from "src/settings/modals/modal";

import type { Calendar } from "src/schemas";
import type { CreatorStore } from "src/settings/creator/stores/calendar";
import { nanoid } from "src/utils/functions";
import {
    WeatherEffectCadence,
    WeatherEffectKind,
    type WeatherEffect,
} from "src/schemas/weather/effects";

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
                  conditions: [],
                  temperature: false,
                  data: {
                      range: [0, 100],
                  },
              };

        this.titleEl.setText(`${this.creating ? "Create" : "Modify"} season`);
    }

    async display(): Promise<void> {
        this.contentEl.empty();
        this.titleEl.setText("Editing effect");
    }
}
