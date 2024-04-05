<svelte:options accessors />

<script lang="ts">
    import { TFile, setIcon } from "obsidian";

    import type { EventLike } from "src/@types";
    import {
        EVENT_FROM_FRONTMATTER,
        EVENT_LINKED_TO_NOTE,
        setNodeIcon,
    } from "src/utils/icons";
    import { createEventDispatcher } from "svelte";
    import { getTypedContext } from "../../view";
    import { ViewEventModal } from "../../event-modal";
    import { DEFAULT_CATEGORY_COLOR } from "src/utils/constants";
    import { addEventWithModal } from "src/settings/modals/event/event";
    import CalendariumMenu from "src/utils/menu";
    import { isCalEvent } from "src/events/event.types";
    import { formatEra } from "src/stores/cache/era-cache";
    import { isEra } from "src/schemas/enums";
    const dispatch = createEventDispatcher();

    export let event: EventLike;
    /* export let date: CalDate; */
    export let dayView: boolean = false;

    const plugin = getTypedContext("plugin");
    const store = getTypedContext("store");

    let multi = false,
        start = false,
        end = false,
        first = false;
    /*     $: {
        if (event.end != undefined && !dayView) {
            multi = true;
            start =
                date.day === event.date.day &&
                (event.date.month == undefined ||
                    date.month == event.date.month) &&
                (event.date.year == undefined || date.year === event.date.year);
            first = start || date.day == 1;
            end =
                date.day === event.end.day &&
                (event.end.month == undefined ||
                    date.month == event.end.month) &&
                (event.end.year == undefined || date.year === event.end.year);
            if (start && end) {
                multi = false;
                start = false;
                end = false;
            }
        }
    } */

    $: calendar = $store;
    $: categories = $store.categories;

    $: color =
        $categories?.find((c) => c.id == event.category)?.color ??
        DEFAULT_CATEGORY_COLOR;
    $: removeable = $store.eventStore.isRemovable(event.id);
    const note = (node: HTMLElement) => {
        if (removeable) {
            setIcon(node, EVENT_LINKED_TO_NOTE);
        } else {
            setIcon(node, EVENT_FROM_FRONTMATTER);
        }
    };

    const openNote = (evt: MouseEvent) => {
        if (event.note) {
            const note = event.note.endsWith(".md")
                ? event.note
                : `${event.note}.md`;
            const file = plugin.app.vault.getAbstractFileByPath(note);
            if (file && file instanceof TFile) {
                plugin.app.workspace.getLeaf().openFile(file);
            }
        } else {
            const modal = new ViewEventModal(event, plugin);
            modal.open();
        }
    };

    export let flag: HTMLElement | null = null;

    const contextMenu = (evt: MouseEvent) => {
        evt.stopPropagation();
        if (!isCalEvent(event)) return;
        const menu = new CalendariumMenu(plugin);
        if (removeable) {
            menu.addItem((item) =>
                item.setTitle("Edit event").onClick(() => {
                    if (!isCalEvent(event)) return;
                    addEventWithModal(plugin, $calendar, event.date, event);
                }),
            );
            menu.addItem((item) =>
                item.setTitle("Delete event").onClick(() => {
                    if (!isCalEvent(event)) return;
                    $store.eventStore.removeEvents(event);
                }),
            );
        }
        menu.showAtMouseEvent(evt);
    };
    const getName = (event: EventLike): string => {
        if (isEra(event) && !event.isStartingEra) {
            return formatEra(event, event.date.year);
        }
        return event.name;
    };
</script>

<!--  -->
<div
    bind:this={flag}
    class="flag"
    class:multi
    class:start
    class:end
    class:first
    class:day-view={dayView}
    aria-label={!dayView ? event.name : null}
    style="--hex-alpha: {color}40; --color:{color}"
    on:click={(evt) => {
        evt.stopPropagation();
        openNote(evt);
    }}
    on:mouseover={(evt) =>
        dispatch("event-mouseover", { target: evt.target, event })}
    on:focus={() => {}}
    on:contextmenu={contextMenu}
>
    <div class="flag-content">
        <span class:clamp={!dayView} class:day-view={dayView}>
            {getName(event)}</span
        >
        {#if event.note}
            <div class="note" use:note />
        {/if}
        {#if event.type === "era"}
            <div class="era" use:setNodeIcon={"calendar-range"} />
        {/if}
    </div>
</div>

<style>
    .flag {
        cursor: pointer;
        position: relative;
        padding-left: 0.125rem;
        text-align: left;
        width: 100%;

        background-color: var(--hex-alpha);
        border-left: 2px solid var(--color);
    }
    .flag-content {
        display: flex;
        gap: 0.25rem;
        align-items: flex-start;
        justify-content: space-between;
    }
    .day-view .flag-content {
        justify-content: space-between;
    }

    .clamp {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        word-break: keep-all;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .note {
        display: flex;
        align-self: center;
    }
    .multi {
        flex-shrink: 0;
        overflow: visible;
        width: unset;
    }
    .multi .clamp {
        -webkit-line-clamp: 1;
        overflow: visible;
    }
    .multi.start {
        margin-left: 0;
    }
    .multi.end {
        margin-right: 0;
    }
    .multi.first {
        overflow: visible;
        white-space: nowrap;
    }
    .multi:not(.first) {
        color: transparent;
        overflow: hidden;
    }
    .multi:not(.start) {
        border: 0;
        margin-left: -6px;
    }
    .multi:not(.end) {
        margin-right: -6px;
    }
    .start > .flag-content {
        justify-content: flex-start;
        gap: 1em;
    }
</style>
