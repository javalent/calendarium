import copy from "fast-copy";
import { App, Setting, ButtonComponent } from "obsidian";

import LeapDayNew from "./LeapDayNew.svelte";
import LeapDayInterval from "./LeapDayInterval.svelte";
import type { LeapDay, LeapDayCondition } from "src/schemas/calendar/timespans";
import { CalendariumModal } from "src/settings/modals/modal";
import { nanoid } from "src/utils/functions";
import type { Calendar } from "src/schemas";

export class CreateLeapDayModal extends CalendariumModal {
    saved = true;
    leapday: LeapDay = {
        id: nanoid(6),
        name: "Leap Day",
        interval: [],
        intercalary: false,
        timespan: 0,
        offset: 0,
        type: "leapday",
    };
    editing: boolean;
    infoEl: HTMLDivElement;
    conditionsEl: HTMLDivElement;
    constructor(
        app: App,
        public calendar: Calendar,
        leapday?: Partial<LeapDay>
    ) {
        super(app);
        if (leapday) {
            this.leapday = { ...this.leapday, ...copy(leapday) };
            this.editing = true;
        }
        this.containerEl.addClasses(["calendarium-create-leapday"]);
    }

    async display() {
        this.titleEl.setText(this.editing ? "Edit leap day" : "New leap day");
        new LeapDayNew({
            target: this.contentEl,
            props: {
                leapDay: this.leapday,
                calendar: this.calendar,
                app: this.app,
            },
        }).$on("cancel", () => {
            this.saved = false;
            this.close();
        });
    }
    async onOpen() {
        await this.display();
    }
}

export class IntervalModal extends CalendariumModal {
    saved: boolean = true;
    editing: boolean = false;
    condition: LeapDayCondition = {
        interval: 0,
        exclusive: false,
        ignore: false,
    };
    buttonsEl: HTMLDivElement;
    constructor(
        public app: App,
        public canBeExclusive?: boolean,
        condition?: LeapDayCondition
    ) {
        super(app);

        if (condition) {
            this.condition = { ...condition };
            this.editing = true;
        }
    }
    async display() {
        this.containerEl.addClasses(["calendarium-nested-settings"]);
        this.contentEl.empty();
        this.titleEl.setText("Leap day condition");

        new LeapDayInterval({
            target: this.contentEl,
            props: {
                canBeExclusive: this.canBeExclusive,
                condition: this.condition,
            },
        });

        this.buttonsEl = this.contentEl.createDiv(
            "calendarium-context-buttons setting-item"
        );
        new ButtonComponent(this.buttonsEl)
            .setCta()
            .setButtonText("Cancel")
            .onClick(() => {
                this.saved = false;
                this.close();
            });
    }
    old() {
        new Setting(this.contentEl)
            .setName("Interval")
            .setDesc("How often the condition applies.")
            .addText((t) => {
                t.inputEl.setAttr("type", "number");
                t.setValue(`${this.condition.interval}`).onChange((v) => {
                    if (isNaN(Number(v))) return;
                    this.condition.interval = Number(v);
                });
            });

        new Setting(this.contentEl)
            .setName("Exclusive")
            .setDesc(
                "If true, the leap day will not apply when the year meets the condition.\n\nRequires the leap day to have at least one non-exclusive condition."
            )

            .addToggle((t) =>
                t
                    .setDisabled(!this.canBeExclusive)
                    .setValue(this.condition.exclusive ?? false)
                    .onChange((v) => (this.condition.exclusive = v))
            );
        new Setting(this.contentEl)
            .setName("Ignore offset")
            .setDesc(
                "The condition will ignore the leap day's offset when checking to apply."
            )
            .addToggle((t) =>
                t
                    .setValue(this.condition.ignore ?? false)
                    .onChange((v) => (this.condition.ignore = v))
            );
    }
}
