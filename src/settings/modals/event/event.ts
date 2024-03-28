import { Setting, Notice, TextAreaComponent, TFile } from "obsidian";
import type {
    CalDate,
    Calendar,
    CalEvent,
    CalEventDate,
} from "../../../@types";

import { nanoid } from "../../../utils/functions";
import { FileInputSuggest } from "obsidian-utilities";

import copy from "fast-copy";
import { CalendariumModal } from "../modal";
import Calendarium from "src/main";
import EventCreator from "./EventCreator.svelte";
import { EventType } from "src/events/event.types";

export class CreateEventModal extends CalendariumModal {
    saved = true;
    event: CalEvent = {
        name: "",
        description: null,
        date: {
            month: this.calendar.current.month,
            day: this.calendar.current.day,
            year: this.calendar.current.year,
        },
        id: nanoid(6),
        note: null,
        category: null,
        sort: {
            timestamp: Number.MIN_VALUE,
            order: "",
        },
        type: EventType.Date,
    };
    editing: boolean;
    infoEl: HTMLDivElement;
    dateEl: HTMLElement;
    monthEl: HTMLDivElement;
    dayEl: HTMLDivElement;
    yearEl: HTMLDivElement;
    fieldsEl: HTMLDivElement;
    stringEl: HTMLDivElement;
    startDateEl: HTMLDivElement;
    endDateEl: HTMLDivElement;
    startEl: HTMLDivElement;
    endEl: HTMLDivElement;
    $UI: EventCreator;
    constructor(
        public calendar: Calendar,
        public plugin: Calendarium,
        event?: CalEvent,
        date?: CalDate | CalEventDate
    ) {
        super(plugin.app);
        if (event) {
            this.event = copy(event);
            this.editing = true;
        }
        if (date) {
            this.event.date = copy(date);
        }
        this.containerEl.addClass("calendarium-create-event");
        plugin.register(() => this.close());
    }

    async display() {
        this.contentEl.empty();
        this.titleEl.setText(this.editing ? "Edit event" : "New event");

        this.$UI = new EventCreator({
            target: this.contentEl,
            props: {
                event: this.event,
                store: this.plugin.getStoreByCalendar(this.calendar),
                plugin: this.plugin,
            },
        });
        this.$UI.$on("cancel", () => {
            this.saved = false;
            this.close();
        });
    }

    async onOpen() {
        await this.display();
    }
    onClose(): void {
        this.$UI?.$destroy();
    }
}

export async function addEventWithModal(
    plugin: Calendarium,
    calendar: Calendar,
    date: CalDate | CalEventDate,
    event?: CalEvent
) {
    const modal = new CreateEventModal(calendar, plugin, event, date);

    modal.onClose = async () => {
        if (!modal.saved) return;
        const store = plugin.getStoreByCalendar(calendar);
        if (!store) return;
        calendar.events.push(modal.event);
        store.eventStore.insertEvents(modal.event);

        await plugin.saveCalendars();
    };

    modal.open();
}
