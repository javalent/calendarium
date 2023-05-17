import { App, Modal } from "obsidian";

export abstract class CalendariumModal extends Modal {
    constructor(public app: App) {
        super(app);
        this.containerEl.addClass("calendarium-modal")
    }
}