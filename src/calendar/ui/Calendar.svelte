<script lang="ts">
    import Nav from "./Nav.svelte";
    import Month from "./Month/Month.svelte";
    import { ExtraButtonComponent, Menu } from "obsidian";
    import { getTypedContext } from "../view";
    import DayView from "./Day/DayView.svelte";
    import { ViewState } from "src/stores/calendar.store";
    import Year from "./Year/Year.svelte";
    import Week from "./Week/Week.svelte";
    import { writable } from "svelte/store";
    import Weekdays from "./Week/Weekdays.svelte";
    import { SELECT_MULTIPLE } from "src/utils/icons";

    const global = getTypedContext("store");
    const ephemeral = getTypedContext("ephemeralStore");
    const view = getTypedContext("view");
    const full = getTypedContext("full");
    $: store = $global;
    $: displaying = $ephemeral.displaying;
    $: displayWeeks = $ephemeral.displayWeeks;
    $: displayedMonth = $ephemeral.displayingMonth;
    $: daysAsWeeks = $displayedMonth.daysAsWeeks;
    $: firstWeekNumber = $displayedMonth.firstWeekNumber;
    $: weekdays = $displayedMonth.weekdays;
    $: weeks = $displayedMonth.weeks;
    $: viewState = $ephemeral.viewState;

    $: viewing = $ephemeral.viewing;

    const plugin = getTypedContext("plugin");
    let otherCalendars = writable(plugin.data.calendars);

    //don't like this... find a better way
    plugin.app.workspace.on(
        "calendarium-updated",
        () => ($otherCalendars = plugin.data.calendars),
    );

    const drop = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(SELECT_MULTIPLE);
    };
    const showMenu = (evt: MouseEvent) => {
        const menu = new Menu();
        for (const calendar of plugin.data.calendars.filter(
            (c) => c.id != $store.id,
        )) {
            menu.addItem((item) =>
                item.setTitle(calendar.name).onClick(() => {
                    const newStore = plugin.getStore(calendar.id);
                    if (!newStore)
                        throw new Error(
                            "Could not find a calendar by that name",
                        );
                    global.set(newStore);
                    ephemeral.set(newStore.ephemeralStore);
                    if (view) {
                        view.store = newStore;
                        view.calendar = calendar.id;
                        app.workspace.requestSaveLayout();
                    }
                }),
            );
        }
        menu.showAtMouseEvent(evt);
    };
    $: weekForDay =
        $daysAsWeeks.find((w) =>
            w.find((day) => day && day.number == $displaying.day),
        ) ?? [];
    $: weekNumber =
        $daysAsWeeks.findIndex((w) =>
            w.find((day) => day && day.number == $displaying.day),
        ) +
        $firstWeekNumber +
        1;
</script>

{#key $store}
    <div
        class="calendar-container"
        style="--calendar-columns: {$weekdays.length +
            ($displayWeeks ? 1 : 0)};--calendar-row-size: {$full
            ? `${(1 / $weeks) * 100}%`
            : '1fr'}; --calendar-row-count: {$weeks}"
    >
        <div class="top-container">
            <div class="name-container">
                <h3 class="calendar-name">{$store.name}</h3>
                {#if $otherCalendars.length > 1}
                    <div use:drop on:click={(evt) => showMenu(evt)} />
                {/if}
            </div>
            <Nav />
        </div>
        <div class="calendar">
            {#if $viewState == ViewState.Year}
                <Year />
            {:else if $viewState == ViewState.Month}
                {#key $displaying}
                    <Month year={$displaying.year} month={$displaying.month} />
                {/key}
            {:else if $viewState == ViewState.Week}
                <Weekdays year={$displaying.year} month={$displaying.month} />
                <Week
                    year={$displaying.year}
                    month={$displaying.month}
                    dayArray={weekForDay}
                    {weekNumber}
                />
            {:else if $viewState == ViewState.Day}
                <DayView />
            {/if}
        </div>
        {#if $viewing}
            <DayView />
        {/if}
    </div>
{/key}

<style scoped>
    .calendar-container {
        overflow: hidden;
        /* display: flex;
        flex-flow: column nowrap; */
        display: grid;
        grid-template-rows: auto auto 1fr;
    }
    .calendar {
        overflow: auto;
    }
    .top-container {
        display: flex;
        flex-flow: column;
        gap: 0.5rem;
    }
    .name-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .calendar-name {
        margin: 0;
    }
</style>
