import { getContext } from "svelte";
import { setContext } from "svelte";
import type { AgendaView } from "./view";
import type { ViewState } from "obsidian";
import type Calendarium from "src/main";
import type {
    CalendarStoreState,
    CalendarStore,
    EphemeralStore,
} from "src/stores/calendar.store";
import type { Writable } from "svelte/store";

export const ViewType = {
    Calendarium: "CALENDARIUM",
    Agenda: "CALENDARIUM_AGENDA",
} as const;

export type ViewType = (typeof ViewType)[keyof typeof ViewType];

export interface CalendariumViewStates {
    [ViewType.Calendarium]: CalendarStoreState;
    [ViewType.Agenda]: {
        calendar: string;
        parent: string;
        id?: string;
    };
}

interface TypedViewState<T extends ViewType> extends ViewState {
    type: T;
    state: CalendariumViewStates[T];
}

declare module "obsidian" {
    interface WorkspaceLeaf {
        setViewState<T extends ViewType>(
            viewState: TypedViewState<T>,
            eState?: any
        ): Promise<void>;
    }
}

interface CalendarContext {
    store: Writable<CalendarStore>;
    view: ViewParent;
    plugin: Calendarium;
    ephemeralStore: Writable<EphemeralStore>;
    full: Writable<boolean>;
    monthInFrame: Writable<number | null>;
}

export interface ViewParent {
    child: AgendaView | null;
    id: string;
    calendar: string;
    store: CalendarStore | null;
}

export function setTypedContext<T extends keyof CalendarContext>(
    key: T,
    value: CalendarContext[T]
): void {
    setContext(key, value);
}

export function getTypedContext<T extends keyof CalendarContext>(
    key: T
): CalendarContext[T] {
    return getContext(key);
}
