import { Component, MarkdownRenderer } from "obsidian";
import type { CalEvent } from "src/@types";
import type FantasyCalendar from "src/main";
import { CalendariumModal } from "src/settings/modals/modal";

export class ViewEventModal extends CalendariumModal {
    constructor(public event: CalEvent, public plugin: FantasyCalendar) {
        super(plugin.app);
        this.containerEl.addClass("fantasy-calendar-view-event");
    }
    async display() {
        this.contentEl.empty();
        this.contentEl.createEl("h4", { text: this.event.name });

        await MarkdownRenderer.renderMarkdown(
            this.event.description ?? "",
            this.contentEl,
            this.event.note ?? "",
            new Component()
        );
    }
    async onOpen() {
        await this.display();
    }
}
