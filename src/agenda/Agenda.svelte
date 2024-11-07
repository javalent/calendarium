<script lang="ts">
    import { getTypedContext } from "src/calendar/view.utils";
    import Flags from "../calendar/ui/Events/Flags.svelte";
    import MoonUI from "../calendar/ui/Moon.svelte";
    import { dateString } from "src/utils/functions";
    import {
        CALENDAR_SEARCH,
        LEFT,
        RIGHT,
        setClickableIcon,
    } from "src/utils/icons";
    import { derived, get } from "svelte/store";

    const store = getTypedContext("store");
    const parent = getTypedContext("parent");

    $: calendar = $store;
    $: ephemeral = $store.getEphemeralStore(parent);
    $: ephViewing = ephemeral.viewing;
    $: {
        if (!$ephViewing) {
            $ephViewing = { ...get($store.current) };
        }
    }
    $: viewing = derived([ephemeral.viewing], ([view]) => view!);
    $: date = dateString($viewing!, $calendar);
    $: yearCalculator = $store.yearCalculator;
    $: displayedMonth = yearCalculator
        .getYearFromCache($viewing!.year)
        .getMonthFromCache($viewing!.month);
    $: daysBeforeMonth = displayedMonth.daysBefore;
    $: daysBeforeDay = $daysBeforeMonth + $viewing!.day;
    $: events = $store.getEventsForDate($viewing!);
    $: moons = $store.moonCache.getItemsOrRecalculate($viewing!);
    $: displayDayNumber = ephemeral.displayDayNumber;
    $: displayMoons = ephemeral.displayMoons;

    /* onDestroy(() => {
        ephemeral.viewing.set(null);
    }); */
</script>

<div class="day-view">
    <div class="nav">
        <div style="flex: 1;">
            <div
                use:setClickableIcon={CALENDAR_SEARCH}
                aria-label="Reveal on Calendar"
                on:click={() => {
                    ephemeral.displayDate($viewing);
                }}
            />
        </div>
        <div class="date">
            <div
                class="arrow"
                use:setClickableIcon={LEFT}
                aria-label="Previous"
                on:click={() => {
                    ephemeral.goToPreviousDay();
                    ephemeral.displayDate($viewing);
                }}
            ></div>

            <div class="title-container">
                <h5 class="calendarium-title title">
                    <span class="current">{date}</span>
                </h5>
                {#if $displayDayNumber}
                    <div class="day-number">
                        <em> Day {daysBeforeDay} </em>
                    </div>
                {/if}
            </div>
            <div
                class="arrow"
                use:setClickableIcon={RIGHT}
                aria-label="Next"
                on:click={() => {
                    ephemeral.goToNextDay();
                    ephemeral.displayDate($viewing);
                }}
            ></div>
        </div>
        <div style="flex: 1;" />
    </div>

    <div class="context">
        {#if $displayMoons}
            <div class="moon-container">
                {#each $moons as moon}
                    <MoonUI {moon} />
                {/each}
            </div>
        {/if}
    </div>
    {#key $events}
        {#if $viewing}
            <Flags
                events={$events}
                dayView={true}
                on:event-click
                on:event-mouseover
                on:event-context
            />
        {/if}
    {/key}
</div>

<style>
    .day-view {
        padding: 5px 15px;
        display: flex;
        flex-flow: column nowrap;
        gap: 0.5rem;
        min-height: 300px;
    }
    .nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .date {
        --icon-size: var(--icon-s);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.25rem;
    }

    /*     .day-view :global(.flag-container > .flag) {
        padding-left: 0.5rem;
    } */

    .title-container {
        display: flex;
        flex-flow: column nowrap;
        align-items: center;
        justify-content: center;
    }
    .title {
        margin: 0;
    }
    .day-number {
        font-size: x-small;
    }
    .moon-container {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
