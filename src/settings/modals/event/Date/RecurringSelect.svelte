<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import type { CalEvent, CalEventDate, UndatedCalDate } from "src/schemas";
    import { TRASH, setNodeIcon } from "src/utils/icons";
    import type { Readable, Writable } from "svelte/store";

    export let event: Writable<CalEvent>;
    export let field: keyof CalEventDate;
    export let items: string[];
    let bit = $event.date[field] as [number, number];

    const removeRecurring = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(TRASH)
            .setTooltip("Make recurring");
    };
</script>

<select class="dropdown" bind:value={bit[0]}>
    {#each [...items] as month, index}
        <option value={index}>{month}</option>
    {/each}
</select>
<div class="recurring">
    <div use:setNodeIcon={"corner-down-right"} />
    <select class="dropdown" bind:value={bit[1]}>
        {#each [...items] as month, index}
            <option value={index}>{month}</option>
        {/each}
    </select>

    <div
        use:removeRecurring
        on:click={() => {
            $event.date.month = bit[0];
        }}
    />
</div>

<style scoped>
    .recurring {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    .dropdown {
        width: 100%;
    }
</style>
