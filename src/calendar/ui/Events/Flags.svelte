<script lang="ts">
    import Flag from "./Flag.svelte";
    import type { CalDate, CalEvent } from "src/@types";
    import { getTypedContext } from "../../view";
    import { sortEventList } from "src/utils/functions";
    import { onMount } from "svelte";

    export let events: CalEvent[] = [];
    export let dayView: boolean = false;
    export let date: CalDate;

    const store = getTypedContext("store");

    let height: number;
    let target: Element;

    $: events = sortEventList([...events]);

    let overflow: number = 0;
    let previousHeight = 0;

    const addEvents = () => {
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
            let remaining = height;

            for (const event of events) {
                new Flag({
                    target,
                    props: {
                        event,
                        dayView,
                        /* date, */
                    },
                });
                if (!dayView) {
                    remaining =
                        height -
                        Array.from(target.children).reduce(
                            (a, b) => b.getBoundingClientRect().height + a,
                            0,
                        );
                    if (remaining < 0 && height != 0) {
                        target.lastElementChild?.detach();
                        overflow = events.length - events.indexOf(event);
                        break;
                    } else if (remaining == 0) {
                        overflow = events.length - events.indexOf(event) - 1;
                        break;
                    }
                }
            }
        }
    };

    let container: HTMLElement;
    const observer = new ResizeObserver((entries) => {
        height = entries[0].contentRect?.height;
        target = entries[0]?.target;
    });
    $: {
        if ((dayView || (height != undefined && target)) && events) {
            addEvents();
        }
    }
    onMount(() => {
        observer.observe(container);
    });
</script>

<div class="flags-container">
    <div class="flag-container" bind:this={container} />
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
