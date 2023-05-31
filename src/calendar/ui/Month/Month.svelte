<script lang="ts">
    import { ViewState } from "src/stores/calendar.store";
    import { getTypedContext } from "../../view";
    import Day from "../Day/Day.svelte";

    export let year: number;
    export let month: number;

    const global = getTypedContext("store");
    const ephemeral = getTypedContext("ephemeralStore");
    const full = getTypedContext("full");
    $: store = $global;
    $: yearCalculator = store.yearCalculator;
    $: previousMonth = $ephemeral.getPreviousMonth(month, year);
    $: nextMonth = $ephemeral.getNextMonth(month, year);
    $: displayWeeks = $ephemeral.displayWeeks;
    $: viewState = $ephemeral.viewState;

    $: staticConfiguration = store.staticStore.staticConfiguration;
    $: displayedMonth = yearCalculator
        .getYearFromCache(year)
        .getMonthFromCache(month);
    $: ({ weekdays, days, lastDay, firstWeekNumber, weeks } = displayedMonth);
    $: ({ lastDay: previousLastDay, days: previousDays } = previousMonth);

    $: extraWeek = $weekdays.length - $lastDay <= $weekdays.length / 2 ? 1 : 0;
    const addDays = (target: HTMLElement) => {
        if ($staticConfiguration.overflow) {
            for (let i = 0; i < $previousLastDay; i++) {
                if ($viewState == ViewState.Year) {
                    target.createDiv();
                } else {
                    new Day({
                        target,
                        props: {
                            adjacent: true,
                            number: $previousDays - $previousLastDay + i + 1,
                            month: previousMonth,
                        },
                    });
                }
            }
        }
        for (let i = 0; i < $days; i++) {
            new Day({
                target,
                props: {
                    adjacent: false,
                    number: i + 1,
                    month: displayedMonth,
                },
            });
        }
        //-1 because its the index
        if ($staticConfiguration.overflow) {
            let remaining =
                $weekdays.length - $lastDay + extraWeek * $weekdays.length;
            for (let i = 0; i < remaining; i++) {
                if ($viewState == ViewState.Year) {
                    target.createDiv();
                } else {
                    new Day({
                        target,
                        props: {
                            adjacent: true,
                            number: i + 1,
                            month: nextMonth,
                        },
                    });
                }
            }
        }
    };
</script>

{#if $viewState == ViewState.Year}
    <h4 class="calendarium month-header">{displayedMonth.name}</h4>
{/if}
<div
    class="calendarium month-container"
    class:full={$full}
    style="--calendar-columns: {$weekdays.length};--calendar-rows: {$full
        ? `${(1 / $weeks) * 100}%`
        : '1fr'}; --calendar-row-count: {$weeks}"
>
    <div class="week-numbers-outer calendarium">
        {#if $displayWeeks}
            <div class="week-numbers-container calendarium">
                <div class="weekday week-number-header calendarium">
                    <span>W</span>
                </div>
                <div class="week-numbers calendarium">
                    {#each [...Array($weeks).keys()] as week}
                        <span class="week-number"
                            >{$firstWeekNumber + 1 + week}</span
                        >
                    {/each}
                </div>
            </div>
        {/if}
    </div>
    <div class="calendarium month">
        <div class="weekday-container calendarium">
            {#each $weekdays as day}
                <div class="weekday calendarium">
                    {day.name.slice(0, 3).toUpperCase()}
                </div>
            {/each}
        </div>

        <div class="day-container calendarium" use:addDays />
    </div>
</div>

<style scoped>
    .month-container {
        height: min-content;
        display: grid;
        grid-template-columns: auto 1fr;
    }
    .weekday-container {
        display: grid;
        grid-template-columns: repeat(var(--calendar-columns), 1fr);
        text-align: center;
    }
    .day-container {
        display: grid;
        grid-template-columns: repeat(var(--calendar-columns), 1fr);
        grid-template-rows: repeat(
            var(--calendar-row-count),
            var(--calendar-rows)
        );
    }
    .full {
        height: 100%;
    }
    .month-header {
        margin: 0;
    }
    .month {
        width: 100%;
        display: grid;
        grid-template-rows: auto 1fr;
    }
    .weekday {
        background-color: var(--color-background-heading);
        color: var(--color-text-heading);
        font-size: 0.6em;
        letter-spacing: 1px;
        padding: 4px;
        text-transform: uppercase;
    }
    .week-numbers-outer {
        height: 100%;
    }
    .week-numbers-container {
        height: 100%;
        border-right: 1px solid var(--blockquote-border-color);
        padding-right: 0.5rem;
        margin-right: 0.5rem;
        display: grid;
        grid-template-rows: auto 1fr;
    }
    .week-numbers {
        display: grid;
        grid-template-rows: repeat(var(--calendar-rows), 1fr);
        height: 100%;
    }
    .week-number {
        background-color: transparent;
        margin-bottom: 12px;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.65em;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
