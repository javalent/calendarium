import { App, ButtonComponent, Modal } from "obsidian";
import type { TimeSpan } from "src/@types";

export abstract class CalendariumModal extends Modal {
    constructor(public app: App) {
        super(app);
        this.containerEl.addClass("calendarium-modal");
    }
    onOpen(): void {
        this.display();
    }
    abstract display(): Promise<void>;
}

export abstract class CanceableCalendariumModal<T> extends CalendariumModal {
    constructor() {
        super(app);
        this.containerEl.addClasses(["has-buttons", "cancelable"]);
    }
    item: T;
    override onOpen(): void {
        this.display();
        this.addButtons();
    }
    addButtons() {
        const buttons = this.modalEl.createDiv(
            "calendarium-modal-buttons setting-item"
        );
        new ButtonComponent(buttons)
            .setButtonText("Cancel")
            .setCta()
            .onClick(this.cancel.bind(this));
    }
    cancel() {
        this.onClose = () => {};
        this.close();
        this.onCancel();
    }
    onCancel() {}
}
export abstract class SaveableCalendariumModal<
    T extends TimeSpan
> extends CanceableCalendariumModal<T> {
    constructor() {
        super();
        this.containerEl.addClasses(["saveable"]);
    }
    override onOpen(): void {
        this.display();
        this.addButtons();
    }
    addButtons() {
        const buttons = this.modalEl.createDiv("calendarium-modal-buttons");
        new ButtonComponent(buttons)
            .setButtonText("Save")
            .setCta()
            .onClick(this.save.bind(this));
        new ButtonComponent(buttons)
            .setButtonText("Cancel")
            .onClick(this.cancel.bind(this));
    }
    save() {
        this.close();
        this.onSave();
    }
    onSave() {}
}
