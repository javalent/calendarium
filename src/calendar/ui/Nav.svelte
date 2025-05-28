<script lang="ts">
    import { ExtraButtonComponent, Menu } from "obsidian";
    import { getTypedContext } from "../view.utils";
    import { ViewState } from "src/stores/calendar.store";
    import { LEFT, RIGHT, SETTINGS } from "src/utils/icons";
    import CalendariumMenu from "src/utils/menu";
    import { derived } from "svelte/store";
    import { formatEra, getEraYear } from "src/utils/functions";
    import { GoToDateModal } from "../date-switcher/date";

    const global = getTypedContext("store");
    const ephemeral = getTypedContext("ephemeralStore");
    const plugin = getTypedContext("plugin");
    const store = $global;

    const { displaying, displayingMonth, displayingYear, hideEra } = $ephemeral;
    const { currentDisplay, yearCalculator } = store;
    const monthInFrame = getTypedContext("monthInFrame");
    const viewState = $ephemeral.viewState;

    $: staticStore = store.staticStore;
    $: weather = staticStore.weather;
    $: weatherEnabled = $weather.enabled;

    $: displayMoons = $ephemeral.displayMoons;
    $: displayWeeks = $ephemeral.displayWeeks;
    $: displayDayNumber = $ephemeral.displayDayNumber;
    $: displayAbsoluteYear = $ephemeral.displayAbsoluteYear;
    $: displaySeasonColors = $ephemeral.displaySeasonColors;
    $: interpolateColors = $ephemeral.interpolateColors;
    $: displayWeather = $ephemeral.displayWeather;

    $: eraMonth = derived(
        [monthInFrame, viewState, displaying],
        ([monthInFrame, viewState, displaying]) => {
            if (viewState == ViewState.Year && monthInFrame != null) {
                return monthInFrame;
            }
            return displaying.month;
        },
    );

    $: eras = yearCalculator
        .getYearFromCache($displaying.year)
        .getMonthFromCache($eraMonth).eras;
    $: displayedYear = derived(
        [eras, displayingYear, displayAbsoluteYear],
        ([eras, displayingYear, displayAbsoluteYear]) => {
            if (displayAbsoluteYear) return displayingYear;
            if (typeof displayingYear != "number") return displayingYear;
            if (!eras?.length) return displayingYear;
            return getEraYear(eras[0], displayingYear);
        },
    );

    viewState.subscribe((value) => {
        if (value === ViewState.Year) {
            $monthInFrame = $displaying.month;
        } else {
            $monthInFrame = null;
        }
    });

    const left = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(LEFT);
    };
    const right = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(RIGHT);
    };
    const settings = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(SETTINGS);
    };
    const openSettings = (evt: MouseEvent) => {
        const menu = new CalendariumMenu(plugin);

        menu.setNoIcon();

        menu.addItem((item) => {
            item.setTitle("Go to day").onClick(() => {
                new GoToDateModal(plugin, store, $ephemeral).open();
            });
        });
        menu.addSeparator();
        menu.addItem((item) => {
            item.setTitle(`Show week numbers`).onClick(async () => {
                $displayWeeks = !$displayWeeks;
            });
            item.setChecked($displayWeeks);
        });
        menu.addItem((item) => {
            item.setTitle("Show day number")
                .onClick(async () => {
                    $displayDayNumber = !$displayDayNumber;
                })
                .setChecked($displayDayNumber);
        });
        menu.addSeparator();
        menu.addItem((item) => {
            item.setTitle(`Show era`)
                .onClick(async () => {
                    $hideEra = !$hideEra;
                    $global.eventStore.calendar.hideEra = $hideEra;
                })
                .setChecked(!$hideEra);
        });
        menu.addItem((item) => {
            item.setTitle(
                `Show ${$displayAbsoluteYear ? "era" : "absolute"} year`,
            ).onClick(async () => {
                $displayAbsoluteYear = !$displayAbsoluteYear;
            });
        });
        menu.addSeparator();
        menu.addItem((item) => {
            item.setTitle("Show moons")
                .onClick(() => {
                    $displayMoons = !$displayMoons;
                })
                .setChecked($displayMoons);
        });
        menu.addSeparator();
        menu.addItem((item) => {
            item.setTitle("Show season colors")
                .onClick(() => {
                    $displaySeasonColors = !$displaySeasonColors;
                })
                .setChecked($displaySeasonColors);
        });
        if ($displaySeasonColors)
            menu.addItem((item) => {
                item.setTitle("Gradient season colors")
                    .onClick(() => {
                        $interpolateColors = !$interpolateColors;
                    })
                    .setChecked($interpolateColors);
            });
        if (weatherEnabled) {
            menu.addSeparator();
            menu.addItem((item) => {
                item.setTitle("Display weather")
                    .onClick(() => {
                        $displayWeather = !$displayWeather;
                    })
                    .setChecked($displayWeather);
            });
        }

        menu.showAtMouseEvent(evt);
    };

    function changeYear(currentTarget: EventTarget & HTMLSpanElement) {
        if (!isNaN(Number(currentTarget.textContent))) {
            $displaying.year = Number(currentTarget.textContent);
        }
    }
</script>

<div class="calendarium-nav-container">
    <div class="view-state-switcher">
        <span
            class="view-state"
            class:active={$viewState == ViewState.Week}
            on:click={() => ($viewState = ViewState.Week)}>Week</span
        >
        <span
            class="view-state"
            class:active={$viewState == ViewState.Month}
            on:click={() => ($viewState = ViewState.Month)}>Month</span
        >
        <span
            class="view-state"
            class:active={$viewState == ViewState.Year}
            on:click={() => ($viewState = ViewState.Year)}>Year</span
        >
    </div>
    <div class="calendarium-nav nav">
        <div class="title-container">
            <h3 class="calendarium-title title">
                {#if $viewState != ViewState.Year}
                    <span class="calendarium-month month"
                        >{$displayingMonth.name}</span
                    >
                {/if}
                <span class="calendarium-year year">{$displayedYear}</span>
            </h3>
            <div class="eras eras-container">
                {#if $eras.length && !$hideEra}
                    <!-- {#each $eras as era} -->
                    <span class="era"
                        >{formatEra($eras[0], $displayingYear)}</span
                    >
                    <!-- {/each} -->
                {/if}
            </div>
        </div>
        <div class="right-nav calendarium-right-nav">
            <div class="container">
                <div
                    class="arrow calendar-clickable"
                    use:left
                    on:click={() => $ephemeral.goToPrevious()}
                />
                <div
                    class="reset-button calendar-clickable"
                    on:click={() => $ephemeral.displayDate(null)}
                    aria-label="Today is {$currentDisplay}"
                >
                    <span>Today</span>
                </div>
                <div
                    class="arrow right calendar-clickable"
                    use:right
                    on:click={(evt) => $ephemeral.goToNext()}
                />
                <div
                    class="calendar-clickable"
                    use:settings
                    aria-label="Calendar settings"
                    on:click={(evt) => openSettings(evt)}
                />
            </div>
        </div>
    </div>
</div>

<style>
    .calendarium-nav-container {
        display: flex;
        flex-flow: column;
        gap: 0.5rem;
    }
    .view-state-switcher {
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        margin: 0 0.5rem;
    }
    .view-state:first-of-type {
        margin-left: 0;
    }
    .view-state:last-of-type {
        margin-right: 0;
    }
    .view-state {
        margin: 0 4px;
        flex-grow: 1;
        text-align: center;

        border-radius: 4px;
    }
    .view-state:not(.active):hover {
        background-color: var(--interactive-hover);
        color: var(--text-on-accent);
    }
    .view-state.active {
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
    }
    .calendarium-nav.nav.nav {
        margin: 0;
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
        align-items: stretch;
    }
    .year,
    .era {
        color: var(--text-accent);
    }
    .container {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    .calendarium-title {
        margin: 0;
        line-height: 1.25;
    }
    .calendarium-right-nav {
        display: flex;
        justify-content: center;
        align-items: flex-start;
    }
    .calendar-clickable {
        align-items: center;
        cursor: pointer;
        display: flex;
        justify-content: center;
    }
    .title-container {
        display: flex;
        flex-flow: column nowrap;
        align-items: flex-start;
    }
    .reset-button {
        cursor: pointer;
        border-radius: 4px;
        color: var(--text-muted);
        font-size: 0.7em;
        font-weight: 600;
        letter-spacing: 1px;
        margin: 0 4px;
        padding: 0px 4px;
        text-transform: uppercase;
    }
    .arrow {
        --icon-size: 16px;
    }
</style>
