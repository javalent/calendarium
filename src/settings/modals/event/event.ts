import type {
    CalDate,
    Calendar,
    CalEvent,
    CalEventDate,
    UndatedCalDate,
} from "../../../@types";

import { nanoid } from "../../../utils/functions";

import copy from "fast-copy";
import { CalendariumModal } from "../modal";
import Calendarium from "src/main";
import EventCreator from "./EventCreator.svelte";
import { EventType } from "src/events/event.types";
import { ConfirmModal } from "../confirm";
import { SettingsService } from "src/settings/settings.service";

export class CreateEventModal extends CalendariumModal {
    saved = true;
    editing: boolean;
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
    $UI: EventCreator;
    constructor(
        public calendar: Calendar,
        public plugin: Calendarium,
        event?: CalEvent,
        date?: CalDate | CalEventDate | UndatedCalDate
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
    async checkCanExit() {
        if (this.isValidEvent()) return true;
        if (SettingsService.getData().exit.savingEvent) return true;
        return new Promise((resolve) => {
            const modal = new ConfirmModal(
                this.plugin.app,
                "This event requires additional information to save. Exiting now will discard changes.",
                {
                    cta: "Exit",
                    secondary: "Cancel",
                    dontAsk: "Exit and don't ask again",
                }
            );
            modal.onClose = async () => {
                if (modal.dontAsk) {
                    SettingsService.getData().exit.savingEvent = true;
                    await SettingsService.save();
                }
                resolve(modal.confirmed);
            };
            modal.open();
        });
    }
    isValidEvent() {
        if (!this.event.name) return false;
        if (
            this.event.type != EventType.Undated &&
            (this.event.date.year == null ||
                this.event.date.month == null ||
                this.event.date.day == null)
        ) {
            return false;
        }
        if (
            this.event.type === EventType.Range &&
            (this.event.end == null ||
                this.event.end.year == null ||
                this.event.end.month == null ||
                this.event.end.day == null)
        ) {
            return false;
        }
        return true;
    }

    async close() {
        if (await this.checkCanExit()) {
            this.saved = this.isValidEvent();
            super.close();
        }
    }
}

export async function addEventWithModal(
    plugin: Calendarium,
    calendar: Calendar,
    date: CalDate | CalEventDate | UndatedCalDate,
    event?: CalEvent
) {
    const modal = new CreateEventModal(calendar, plugin, event, date);

    modal.onClose = async () => {
        if (!modal.saved) return;
        const store = plugin.getStoreByCalendar(calendar);
        if (!store) return;
        calendar.events.push(modal.event);
        store.eventStore.insertEvents(modal.event);

        await SettingsService.saveCalendars();
    };

    modal.open();
}
