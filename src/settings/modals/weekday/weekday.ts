import type { Day } from "src/@types";
import { CanceableCalendariumModal } from "../modal";
import { Setting } from "obsidian";
import { nanoid } from "src/utils/functions";

export class WeekdayModal extends CanceableCalendariumModal<Day> {
    creating: boolean;
    useAbbr: boolean;

    constructor(item?: Day) {
        super();
        if (!item) {
            this.creating = true;
        }

        this.item = item ?? {
            type: "day",
            name: null,
            id: nanoid(6),
        };

        this.useAbbr = (this.item?.abbreviation?.length ?? 0) > 0;

        this.titleEl.setText(`${this.creating ? "Create" : "Modify"} Weekday`);
    }
    async display() {
        this.contentEl.empty();
        new Setting(this.contentEl).setName("Name").addText((t) => {
            t.setValue(this.item.name ?? "").onChange(
                (v) => (this.item.name = v)
            );
        });
        new Setting(this.contentEl)
            .setName("Custom abbreviation")
            .setDesc(
                "By default, the first three letters of the name will be used."
            )
            .addToggle((t) => {
                t.setValue(this.useAbbr).onChange((v) => {
                    this.useAbbr = v;
                    this.display();
                });
            });
        if (this.useAbbr) {
            new Setting(this.contentEl).setName("Abbreviation").addText((t) => {
                t.setValue(this.item.abbreviation ?? "").onChange(
                    (v) => (this.item.abbreviation = v)
                );
            });
        }
    }
}
