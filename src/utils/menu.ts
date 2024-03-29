import { Component, Menu } from "obsidian";
import type Calendarium from "src/main";

export default class CalendariumMenu extends Menu {
    constructor(component: Component) {
        super();
        component.register(() => super.close());
    }
}
