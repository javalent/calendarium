<script lang="ts">
    import type { Calendar } from "src/@types";
    import type Calendarium from "src/main";
    import copy from "fast-copy";
    import { ExtraButtonComponent, Platform, setIcon, Setting } from "obsidian";
    import { CalendarPresetModal } from "../modals/preset";
    import { createEventDispatcher, setContext } from "svelte";
    import { fly, FlyParams } from "svelte/transition";
    import { onMount } from "svelte";
    import CurrentDate from "./Containers/CurrentDate.svelte";
    import Info from "./Containers/Info.svelte";
    import WeekdayContainer from "./Containers/WeekdayContainer.svelte";
    import MonthContainer from "./Containers/MonthContainer.svelte";
    import YearContainer from "./Containers/YearContainer.svelte";
    import EventContainer from "./Containers/EventContainer.svelte";
    import CategoryContainer from "./Containers/CategoryContainer.svelte";
    import MoonContainer from "./Containers/MoonContainer.svelte";
    import LeapDayContainer from "./Containers/LeapDayContainer.svelte";
    import { Writable, writable } from "svelte/store";
    import { getCanSave, getMissingNotice, warning } from "./Utilities/utils";
    import { ConfirmExitModal } from "../modals/confirm";
    import EraContainer from "./Containers/EraContainer.svelte";
    import createStore from "./stores/calendar";

    const mobile = Platform.isMobile;
    let ready = mobile;

    onMount(() => {
        ready = true;
    });

    const dispatch = createEventDispatcher();

    export let width: number;
    export let base: Calendar;
    export let plugin: Calendarium;
    export let color: string = null;
    export let top: number;

    const calendar = createStore(plugin, base);
    setContext<Writable<Calendar>>("store", calendar);

    const back = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("left-arrow-with-tail");
    };
    const cancel = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon("cross")
            .setTooltip("Exit without saving");
    };
    const preset = (node: HTMLElement) => {
        const presetEl = node.createDiv("calendarium-apply-preset");
        new Setting(presetEl)
            .setName("Apply Preset")
            .setDesc("Apply a common Calendarium as a preset.")
            .addButton((b) => {
                b.setCta()
                    .setButtonText("Choose Preset")
                    .onClick(() => {
                        const modal = new CalendarPresetModal(plugin.app);
                        modal.onClose = () => {
                            if (!modal.saved) return;
                            $calendar = copy(modal.preset);
                            if ($calendar?.name == "Gregorian Calendar") {
                                const today = new Date();

                                calendar.setCurrentDate({
                                    year: today.getFullYear(),
                                    month: today.getMonth(),
                                    day: today.getDate()
                                });
                            }
                        };
                        modal.open();
                    });
            });
    };

    let saved = false;

    $: missing = getMissingNotice($calendar);
    const { valid } = calendar;

    const checkCanSave = () => {
        if (!$valid && !plugin.data.exit.saving) {
            const modal = new ConfirmExitModal(plugin);
            modal.onClose = () => {
                if (modal.confirmed) {
                    ready = false;
                }
                if (mobile) {
                    dispatch("exit", { saved, calendar: $calendar });
                }
            };
            modal.open();
        } else {
            saved = true;
            ready = false;
        }
    };
    const savedEl = (node: HTMLElement) => {
        if ($valid) {
            setIcon(node, "checkmark");
        } else {
            warning(node);
        }
    };

    const animation = (node: HTMLElement, args: FlyParams) =>
        !mobile ? fly(node, args) : null;
</script>

<div
    class="calendarium-creator"
    style="--creator-background-color: {color}; --top: {top}px;"
>
    {#if ready}
        <div
            class="inherit calendarium-creator-inner"
            style={!mobile ? `width: ${width + 4}px;` : ""}
            transition:animation={{ x: width * 1.5, opacity: 1 }}
            on:introend={() => dispatch("flown")}
            on:outroend={() => dispatch("exit", { saved, calendar: $calendar })}
        >
            <div class="top-nav">
                <div class="icons">
                    <div class="left">
                        <div
                            class="back"
                            use:back
                            aria-label={$valid
                                ? "Save and exit"
                                : "Exit without saving"}
                            on:click={() => {
                                checkCanSave();
                            }}
                        />
                        <div class="check">
                            {#if $valid}
                                <div
                                    class="save can-save"
                                    use:savedEl
                                    aria-label={missing}
                                />
                                <span class="additional can-save">
                                    All good! Exit to save calendar
                                </span>
                            {:else}
                                <div
                                    class="save"
                                    use:savedEl
                                    aria-label={missing}
                                />
                                <span class="additional">
                                    Additional information is required before
                                    saving
                                </span>
                            {/if}
                        </div>
                    </div>
                    <div
                        class="cancel"
                        use:cancel
                        on:click={() => (ready = false)}
                    />
                </div>
                <h3 class="calendarium-creator-header">
                    Calendar Creator
                </h3>
            </div>
            <div class="calendarium-creator-app">
                <div use:preset />
                <Info {plugin} />
                <WeekdayContainer />
                <MonthContainer />
                <YearContainer app={plugin.app} />
                <!-- 
            -->
                <!--<EraContainer {plugin} {calendar} />-->
                <CurrentDate />
                <EventContainer {plugin} />
                <CategoryContainer />
                <MoonContainer {plugin} />
                <LeapDayContainer {plugin} />
                <!-- 
            -->
            </div>
        </div>
    {/if}
</div>

<style>
    :global(body:not(.is-mobile)) .calendarium-creator {
        position: absolute;
        top: var(--top, 0);
        height: 100%;
    }
    :global(body:not(.is-mobile)) .calendarium-creator-inner {
        position: absolute;
        top: 0;
        left: -2px;
        bottom: 0;
        overflow: auto;
        display: grid;
        grid-template-rows: auto 1fr;
    }

    .calendarium-creator,
    .calendarium-creator .calendarium-creator-inner,
    .calendarium-creator .calendarium-creator-app {
        background-color: var(--creator-background-color);
    }
    :global(body.is-mobile) .calendarium-creator,
    :global(body.is-mobile) .calendarium-creator .calendarium-creator-app {
        padding: 0px 10px;
        width: 100%;
    }
    .calendarium-creator-app {
        overflow: auto;
        height: 100%;
    }
    .calendarium-creator-header {
        margin: 0;
    }
    .top-nav {
        position: sticky;
        top: 0;
        padding: 10px 0px;
        background-color: inherit;
        z-index: 3;
    }
    .icons {
        display: flex;
        justify-content: space-between;
    }

    .icons .left {
        display: flex;
        align-items: center;
    }
    .check {
        display: flex;
        gap: 0.25rem;
        align-items: center;
    }
    .additional {
        color: var(--text-faint);
    }
    .save {
        color: var(--text-error);
    }
    .save.can-save {
        color: var(--interactive-success);
    }
    .additional.can-save {
        color: var(--text-normal);
    }

    /* .calendarium-creator-app {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.25rem;
        align-items: center;
    }
    .left-nav {
        height: 100%;
        display: flex;
        flex-flow: column nowrap;
        justify-content: space-around;
        align-items: center;
    } */
    .back {
        width: min-content;
    }
    .back :global(.clickable-icon) {
        margin-left: 0;
    }
    /* Globals */
</style>
