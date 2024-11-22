<script lang="ts">
    import { MonthStore } from "src/stores/month.store";
    import Dots from "../Events/Dots.svelte";
    import { TFile } from "obsidian";
    import type { CalEvent } from "src/@types";
    import Moon from "../Moon.svelte";
    import { ViewState } from "src/stores/calendar.store";
    import Flags from "../Events/Flags.svelte";
    import { addEventWithModal } from "src/events/modal/event";
    import {
        TimeSpanType,
        type DayOrLeapDay,
    } from "src/schemas/calendar/timespans";
    import CalendariumMenu from "src/utils/menu";
    import { isCalEvent } from "src/events/event.types";
    import { openAgendaView } from "src/agenda/view.agenda";
    import { getTypedContext } from "src/calendar/view.utils";
    import Weather from "../Weather/Weather.svelte";
    import { readable } from "svelte/store";

    export let month: MonthStore;
    export let day: DayOrLeapDay;

    export let adjacent: boolean;

    const plugin = getTypedContext("plugin");
    const store = getTypedContext("store");
    const view = getTypedContext("view");
    const ephemeral = getTypedContext("ephemeralStore");
    const full = getTypedContext("full");
    $: calendar = $store;
    $: config = calendar.staticStore.staticConfiguration;
    $: index = month.index;
    $: year = month.year;
    $: current = $store.current;
    $: viewing = $ephemeral.viewing;
    $: viewState = $ephemeral.viewState;
    $: events = $store.getEventsForDate({
        day: day.number,
        month: $index,
        year: year.year,
    });
    $: displayMoons = $ephemeral.displayMoons;

    $: moons = $store.moonCache.getItemsOrRecalculate({
        day: day.number,
        month: $index,
        year: year.year,
    });
    $: seasons = $store.seasonCache.getItemsOrRecalculate({
        day: day.number,
        month: $index,
        year: year.year,
    });

    $: displaySeasonColors = $ephemeral.displaySeasonColors;
    $: interpolateColors = $ephemeral.interpolateColors;
    $: displayWeather = $ephemeral.displayWeather;

    $: currentLocation = $ephemeral.currentLocation;

    $: weather = $full
        ? $store.weatherStore.getWeatherForDate(
              {
                  day: day.number,
                  month: $index,
                  year: year.year,
              },
              currentLocation,
          )
        : readable(null);

    $: today =
        !adjacent &&
        $current.day == day.number &&
        $current.month == $index &&
        $current.year == year.year;
    $: opened =
        !adjacent &&
        $viewing &&
        $viewing.day == day.number &&
        $viewing.month == $index &&
        $viewing.year == year.year;

    $: number = `${day.number}`;
    $: {
        if ($config.dayDisplayCallback) {
            try {
                const frame = document.body.createEl("iframe");
                const funct = (frame.contentWindow as any).Function;
                const func = new funct(
                    "day",
                    "calendar",
                    $config.dayDisplayCallback,
                );
                number = func.call(undefined, day, $calendar) ?? number;
                document.body.removeChild(frame);
            } catch (e) {
                console.error(e);
            }
            if (
                number == null ||
                (typeof number != "number" && typeof number != "string")
            )
                number = `${day.number}`;
        }
    }

    const openMenu = (evt: MouseEvent) => {
        const menu = new CalendariumMenu(plugin);

        menu.setNoIcon();

        if (!full) {
            menu.addItem((item) => {
                item.setTitle("Open day view").onClick(() => {
                    $viewing = {
                        day: day.number,
                        month: $index,
                        year: year.year,
                    };
                });
            });
        }
        menu.addItem((item) => {
            item.setTitle("Set as Today").onClick(async () => {
                $store.setCurrentDate({
                    day: day.number,
                    month: $index,
                    year: year.year,
                });
            });
        });
        menu.addItem((item) =>
            item.setTitle("New event").onClick(() => {
                addEventWithModal(plugin, $calendar, {
                    day: day.number,
                    month: $index,
                    year: year.year,
                });
            }),
        );
        let notes: { event: CalEvent; file: TFile }[] = [];
        for (const event of $events) {
            if (!isCalEvent(event)) continue;
            if (!event.note) continue;
            const file = plugin.app.vault.getAbstractFileByPath(event.note);
            if (file && file instanceof TFile) {
                notes.push({ event, file });
            }
        }

        if (notes.length) {
            menu.addSeparator();
            for (const { event, file } of notes) {
                menu.addItem((item) =>
                    item.setTitle(`Open ${event.name}`).onClick(() => {
                        plugin.app.workspace.getLeaf().openFile(file);
                    }),
                );
            }
        }
        menu.showAtMouseEvent(evt);
    };

    const handleClick = () => {
        $viewing = { day: day.number, month: $index, year: year.year };
        openAgendaView(view);
    };
</script>

{#if $viewState == ViewState.Year && adjacent}
    <div />
{:else}
    <div
        class="day"
        class:leapday={day.type == TimeSpanType.LeapDay}
        class:intercalary={day.type == TimeSpanType.LeapDay && day.intercalary}
        class:adjacent-month={adjacent}
        class:opened
        class:today
        class:full={$full}
        on:click={() => handleClick()}
        on:contextmenu={(evt) => {
            openMenu(evt);
        }}
        aria-label={$events.length > 0
            ? `${$events.length} event${$events.length == 1 ? "" : "s"}`
            : ""}
        class:season={$displaySeasonColors && $seasons.length}
        style={$displaySeasonColors && $seasons.length
            ? `--seasonal-color: ${$interpolateColors ? $seasons[0].lerp : $seasons[0].color}`
            : ""}
    >
        <div class="day-inner">
            <div class="split">
                {#if day.type === TimeSpanType.LeapDay && day.intercalary && day.name?.length}
                    {day.name}
                {/if}
                {#if day.type === TimeSpanType.Day || day.numbered}
                    <span class="day-number">
                        {number}
                    </span>
                {/if}
                {#if $full && $weather && $displayWeather}
                    <Weather {weather} />
                {/if}
            </div>
            {#key $events}
                {#if $full && $viewState != ViewState.Year}
                    {#if $displayMoons}
                        <div class="moon-container">
                            {#each $moons as moon}
                                <Moon {moon} />
                            {/each}
                        </div>
                    {/if}
                    {#key $events}
                        <Flags events={$events} />
                    {/key}
                {:else}
                    <Dots events={$events} />
                {/if}
            {/key}
        </div>
    </div>
{/if}

<style scoped>
    .day {
        background-color: var(--color-background-day);
        border-radius: 4px;
        color: var(--color-text-day);
        cursor: pointer;
        font-size: 0.8em;
        height: 100%;
        padding: 4px;
        position: relative;
        text-align: center;
        transition:
            background-color 0.1s ease-in,
            color 0.1s ease-in;
        vertical-align: baseline;
        display: flex;
        flex-flow: column nowrap;
        margin: 2px;
        /* max-height: var(--max-day-height); */
    }
    .opened {
        border: 2px solid var(--background-modifier-border);
        padding: 2px;
    }
    .season .day-inner {
        padding-top: 2px;
        border-top: 1px solid var(--seasonal-color);
    }
    .full .day-number {
        font-size: larger;
    }
    .full .split {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem;
    }
    .full .day-number:only-child {
        margin: 0 auto;
    }
    .intercalary {
        grid-column: span var(--calendar-columns);
        display: flex;
        justify-content: center;
        align-items: center;
        border-top: 1px solid var(--background-modifier-border);
        border-bottom: 1px solid var(--background-modifier-border);
        color: var(--text-accent);
    }
    .day:hover {
        background-color: var(--interactive-hover);
    }
    .adjacent-month {
        opacity: 0.25;
    }
    .today .day-number {
        color: var(--text-accent);
        font-weight: var(--bold-weight);
    }

    /* .moon-container {
        display: flex;
        flex-flow: row;
    } */
</style>
