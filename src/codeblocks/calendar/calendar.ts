import { MarkdownRenderChild, Notice, parseYaml } from "obsidian";
import { type ViewParent, ViewType } from "src/calendar/view.types";
import type Calendarium from "src/main";
import type { CalendariumCodeBlockParameters } from "src/schemas";
import type { CalendarStore } from "src/stores/calendar.store";
import { nanoid } from "src/utils/functions";
import Ui from "../../calendar/ui/UI.svelte";

export class CalendarContainer
    extends MarkdownRenderChild
    implements ViewParent
{
    ui: Ui;
    constructor(
        public plugin: Calendarium,
        public source: string,
        containerEl: HTMLElement
    ) {
        super(containerEl);
    }
    getViewType: () => string = () => ViewType.Calendarium;
    switchCalendar(calendar: string): void {
        const newStore = this.plugin.getStore(calendar);
        if (!newStore) {
            new Notice("There was an issue opening that calendar.");
            throw new Error("Could not find a calendar by that name");
        }
        this.store = newStore;
        this.calendar = calendar;

        this.ui.$set({ store: this.store });

        this.plugin.app.workspace.requestSaveLayout();
        this.plugin.app.workspace.trigger(
            "calendarium:view-parent:change-calendar",
            { parent: this.id, calendar }
        );
    }
    child: string | null;
    id: string = nanoid(12);
    calendar: string;
    store: CalendarStore;
    onload(): void {
        const params: CalendariumCodeBlockParameters =
            parseYaml(this.source ?? "") ?? {};
        let name = params.calendar ?? this.plugin.defaultCalendar.name;
        let calendar = this.plugin.calendars.find((c) => c.name === name);
        if (!calendar) {
            calendar = this.plugin.defaultCalendar;
        }

        const store = this.plugin.getStore(calendar.id);
        if (!store) {
            this.containerEl.replaceWith(
                createEl("code", {
                    text: "No calendar by that name was found.",
                })
            );
            return;
        }
        this.store = store;
        this.calendar = calendar.id;

        this.ui = new Ui({
            target: this.containerEl,
            props: {
                store: this.store,
                view: this,
                plugin: this.plugin,
                full: false,
            },
        });
        this.plugin.register(() => {
            this.ui?.$destroy();
            const pre = createEl("pre");
            pre.createEl("code", {
                text: "Calendarium has been unloaded. Re-enable the plugin to render your calendars.",
            });
            this.containerEl.replaceWith(pre);
        });
    }
}
