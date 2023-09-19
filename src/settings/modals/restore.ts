import { CalendariumModal } from "./modal";

export class RestoreCalendarModal extends CalendariumModal {
    async display() {
        this.contentEl.empty();
        this.titleEl.setText("Restore Calendars");
    }
}
