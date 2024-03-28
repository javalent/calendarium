<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import type { CalEventDate } from "src/schemas";
    import { TRASH, setNodeIcon } from "src/utils/icons";
    import type { Writable } from "svelte/store";

    export let date: Writable<CalEventDate>;
    export let field: keyof CalEventDate;
    export let items: string[];
    let bit = $date[field] as [number, number];

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
            $date.month = bit[0];
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
