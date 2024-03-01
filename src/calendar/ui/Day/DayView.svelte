<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import Flags from "../Events/Flags.svelte";
    import MoonUI from "../Moon.svelte";
    import { getTypedContext } from "../../view";
    import { dateString } from "src/utils/functions";
    import {
        ADD_EVENT,
        CALENDAR_SEARCH,
        CLOSE,
        LEFT,
        RIGHT,
        setClickableIcon,
        setNodeIcon,
    } from "src/utils/icons";
    import { addEventWithModal } from "src/settings/modals/event/event";
    import { derived } from "svelte/store";

    const global = getTypedContext("store");
    const plugin = getTypedContext("plugin");
    const ephemeral = getTypedContext("ephemeralStore");
    $: store = $global;
    const viewing = derived([$ephemeral.viewing], ([view]) => view!);
    $: date = dateString($viewing!, $store);
    $: yearCalculator = store.yearCalculator;
    $: displayedMonth = yearCalculator
        .getYearFromCache($viewing!.year)
        .getMonthFromCache($viewing!.month);
    $: daysBeforeMonth = displayedMonth.daysBefore;
    $: daysBeforeDay = $daysBeforeMonth + $viewing!.day;
    $: events = store.eventStore.getEventsForDate($viewing!);
    $: moons = store.moonCache.getItemsOrRecalculate($viewing!);
    $: displayDayNumber = $ephemeral.displayDayNumber;
    $: displayMoons = $ephemeral.displayMoons;

    const close = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(CLOSE).setTooltip("Close");
    };
    const reveal = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(CALENDAR_SEARCH)
            .setTooltip("Reveal");
    };
    const event = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(ADD_EVENT)
            .setTooltip("New event");
    };
</script>

<div class="day-view">
    <hr />
    <div class="nav">
        <div
            use:setClickableIcon={CALENDAR_SEARCH}
            aria-label="Reveal"
            on:click={() => {
                $ephemeral.displayDate($viewing);
            }}
        />
        <div class="date">
            <div
                class="arrow"
                use:setClickableIcon={LEFT}
                aria-label="Previous"
                on:click={() => {
                    $ephemeral.goToPreviousDay();

                    $ephemeral.displayDate($viewing);
                }}
            ></div>

            <div class="title-container">
                <h5 class="calendarium-title title">
                    <span class="current">{date}</span>
                </h5>
                {#if displayDayNumber}
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
                    $ephemeral.goToNextDay();
                    $ephemeral.displayDate($viewing);
                }}
            ></div>
        </div>
        <!-- <div class="actions">
            <div
                use:event
                on:click={() => addEventWithModal(plugin, $store, $viewing)}
            />
        </div> -->
        <div use:close on:click={() => $ephemeral.viewing.set(null)} />
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
    hr {
        margin: 0.5em 0;
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
