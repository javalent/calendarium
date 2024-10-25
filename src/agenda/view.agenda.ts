import { ItemView, WorkspaceLeaf, type ViewStateResult } from "obsidian";
import type Calendarium from "src/main";
import type { CalendarStore } from "src/stores/calendar.store";
import { nanoid } from "src/utils/functions";
import {
    type ViewParent,
    type CalendariumViewStates,
    ViewType,
} from "../calendar/view.types";
import UI from "./UI.svelte";
import CalendariumView from "../calendar/view";

export class AgendaView extends ItemView {
    navigation: boolean = false;
    store: CalendarStore | null;
    ui: UI;
    calendar: string;
    id: string = nanoid(12);
    parent: string;
    constructor(public leaf: WorkspaceLeaf, public plugin: Calendarium) {
        super(leaf);
    }
    protected async onOpen(): Promise<void> {
        this.registerEvent(
            this.plugin.app.workspace.on(
                "calendarium:view-parent:change-calendar",
                ({ parent, calendar }) => {
                    if (parent !== this.parent) return;
                    this.setStore(calendar);
                }
            )
        );
        this.plugin.registerEvent(
            this.app.workspace.on("calendarium-updated", () => {
                if (!this.plugin.hasCalendar(this.calendar)) {
                    this.calendar = this.plugin.defaultCalendar?.id;
                }
                this.store = this.plugin.getStore(this.calendar);
                this.ui.$set({ store: this.store });
            })
        );
    }
    async setState(
        state: CalendariumViewStates[typeof ViewType.Agenda],
        result: ViewStateResult
    ): Promise<void> {
        if (state.id) {
            this.id = state.id;
        }
        this.parent = state.parent;
        this.plugin.onLayoutReadyAndSettingsLoad(() => {
            this.setStore(state.calendar);
            if (!state.userInitiated) {
                //restored from state. try to find the parent
                const parentLeaves = this.plugin.app.workspace.getLeavesOfType(
                    ViewType.Calendarium
                );
                for (const leaf of parentLeaves) {
                    if (!(leaf.view instanceof CalendariumView)) continue;
                    if (leaf.view.id === this.parent) {
                        leaf.view.child = this.id;
                    }
                }
            }
        });
        super.setState(state, result);
    }
    setStore(calendar: string) {
        this.calendar = calendar;
        const store = this.plugin.getStore(calendar);
        if (store) {
            this.store = store;
            if (!this.ui) {
                this.ui = new UI({
                    target: this.contentEl,
                    props: {
                        store: this.store,
                        plugin: this.plugin,
                        parent: this.parent,
                    },
                });
            } else {
                this.ui.$set({ store: this.store });
            }
        }
    }
    getState() {
        return {
            calendar: this.calendar,
            id: this.id,
            parent: this.parent,
        };
    }
    display() {}
    getViewType(): string {
        return ViewType.Agenda;
    }
    getDisplayText(): string {
        return "Agenda";
    }
    getIcon() {
        return ViewType.Agenda;
    }
    protected async onClose(): Promise<void> {
        this.ui?.$destroy();
        super.onClose();
        this.store?.getEphemeralStore(this.parent).viewing.set(null);
    }
}

export async function openAgendaView(view: ViewParent): Promise<void> {
    if (!view.child) {
        let leaf = view.plugin.app.workspace.getRightLeaf(true);
        if (!leaf) return;
        await leaf.setViewState<typeof ViewType.Agenda>({
            type: ViewType.Agenda,
            state: {
                calendar: view.calendar,
                parent: view.id,
                userInitiated: true,
            },
        });
        if (!(leaf.view instanceof AgendaView)) return;
        leaf.view.parent = view.id;
        view.child = leaf.view.id;
        view.addChild(leaf.view);
        view.register(() => {
            leaf.detach();
        });
        leaf.view.register(() => (view.child = null));
    }
}
