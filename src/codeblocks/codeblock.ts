import {
    Component,
    MarkdownRenderChild,
    type MarkdownPostProcessorContext,
} from "obsidian";
import Calendarium from "src/main";

import { CalendarContainer } from "./calendar/calendar";
import { CalendariumEditorSuggester } from "./editor-suggest";
import { WeatherContainer } from "./weather/weather";

export const CodeBlockType = {
    CALENDAR: "calendarium",
    WEATHER: "calendarium-weather",
} as const;
export type CodeBlockType = (typeof CodeBlockType)[keyof typeof CodeBlockType];

export class CodeBlockService extends Component {
    constructor(public plugin: Calendarium) {
        super();
    }

    onload(): void {
        this.plugin.registerMarkdownCodeBlockProcessor(
            CodeBlockType.CALENDAR,
            (source, el, ctx) => {
                this.postProcess(CodeBlockType.CALENDAR, source, el, ctx);
            }
        );
        this.plugin.registerMarkdownCodeBlockProcessor(
            CodeBlockType.WEATHER,
            (source, el, ctx) => {
                this.postProcess(CodeBlockType.WEATHER, source, el, ctx);
            }
        );
        this.plugin.registerEditorSuggest(
            new CalendariumEditorSuggester(this.plugin)
        );
    }
    postProcess(
        type: CodeBlockType,
        source: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) {
        let component: MarkdownRenderChild;
        switch (type) {
            case "calendarium": {
                component = new CalendarContainer(this.plugin, source, el);
                break;
            }
            case "calendarium-weather": {
                component = new WeatherContainer(this.plugin, source, el);
                break;
            }
        }
        ctx.addChild(component);
    }
}
