import type { Component, ViewState } from "obsidian";
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
        userInitiated?: boolean;
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
            eState?: ViewParent
        ): Promise<void>;
    }
}

export interface CalendarContext {
    store: Writable<CalendarStore>;
    view: ViewParent;
    plugin: Calendarium;
    ephemeralStore: Writable<EphemeralStore>;
    full: Writable<boolean>;
    monthInFrame: Writable<number | null>;
}

export interface ViewParent extends Component {
    plugin: Calendarium;
    child: string | null;
    id: string;
    calendar: string;
    store: CalendarStore | null;
    getViewType: () => string;
    switchCalendar: (calendar: string) => void;
}


