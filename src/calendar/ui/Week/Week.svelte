<script lang="ts">
    import { getTypedContext } from "src/calendar/view";
    import Day from "../Day/Day.svelte";
    import { wrap } from "src/utils/functions";
    import { get } from "svelte/store";

    export let year: number;
    export let month: number;
    export let startingDay: number;

    const global = getTypedContext("store");
    const ephemeral = getTypedContext("ephemeralStore");

    $: store = $global;
    $: yearCalculator = store.yearCalculator;
    $: displayWeeks = $ephemeral.displayWeeks;
    $: displayedMonth = yearCalculator
        .getYearFromCache(year)
        .getMonthFromCache(month);
    $: days = displayedMonth.days;
    $: firstDay = displayedMonth.firstDay;
    $: firstWeekNumber = displayedMonth.firstWeekNumber;
    $: weekdays = displayedMonth.weekdays;

    $: previousMonth = $ephemeral.getPreviousMonth(month, year);
    $: nextMonth = $ephemeral.getNextMonth(month, year);

    //not zero indexed, need to subtract one
    $: currentWeekday = wrap(startingDay + $firstDay, $weekdays.length);

    $: week = [...Array($weekdays.length).keys()].map(
        (k) => startingDay + k - currentWeekday + 1
    );
    $: weekNumber =
        $firstWeekNumber +
        Math.ceil(($firstDay + startingDay) / $weekdays.length) +
        1;

    const getMonth = (number: number) => {
        if (number <= 0)
            return {
                month: previousMonth,
                number: get(previousMonth.days) + number,
                adjacent: true,
            };
        if (number > $days) {
            return {
                month: nextMonth,
                number: number - $days,
                adjacent: true,
            };
        }
        return {
            month: displayedMonth,
            number,
            adjacent: false,
        };
    };
</script>

<div class="week calendarium">
    {#if $displayWeeks}
        <span class="week-number">{weekNumber}</span>
    {/if}
    {#each week as day}
        <Day {...getMonth(day)} />
    {/each}
</div>

<style scoped>
    .week {
        display: grid;
        grid-template-columns: repeat(var(--calendar-columns), 1fr);
        text-align: center;
    }
    .week-number {
        border-right: 1px solid var(--blockquote-border-color);
        background-color: transparent;
        padding-bottom: 6px;
        margin-right: 0.25rem;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.65em;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
