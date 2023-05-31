<script lang="ts">
    import Flag from "./Flag.svelte";
    import type { FcDate, FcEvent } from "src/@types";
    import { getTypedContext } from "../../view";
    import { sortEventList } from "src/utils/functions";
    import { createEventDispatcher, onMount } from "svelte";
    import { debounce } from "obsidian";

    export let events: FcEvent[] = [];
    export let dayView: boolean = false;
    export let date: FcDate;

    const store = getTypedContext("store");
    const { categories } = $store;

    $: events = sortEventList([...events]);
    let overflow: number = 0;
    let previousHeight = 0;

    const addEvents = (height: number, target: Element) => {
        if (events.length && target) {
            if (
                !dayView &&
                (height == null ||
                    Math.floor(height) == Math.floor(previousHeight))
            )
                return;
            previousHeight = height;
            target.empty();
            overflow = 0;
            let added = 0;

            for (const event of events) {
                const flag = new Flag({
                    target,
                    props: {
                        event,
                        categories: $categories,
                        dayView,
                        date,
                    },
                });
                console.log(flag);
                /* if (!dayView) {
                    remaining += flag.$$..height;
                    if (remaining < 0) {
                        entry.target.lastElementChild.detach();
                        overflow = events.length - events.indexOf(event);
                        break;
                    } else if (remaining == 0) {
                        overflow = events.length - events.indexOf(event) - 1;
                        break;
                    }
                } */
            }
        }
    };

    let container: HTMLElement;
    const observer = new ResizeObserver(
        debounce(
            (entries) =>
                addEvents(entries[0].contentRect?.height, entries[0]?.target),
            25
        )
    );
    onMount(() => {
        /* 
        addEvents(container.getBoundingClientRect()?.height, container); */
        observer.observe(container);
    });
</script>

<div class="flags-container">
    {#key events}
        <div class="flag-container" bind:this={container} />
        <!-- {#each events.slice(0, 3) as event}
                <Flag
                    {event}
                    categories={$categories}
                    {dayView}
                    {date}
                    on:event-click
                    on:event-mouseover
                    on:event-context
                />
            {/each} -->
    {/key}
    <div class="overflow">
        {#if overflow > 0}
            <span>+{overflow}</span>
        {/if}
    </div>
</div>

<style>
    .flags-container,
    .flag-container {
        height: 100%;
        display: flex;
        flex-flow: column nowrap;
        gap: 0.25rem;
        overflow: hidden;
    }

    .overflow {
        color: var(--text-muted);
        justify-self: flex-end;
        display: flex;
        justify-content: flex-end;
        width: 100%;
    }
</style>
