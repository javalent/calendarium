import {
    EditorSuggest,
    type EditorSuggestContext,
    type EditorPosition,
    Editor,
    TFile,
    type EditorSuggestTriggerInfo,
} from "obsidian";
import type Calendarium from "src/main";

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
