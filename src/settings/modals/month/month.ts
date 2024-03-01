import { CanceableCalendariumModal } from "../modal";
import { Setting } from "obsidian";
import type { Month } from "src/schemas/calendar/timespans";
import { nanoid } from "src/utils/functions";

export class MonthModal extends CanceableCalendariumModal<Month> {
    creating: boolean;

    constructor(item?: Month) {
        super();
        if (!item) {
            this.creating = true;
        }

        this.item = item ?? {
            type: "month",
            length: 0,
            name: "",
            id: nanoid(6),
            interval: 1,
            offset: 0,
        };

        this.titleEl.setText(`${this.creating ? "Create" : "Modify"} month`);
    }
    async display() {
        this.contentEl.empty();
        new Setting(this.contentEl).setName("Name").addText((t) => {
            t.setValue(this.item.name ?? "").onChange(
                (v) => (this.item.name = v)
            );
        });
        new Setting(this.contentEl).setName("Length").addText((t) => {
            t.setValue(`${this.item.length}` ?? "").onChange(
                (v) => (this.item.length = Number(v))
            );
            t.inputEl.type = "number";
            t.inputEl.min = "0";
        });
        new Setting(this.contentEl).setName("Type").addDropdown((d) => {
            d.addOption("month", "Month");
            d.addOption("intercalary", "Intercalary");
            d.setValue(this.item.type).onChange((v) => {
                if (v != "month" && v != "intercalary") return;
                this.item.type = v;
            });
        });
    }
}
