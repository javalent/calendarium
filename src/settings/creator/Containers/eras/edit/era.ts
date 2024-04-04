import type Calendarium from "src/main";
import type { Era } from "src/schemas/calendar/timespans";
import {
    CalendariumModal,
    CanceableCalendariumModal,
} from "src/settings/modals/modal";
import { nanoid } from "src/utils/functions";
import type { CreatorStore } from "../../../stores/calendar";
import EraEdit from "./EraEdit.svelte";
import copy from "fast-copy";

export class EraEditModal extends CanceableCalendariumModal<Era> {
    era: Era = {
        id: nanoid(6),
        name: "",
        description: "",
        format: "{{era_name}}",
        endsYear: false,
        isEvent: false,
        isStartingEra: false,
        date: {
            year: 1,
            month: 0,
            day: 1,
        },
    };
    $ui: EraEdit;
    constructor(
        public plugin: Calendarium,
        public store: CreatorStore,
        era: Era | string
    ) {
        super();
        if (typeof era == "string") {
            //name
            this.era.name = era;
        } else {
            this.era = copy(era);
        }
        this.setTitle("Edit era");
    }
    async display(): Promise<void> {
        this.$ui = new EraEdit({
            target: this.contentEl,
            props: {
                era: this.era,
                plugin: this.plugin,
                store: this.store,
            },
        });
    }
    close() {
        this.$ui?.$destroy();
        super.close();
    }
}
