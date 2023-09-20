import { Notice } from "obsidian";

export class CalendariumNotice extends Notice {
    constructor(message: string | DocumentFragment, duration?: number) {
        super(message, duration);
        this.noticeEl.addClass("calendarium-notice");
    }

    #callbacks: Function[] = [];
    registerOnHide(callback: () => any) {
        this.#callbacks.push(callback);
    }

    hide() {
        super.hide();
        for (const callback of this.#callbacks) {
            callback();
        }
    }
}
