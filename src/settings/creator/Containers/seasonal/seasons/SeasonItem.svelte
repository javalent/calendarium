<script lang="ts">
    import type { Calendar } from "src/schemas";
    import { type Season, SeasonType } from "src/schemas/calendar/seasonal";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import EditableItem from "src/settings/creator/Utilities/EditableItem.svelte";
    import { dateString } from "src/utils/functions";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";

    const calendar = getContext<Writable<Calendar>>("store");

    export let item: Season;
</script>

<div class="season" style="--season-color: {item.color}">
    <SettingItem>
        <div slot="name">{item.name}</div>

        <div slot="desc">
            {#if item.type === SeasonType.PERIODIC}
                <span
                    >{item.duration}
                    {#if item.peak}(peak: {item.peak}){/if}</span
                >
            {/if}
            {#if item.type === SeasonType.DATED}
                <span
                    >{dateString(
                        { month: item.month, day: item.day, year: 0 },
                        $calendar,
                        null,
                        "MMMM D",
                    )}</span
                >
            {/if}
        </div>
    </SettingItem>
</div>

<style>
    .season {
        border-left: 1px solid var(--season-color);
        padding-left: 0.5rem;
    }
</style>
