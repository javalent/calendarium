import "obsidian";

declare module "obsidian" {
    interface App {
        internalPlugins: {
            getPluginById(id: "daily-notes"): {
                _loaded: boolean;
                instance: {
                    options: {
                        format: string;
                    };
                };
            };
            getPluginById(id: "sync"): {
                _loaded: boolean;
                instance: Events & {
                    getStatus():
                        | "error"
                        | "paused"
                        | "syncing"
                        | "uninitialized"
                        | "synced";
                    on(name: "status-change", callback: () => any): EventRef;
                };
            };
            getPluginById(id: "page-preview"): {
                _loaded: boolean;
            };
        };
        setting: {
            open(): void;
            close(): void;
            openTabById(id: string): CalendariumSettings;
        };

        plugins: {
            plugins: {
                "fantasy-calendar": Plugin;
            };
        };
    }
    interface Workspace {
        trigger(name: "parse-style-settings"): void; // trigger style settings
        on(name: "calendarium-updated", callback: () => any): EventRef;
        on(
            name: "calendarium-event-update",
            callback: (tree: CalendarEventTree) => any
        ): EventRef;
        on(name: "calendarium-settings-change", callback: () => any): EventRef;
        trigger(name: "calendarium-updated"): void;
        trigger(name: "calendarium-settings-change"): void;
        trigger(name: "calendarium-settings-external-load"): void;
        trigger(
            name: "calendarium-event-update",
            tree: CalendarEventTree
        ): void;
        trigger(
            name: "link-hover",
            popover: any, //hover popover, but don't need
            target: HTMLElement, //targetEl
            note: string, //linkText
            source: string //source
        ): void;
        trigger(name: "calendarium-settings-loaded"): void;
        on(name: "calendarium-settings-loaded", callback: () => any): EventRef;
        on(
            name: "calendarium-settings-external-load",
            callback: () => any
        ): EventRef;

        trigger(
            name: "calendarium:view-parent:change-calendar",
            data: { parent: string; calendar: string }
        ): void;
        on(
            name: "calendarium:view-parent:change-calendar",
            callback: (data: { parent: string; calendar: string }) => any
        ): EventRef;
    }
    interface View {
        protected close(): void;
    }
}
