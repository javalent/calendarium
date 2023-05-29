<script lang="ts">
    import { getTypedContext } from "../view";
    import Dot from "./Dot.svelte";
    import type { FcEvent, FcEventCategory } from "src/@types";

    export let events: FcEvent[] = [];

    const store = getTypedContext("store");
    const { categories } = $store;

    const color = (event: FcEvent) => {
        return $categories.find((c) => c.id == event.category)?.color;
    };
    $: overflow = Math.max(events.length - 3, 0);
</script>

<div class="dots-container">
    <div class="dot-container centered">
        {#each events.slice(0, 3) as event}
            <Dot color={color(event)} />
        {/each}
    </div>
    <div class="overflow">
        {#if overflow > 0}
            <span>+{overflow}</span>
        {/if}
    </div>
</div>

<style>
    .dots-container {
        width: 100%;
    }
    .dot-container {
        display: flex;
        flex-flow: row nowrap;
        gap: 2px;
        margin: auto;
        line-height: 6px;
        min-height: 6px;
    }
    .centered {
        justify-content: center;
        align-items: center;
    }
    .overflow {
        color: var(--text-muted);
        font-size: xx-small;
        display: flex;
        justify-content: flex-end;
        width: 100%;
        line-height: 1.25;
    }
</style>
