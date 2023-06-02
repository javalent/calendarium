<script lang="ts">
    import { ViewState } from "src/stores/calendar.store";
    import { getTypedContext } from "../../view";
    import Day from "../Day/Day.svelte";
    import Weekdays from "../Week/Weekdays.svelte";
    import Week from "../Week/Week.svelte";

    export let year: number;
    export let month: number;

    const global = getTypedContext("store");
    const ephemeral = getTypedContext("ephemeralStore");
    const full = getTypedContext("full");
    $: store = $global;
    $: yearCalculator = store.yearCalculator;
    $: displayWeeks = $ephemeral.displayWeeks;
    $: viewState = $ephemeral.viewState;

    $: displayedMonth = yearCalculator
        .getYearFromCache(year)
        .getMonthFromCache(month);
    $: ({ weekdays, weeks } = displayedMonth);
    $: weekArray = displayedMonth.daysAsWeeks;
</script>

{#if $viewState == ViewState.Year}
    <h4 class="calendarium month-header">{displayedMonth.name}</h4>
{/if}
<div
    class="calendarium month-container"
    class:full={$full}
    style="--calendar-columns: {$weekdays.length +
        ($displayWeeks ? 1 : 0)};--calendar-row-size: {$full
        ? `${(1 / $weeks) * 100}%`
        : '1fr'}; --calendar-row-count: {$weeks}"
>
    <Weekdays {year} {month} />
    <div class="calendarium month">
        {#each $weekArray as week}
            <Week {month} {year} dayArray={week} />
        {/each}
    </div>
</div>

<style scoped>
    .month-container {
        height: min-content;
    }

    .month-header {
        margin: 0;
    }
    .month {
        width: 100%;
        display: grid;
        grid-template-rows: repeat(
            var(--calendar-row-count),
            var(--calendar-row-size)
        );
    }
    .full {
        height: 100%;
    }
</style>
