import {
    Component,
    Editor,
    type EditorPosition,
    EditorSuggest,
    type EditorSuggestContext,
    type EditorSuggestTriggerInfo,
    TFile,
    parseYaml,
    type MarkdownPostProcessorContext,
    MarkdownRenderChild,
    Notice,
} from "obsidian";
import type { CalendariumCodeBlockParameters } from "src/@types";
import Calendarium from "src/main";

import Ui from "./ui/UI.svelte";
import { nanoid } from "src/utils/functions";
import type { CalendarStore } from "src/stores/calendar.store";
import { ViewType, type ViewParent } from "./view.types";
export class CodeBlockService extends Component {
    constructor(public plugin: Calendarium) {
        super();
    }

    onload(): void {
        this.plugin.registerMarkdownCodeBlockProcessor(
            "calendarium",
            (source, el, ctx) => {
                this.postProcess(source, el, ctx);
            }
        );
        this.plugin.registerEditorSuggest(
            new CalendariumEditorSuggester(this.plugin)
        );
    }
    postProcess(
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) {
        ctx.addChild(new CodeBlockContainer(this.plugin, source, el));
    }
}

class CodeBlockContainer extends MarkdownRenderChild implements ViewParent {
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

export class CalendariumEditorSuggester extends EditorSuggest<string> {
    constructor(public plugin: Calendarium) {
        super(plugin.app);
    }
    getSuggestions(ctx: EditorSuggestContext) {
        return this.plugin.calendars
            .map((c) => c.name)
            .filter((p) => p.toLowerCase().contains(ctx.query.toLowerCase()));
    }
    renderSuggestion(text: string, el: HTMLElement) {
        el.createSpan({ text });
    }
    selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
        if (!this.context) return;

        const line = this.context.editor
            .getLine(this.context.end.line)
            .slice(this.context.end.ch);
        const [_, exists] = line.match(/^(\] ?)/) ?? [];

        this.context.editor.replaceRange(
            `${value}\n`,
            this.context.start,
            {
                ...this.context.end,
                ch:
                    this.context.start.ch +
                    this.context.query.length +
                    (exists?.length ?? 0),
            },
            "calendarium"
        );

        this.context.editor.setCursor(
            this.context.start.line,
            this.context.start.ch + value.length
        );

        this.close();
    }
    onTrigger(
        cursor: EditorPosition,
        editor: Editor,
        file: TFile
    ): EditorSuggestTriggerInfo | null {
        const range = editor.getRange({ line: 0, ch: 0 }, cursor);

        if (range.indexOf("```calendarium\n") === -1) return null;

        const split = range.split("\n").reverse();

        let inBlock = false;
        for (const line of split) {
            if (/^```$/.test(line)) return null;
            if (/^```calendarium/.test(line)) {
                inBlock = true;
                break;
            }
        }
        if (!inBlock) return null;

        const line = editor.getLine(cursor.line);
        //not inside the bracket

        if (!/^calendar:/m.test(line.slice(0, cursor.ch))) return null;

        const match = line.match(/^calendar:(.+)\n?/);
        if (!match) return null;

        const [_, query] = match;

        if (
            this.plugin.calendars
                .map((c) => c.name)
                .find((p) => p.toLowerCase() == query?.toLowerCase())
        ) {
            return null;
        }
        const matchData = {
            end: cursor,
            start: {
                ch: "calendar".length + 2,
                line: cursor.line,
            },
            query,
        };
        return matchData;
    }
}
