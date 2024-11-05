import { Setting } from "obsidian";

import { getEffectiveYearLength, nanoid } from "../../../../../utils/functions";
import { CanceableCalendariumModal } from "../../../../modals/modal";
import { SeasonType, type Season } from "src/schemas/calendar/seasonal";
import randomColor from "randomcolor";
import type { Calendar } from "src/schemas";

export function getDefaultSeason(type: SeasonType, name?: string): Season {
    if (type === SeasonType.DATED) {
        return {
            id: nanoid(6),
            name: name ?? "",
            type: SeasonType.DATED,
            color: randomColor(),
            month: 0,
            day: 1,
        };
    }
    return {
        id: nanoid(6),
        name: name ?? "",
        type: SeasonType.PERIODIC,
        color: randomColor(),
        duration: 0,
        peak: 0,
    };
}

export class CreateSeasonModal extends CanceableCalendariumModal<Season> {
    creating: boolean;

    constructor(
        public calendar: Calendar,
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
        new Setting(this.contentEl).setName("Name").addText((t) => {
            t.setValue(this.item.name ?? "").onChange(
                (v) => (this.item.name = v)
            );
        });
        new Setting(this.contentEl).setName("Color").addColorPicker((t) => {
            t.setValue(this.item.color ?? "").onChange(
                (v) => (this.item.color = v)
            );
        });

        if (this.item.type === SeasonType.DATED) {
        }
        if (this.item.type === SeasonType.PERIODIC) {
            let periodic = this.item;
            new Setting(this.contentEl)
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
                        for (const season of this.calendar.static.seasonal
                            .seasons) {
                            if (season.type !== SeasonType.PERIODIC) continue;
                            if (season.id === this.item.id) continue;
                            period -= season.duration;
                        }
                        periodic.duration = Number(period.toPrecision(10));
                        this.display();
                    })
                );
            new Setting(this.contentEl)
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
    }
}
