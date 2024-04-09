import { CalendariumModal } from "src/settings/modals/modal";
import GoToDate from "./GoToDate.svelte";
import type Calendarium from "src/main";
import type { CalendarStore, EphemeralStore } from "src/stores/calendar.store";
import { ButtonComponent } from "obsidian";

export class GoToDateModal extends CalendariumModal {
    $ui: GoToDate;
    buttonEl: HTMLDivElement;
    constructor(
        public plugin: Calendarium,
        public store: CalendarStore,
        public ephemeralStore: EphemeralStore
    ) {
        super(plugin.app);
        this.containerEl.addClasses(["has-buttons", "cancelable"]);
    }
    async display(): Promise<void> {
        this.setTitle("Go to date");
        this.$ui = new GoToDate({
            target: this.contentEl,
            props: {
                store: this.store,
                plugin: this.plugin,
                ephemeralStore: this.ephemeralStore,
            },
        });
        this.$ui.$on("close", () => this.close());
    }

    close(): void {
        this.$ui?.$destroy();
        super.close();
    }
}
