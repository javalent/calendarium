import { App, Setting, Notice } from "obsidian";
import type { Calendar } from "../../@types";

import { nanoid } from "../../utils/functions";
import { CalendariumModal } from "./modal";
import type { Moon } from "src/schemas/calendar/moons";

export class CreateMoonModal extends CalendariumModal {
    saved = false;
    moon: Moon = {
        name: "",
        cycle: 0,
        offset: 0,
        faceColor: "#fff",
        shadowColor: "#000",
        id: nanoid(6),
    };
    editing: boolean;
    infoEl: HTMLDivElement;
    constructor(app: App, public calendar: Calendar, moon?: Moon) {
        super(app);
        if (moon) {
            this.moon = { ...moon };
            this.editing = true;
        }
        this.containerEl.addClass("calendarium-create-moon");
    }

    async display() {
        this.contentEl.empty();
        this.contentEl.createEl("h3", {
            text: this.editing ? "Edit Moon" : "New Moon",
        });

        this.infoEl = this.contentEl.createDiv("moon-info");
        this.buildInfo();

        new Setting(this.contentEl)
            .addButton((b) => {
                b.setButtonText("Save")
                    .setCta()
                    .onClick(() => {
                        if (!this.moon.name?.length) {
                            new Notice("The moon must have a name.");
                            return;
                        }
                        if (!this.moon.cycle) {
                            new Notice("The moon must have a positive cycle.");
                            return;
                        }
                        this.saved = true;
                        this.close();
                    });
            })
            .addExtraButton((b) => {
                b.setIcon("cross")
                    .setTooltip("Cancel")
                    .onClick(() => this.close());
            });
    }
    buildInfo() {
        this.infoEl.empty();

        new Setting(this.infoEl).setName("Name").addText((t) => {
            t.setValue(this.moon.name).onChange((v) => {
                this.moon.name = v;
            });
        });
        new Setting(this.infoEl)
            .setName("Cycle")
            .setDesc(
                "How many days it takes for the moon to complete a full cycle."
            )
            .addText((t) => {
                t.inputEl.setAttr("type", "number");
                t.setValue(`${this.moon.cycle}`).onChange((v) => {
                    if (isNaN(Number(v))) return;
                    this.moon.cycle = Number(v);
                });
            });
        new Setting(this.infoEl)
            .setName("Offset")
            .setDesc("Shift the starting moon phase by a number of days.")
            .addText((t) => {
                t.inputEl.setAttr("type", "number");
                t.setValue(`${this.moon.offset}`).onChange((v) => {
                    if (isNaN(Number(v))) return;
                    this.moon.offset = Number(v);
                });
            });

        new Setting(this.infoEl).setName("Face color").addText((t) => {
            t.inputEl.setAttr("type", "color");
            t.setValue(this.moon.faceColor).onChange((v) => {
                this.moon.faceColor = v;
            });
        });

        new Setting(this.infoEl).setName("Shadow color").addText((t) => {
            t.inputEl.setAttr("type", "color");
            t.setValue(this.moon.shadowColor).onChange((v) => {
                this.moon.shadowColor = v;
            });
        });
    }
    async onOpen() {
        await this.display();
    }
}
