import { DeletedCalendar } from "src/schemas";
import { CalendariumModal, SaveableCalendariumModal } from "./modal";
import { Setting } from "obsidian";

export class RestoreCalendarModal extends SaveableCalendariumModal<
    DeletedCalendar[]
> {
    constructor(public calendars: DeletedCalendar[]) {
        super();
    }
    saveText: string = "Restore";
    async display() {
        this.contentEl.empty();
        if (!this.item) this.item = [];
        this.titleEl.setText("Restore Calendars");
        for (const calendar of this.calendars) {
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
                });
        }
    }
}
