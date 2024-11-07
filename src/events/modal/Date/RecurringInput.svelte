<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import type { CalEvent, CalEventDate, UndatedCalDate } from "src/schemas";
    import { TRASH, setNodeIcon } from "src/utils/icons";
    import type { Readable, Writable } from "svelte/store";

    export let event: Writable<CalEvent>;
    export let field: keyof CalEventDate;
    export let placeholder: string;

    let bit = $event.date[field] as [number, number];

    const removeRecurring = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(TRASH)
            .setTooltip("Make recurring");
    };
</script>

<input type="number" spellcheck="false" bind:value={bit[0]} {placeholder} />

<div class="recurring">
    <div use:setNodeIcon={"corner-down-right"} />
    <input type="number" spellcheck="false" {placeholder} bind:value={bit[1]} />
    <div
        use:removeRecurring
        on:click={() => {
            $event.date[field] = bit[0];
        }}
    />
</div>

<style scoped>
    .recurring {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    .recurring input {
        width: 100%;
    }
</style>
