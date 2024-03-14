<script lang="ts">
    import { EventType } from "src/events/event.types";
    import type { CalEvent } from "src/schemas";
    import DateWithValidation from "src/settings/creator/Utilities/DateWithValidation.svelte";
    import { writable } from "svelte/store";

    export let event: CalEvent;

    const type = writable(event.type ?? EventType.Date);
</script>

<div class="setting-item">
    <div class="setting-item-info">
        <div class="setting-item-name">Event type</div>
    </div>
    <div class="setting-item-control">
        <select class="dropdown" bind:value={$type}>
            {#each Object.entries(EventType) as [label, eType]}
                <option value={eType} selected={eType === $type}>{label}</option
                >
            {/each}
        </select>
    </div>
    {#if $type == EventType.Date}
        <DateWithValidation />
    {/if}
</div>
