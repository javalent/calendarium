<script lang="ts">
    import Nav from "./Nav.svelte";
    import Month from "./Month/Month.svelte";
    import { ExtraButtonComponent } from "obsidian";
    import { getTypedContext } from "../view.utils";

    import { ViewState } from "src/stores/calendar.store";
    import Year from "./Year/Year.svelte";
    import Week from "./Week/Week.svelte";
    import { writable } from "svelte/store";
    import Weekdays from "./Week/Weekdays.svelte";
    import { SELECT_MULTIPLE } from "src/utils/icons";
    import CalendariumMenu from "src/utils/menu";
    import { setContext } from "svelte";
    import { SettingsService } from "src/settings/settings.service";
    import { NO_LOCATION } from "src/schemas/calendar/locations";

    const global = getTypedContext("store");
    const ephemeral = getTypedContext("ephemeralStore");
    const view = getTypedContext("view");
    const full = getTypedContext("full");
    $: store = $global;
    $: displaying = $ephemeral.displaying;
    $: displayWeeks = $ephemeral.displayWeeks;
    $: displayedMonth = $ephemeral.displayingMonth;
    $: currentLocationName = $ephemeral.currentLocationName;
    $: location = $ephemeral.location;
    $: locations = store.locationStore;
    $: daysAsWeeks = $displayedMonth.daysAsWeeks;
    $: firstWeekNumber = $displayedMonth.firstWeekNumber;
    $: weekdays = $displayedMonth.weekdays;
    $: weeks = $displayedMonth.weeks;
    $: viewState = $ephemeral.viewState;
    $: ephemeralStore = $ephemeral.ephemeralStore;
    $: ephemeralStore.subscribe(() => plugin.app.workspace.requestSaveLayout());

    const plugin = getTypedContext("plugin");
    let otherCalendars = writable(SettingsService.getCalendars());

    setContext("monthInFrame", writable<number | null>(null));

    //don't like this... find a better way
    plugin.app.workspace.on(
        "calendarium-updated",
        () => ($otherCalendars = SettingsService.getCalendars()),
    );

    const drop = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(SELECT_MULTIPLE);
    };
    const showMenu = (evt: MouseEvent) => {
        const menu = new CalendariumMenu(plugin);
        for (const calendar of SettingsService.getCalendars()) {
            menu.addItem((item) =>
                item
                    .setTitle(calendar.name)
                    .onClick(() => {
                        view.switchCalendar(calendar.id);
                    })
                    .setChecked(calendar.id == $store.id),
            );
        }
        menu.showAtMouseEvent(evt);
    };
    const showLocationMenu = (evt: MouseEvent) => {
        const menu = new CalendariumMenu(plugin);
        menu.addItem((item) =>
            item
                .setTitle("None")
                .setChecked($location === NO_LOCATION)
                .onClick(() => location.set(NO_LOCATION)),
        );
        for (const l of $locations) {
            menu.addItem((item) => {
                item.setTitle(l.name)
                    .onClick(() => {
                        location.set(l.id);
                    })
                    .setChecked($location == l.id);
            });
        }
        menu.showAtMouseEvent(evt);
    };
    $: weekForDay =
        $daysAsWeeks?.find((w) =>
            w.find((day) => day && day.number == $displaying.day),
        ) ?? [];
    $: weekNumber =
        $daysAsWeeks?.findIndex((w) =>
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
            {#if $locations.length}
                <div class="location-container">
                    <small class="location-name">{$currentLocationName}</small>
                    <div use:drop on:click={(evt) => showLocationMenu(evt)} />
                </div>
            {/if}
        </div>
        <Nav />
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
            {/if}
        </div>
    </div>
{/key}

<style scoped>
    .calendar-container {
        overflow: hidden;
        /* display: flex;
        flex-flow: column nowrap; */
        display: flex;
        flex-flow: column;
        height: 100%;
        gap: 0.5rem;
    }
    .calendar {
        overflow: auto;
        height: 100%;
    }
    .top-container {
        display: flex;
        flex-flow: column;
    }
    .name-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .calendar-name {
        margin: 0;
    }
    .location-container {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        --icon-size: var(--icon-xs);
    }
</style>
