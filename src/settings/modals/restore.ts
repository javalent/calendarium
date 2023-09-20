import { DeletedCalendar } from "src/schemas";
import { CalendariumModal, SaveableCalendariumModal } from "./modal";
import { Setting } from "obsidian";

export class RestoreCalendarModal extends SaveableCalendariumModal<
    DeletedCalendar[]
> {
    constructor(public calendars: DeletedCalendar[]) {
        super();
    }
    permanentlyDelete: string[] = [];
    saveText: string = "Save";
    async display() {
        this.contentEl.empty();
        if (!this.item) this.item = [];
        this.titleEl.setText("Restore Calendars");
        for (const calendar of this.calendars.filter(
            (c) => !this.permanentlyDelete.includes(c.id)
        )) {
            new Setting(this.contentEl)
                .setName(calendar.name)
                .setDesc(
                    `${new Date(calendar.deletedTimestamp).toLocaleString()}`
                )
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
                    b.setIcon("trash").onClick(() => {
                        this.permanentlyDelete.push(calendar.id);
                        this.display();
                    });
                });
        }
    }
}
