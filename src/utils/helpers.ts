import { setIcon } from "obsidian";

export function setNodeIcon(node: HTMLElement, icon: string) {
    node.addClass("has-node-icon");
    setIcon(node, icon);
}
