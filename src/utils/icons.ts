import { ExtraButtonComponent, setIcon } from "obsidian";

export function setNodeIcon(node: HTMLElement, icon: string) {
    node.addClass("has-node-icon");
    setIcon(node, icon);
}
export function setClickableIcon(node: HTMLElement, icon: string) {
    new ExtraButtonComponent(node).setIcon(icon);
}

export const EVENT_LINKED_TO_NOTE = "sticky-note";
export const EVENT_FROM_FRONTMATTER = "file-symlink";

export const WARNING = "alert-triangle";
export const MOON_CYCLE = "orbit";
export const MOON_OFFSET = "arrow-big-right-dash";
export const INTERCALARY = "calendarium-between-horizontal-start";
export const MONTH = "calendar-days";
export const UNDO = "undo";
export const REDO = "redo";
export const RESET = "reset";

export const ADD = "plus-with-circle";
export const ADD_EVENT = "calendar-plus";
export const EDIT = "wrench";
export const TRASH = "trash";
export const IMPORT = "import";
export const LOADING = "loader-2";
export const CHECK = "check";
export const COLLAPSE = "chevron-right";
export const RESTORE = "archive-restore";
export const QUICK_CREATOR = "sparkles";
export const CUSTOM_CREATOR = "pencil-ruler";
export const GRIP = "grip-vertical";

export const SELECT_MULTIPLE = "chevrons-up-down";

export const LEFT = "left-arrow";
export const RIGHT = "right-arrow";
export const SETTINGS = "gear";
export const CLOSE = "cross";

export const CALENDAR_SEARCH = "calendar-search";
