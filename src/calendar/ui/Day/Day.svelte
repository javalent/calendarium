<script lang="ts">
    import { MonthStore } from "src/stores/month.store";
    import { getTypedContext } from "../../view";
    import Dots from "../Events/Dots.svelte";
    import { Menu, TFile } from "obsidian";
    import type { FcEvent } from "src/@types";
    import Moon from "../Moon.svelte";
    import { ViewState } from "src/stores/calendar.store";

    export let month: MonthStore;
    export let number: number;
    export let adjacent: boolean;

    const store = getTypedContext("store");
    const ephemeral = getTypedContext("ephemeralStore");
    const full = getTypedContext("full");
    $: index = month.index;
    $: year = month.year;
    $: current = $store.current;
    $: eventCache = $store.eventCache;
    $: viewing = $ephemeral.viewing;
    $: viewState = $ephemeral.viewState;
    $: events = eventCache.getItemsOrRecalculate({
        day: number,
        month: $index,
        year: year.year,
    });
    $: displayMoons = $ephemeral.displayMoons;

    $: moons = $store.moonCache.getItemsOrRecalculate({
        day: number,
        month: $index,
        year: year.year,
    });

    $: today =
        !adjacent &&
        $current.day == number &&
        $current.month == $index &&
        $current.year == year.year;
    $: opened =
        !adjacent &&
        $viewing &&
        $viewing.day == number &&
        $viewing.month == $index &&
        $viewing.year == year.year;

    const openMenu = (evt: MouseEvent) => {
        const menu = new Menu();

        menu.setNoIcon();

        if (!this.full) {
            menu.addItem((item) => {
                item.setTitle("Open Day View").onClick(() => {
                    $viewing = { day: number, month: $index, year: year.year };
                });
            });
        }
        menu.addItem((item) => {
            item.setTitle("Set as Today").onClick(async () => {
                $store.setCurrentDate({
                    day: number,
                    month: $index,
                    year: year.year,
                });
            });
        });
        menu.addItem((item) =>
            item.setTitle("New Event").onClick(() => {
                $store.addEvent({
                    day: number,
                    month: $index,
                    year: year.year,
                });
            })
        );
        let notes: { event: FcEvent; file: TFile }[] = [];
        for (const event of $events) {
            if (!event.note) continue;
            const file = app.vault.getAbstractFileByPath(event.note);
            if (file && file instanceof TFile) {
                notes.push({ event, file });
            }
        }
        console.log("🚀 ~ file: Day.svelte:66 ~ notes:", notes);
        if (notes.length) {
            menu.addSeparator();
            for (const { event, file } of notes) {
                menu.addItem((item) =>
                    item.setTitle(`Open ${event.name}`).onClick(() => {
                        app.workspace.getLeaf().openFile(file);
                    })
                );
            }
        }
        menu.showAtMouseEvent(evt);
    };
</script>

<td
    on:click={() =>
        ($viewing = { day: number, month: $index, year: year.year })}
    on:contextmenu={(evt) => {
        openMenu(evt);
    }}
    aria-label={$events.length > 0 ? `${$events.length} Events` : ""}
>
    <div
        class="day"
        class:adjacent-month={adjacent}
        class:opened
        class:today
        class:full={$full}
    >
        <span class="day-number">
            {number}
        </span>
        {#key $events}
            {#if $full && $viewState != ViewState.Year}
                {#if $displayMoons}
                    <div class="moon-container">
                        {#each $moons as moon}
                            <Moon {moon} />
                        {/each}
                    </div>
                {/if}
            {:else}
                <Dots events={$events} />
            {/if}
        {/key}
    </div>
</td>

<style scoped>
    .day {
        border: 2px solid transparent;
        background-color: var(--color-background-day);
        border-radius: 4px;
        color: var(--color-text-day);
        cursor: pointer;
        font-size: 0.8em;
        height: 100%;
        padding: 4px;
        position: relative;
        text-align: center;
        transition: background-color 0.1s ease-in, color 0.1s ease-in;
        vertical-align: baseline;
    }
    .day:hover {
        background-color: var(--interactive-hover);
    }
    .adjacent-month {
        opacity: 0.25;
    }
    .today {
        color: var(--interactive-accent);
    }

    .opened {
        border: 2px solid var(--background-modifier-border);
    }
</style>
