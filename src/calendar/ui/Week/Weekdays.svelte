<script lang="ts">
    import { getTypedContext } from "src/calendar/view.utils";
    import { getAbbreviation } from "src/utils/functions";

    export let year: number;
    export let month: number;

    const global = getTypedContext("store");
    const ephemeral = getTypedContext("ephemeralStore");
    $: displayWeeks = $ephemeral.displayWeeks;

    $: store = $global;
    $: yearCalculator = store.yearCalculator;
    $: displayedMonth = yearCalculator
        .getYearFromCache(year)
        .getMonthFromCache(month);
    $: weekdays = displayedMonth.weekdays;
</script>

<div class="weekday-container calendarium">
    {#if $displayWeeks}
        <div class="weekday week-number calendarium">
            <span>W</span>
        </div>
    {/if}
    {#each $weekdays as day}
        <div class="weekday calendarium">
            {getAbbreviation(day)}
        </div>
    {/each}
</div>

<style scoped>
    .weekday-container {
        display: grid;
        grid-template-columns: repeat(var(--calendar-columns), 1fr);
        text-align: center;
    }
    .week-number {
        border-right: 1px solid var(--blockquote-border-color);
        margin-right: 0.25rem;
    }
    .weekday {
        background-color: var(--color-background-heading);
        color: var(--color-text-heading);
        font-size: 0.6em;
        letter-spacing: 1px;
        padding: 4px;
        text-transform: uppercase;
    }
</style>
