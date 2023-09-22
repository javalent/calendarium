import { App, ButtonComponent, Modal } from "obsidian";

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
    cancelText = "Cancel";
    buttonEl: HTMLDivElement;
    constructor() {
        super(app);
        this.containerEl.addClasses(["has-buttons", "cancelable"]);
    }
    item: T;
    override onOpen(): void {
        this.display();
        this.buttonEl = this.modalEl.createDiv(
            "calendarium-modal-buttons setting-item"
        );
        this.addButtons();
    }
    addButtons() {
        this.buttonEl.empty();
        new ButtonComponent(this.buttonEl)
            .setButtonText(this.cancelText)
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
    T
> extends CanceableCalendariumModal<T> {
    saveText = "Save";
    constructor() {
        super();
        this.containerEl.addClasses(["saveable"]);
    }
    addButtons() {
        this.buttonEl.empty();
        new ButtonComponent(this.buttonEl)
            .setButtonText(this.cancelText)
            .onClick(this.cancel.bind(this));
        new ButtonComponent(this.buttonEl)
            .setButtonText(this.saveText)
            .setCta()
            .onClick(this.save.bind(this));
    }
    save() {
        this.close();
        this.onSave();
    }
    onSave() {}
}
