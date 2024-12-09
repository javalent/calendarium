import { FuzzyInputSuggest } from "@javalent/utilities";
import {
    setIcon,
    type App,
    type SearchComponent,
    type TextComponent,
    type FuzzyMatch,
} from "obsidian";

export class IconSuggester extends FuzzyInputSuggest<string> {
    renderNote(noteEL: HTMLElement, result: FuzzyMatch<string>): void {}
    renderTitle(titleEl: HTMLElement, result: FuzzyMatch<string>): void {
        this.renderMatches(titleEl, result.item, result.match.matches);
    }
    renderFlair(flairEl: HTMLElement, result: FuzzyMatch<string>): void {
        setIcon(flairEl, result.item);
    }
    getItemText(item: string) {
        return item;
    }
}
