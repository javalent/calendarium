import { SaveableCalendariumModal } from "./modal";
import { Setting } from "obsidian";
import type { Calendar } from "src/schemas";
import { TRASH } from "src/utils/icons";

export class RestoreCalendarModal extends SaveableCalendariumModal<Calendar[]> {
    constructor(public calendars: Calendar[]) {
        super();
    }
    permanentlyDelete: string[] = [];
    saveText: string = "Save";
    async display() {
        this.contentEl.empty();
        if (!this.item) this.item = [];
        this.titleEl.setText("Restore calendars");
        for (const calendar of this.calendars.filter(
            (c) => !this.permanentlyDelete.includes(c.id)
        )) {
            new Setting(this.contentEl)
                .setName(calendar.name)
                .addToggle((t) => {
                    t.setValue(false).onChange((v) => {
                        if (v) {
                            this.item.push(calendar);
                        } else {
                            this.item.remove(calendar);
                        }
                    });
                })
                .addExtraButton((b) => {
                    b.setIcon(TRASH).onClick(() => {
                        this.permanentlyDelete.push(calendar.id);
                        this.display();
                    });
                });
        }
    }
}
