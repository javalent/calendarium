<script lang="ts">
    import { dateString } from "src/utils/functions";
    import type { Era } from "src/schemas/calendar/timespans";
    import { getContext } from "svelte";
    import EditableItem from "../../Utilities/EditableItem.svelte";

    export let era: Era;

    const store = getContext("store");
</script>

<EditableItem on:delete on:edit>
    <div slot="name">{era.name}</div>
    <div slot="desc" class="desc">
        <span
            >{#if "isStartingEra" in era && era.isStartingEra}Starting era{:else if "date" in era}{dateString(
                    era.date,
                    $store,
                    era.end,
                )}{/if}</span
        >
        <span class="clamp">{era.description ?? ""}</span>
    </div>
</EditableItem>

<style>
    .desc {
        display: flex;
        align-items: flex-start;
        flex-flow: column;
        gap: 0.5rem;
    }
    .clamp {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        word-break: keep-all;
        overflow: hidden;
        width: calc(var(--event-max-width) * 0.75);
    }
</style>
