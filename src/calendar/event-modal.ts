import { Component, MarkdownRenderer } from "obsidian";
import type { CalEvent, EventLike } from "src/@types";
import type Calendarium from "src/main";
import { CalendariumModal } from "src/settings/modals/modal";

export class ViewEventModal extends CalendariumModal {
    constructor(public event: EventLike, public plugin: Calendarium) {
        super(plugin.app);
        this.containerEl.addClass("fantasy-calendar-view-event");
    }
    async display() {
        this.contentEl.empty();
        this.contentEl.createEl("h4", { text: this.event.name });

        await MarkdownRenderer.render(
            this.app,
            this.event.description ?? "",
            this.contentEl,
            this.event.note ?? "",
            this.plugin
        );
    }
    async onOpen() {
        await this.display();
    }
}
