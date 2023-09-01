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
    import { Writable } from "svelte/store";
    import { getMissingNotice, warning } from "./Utilities/utils";
    import { ConfirmExitModal } from "../modals/confirm";
    import createStore from "./stores/calendar";

    const mobile = Platform.isMobile;
    let ready = mobile;

    onMount(() => {
        ready = true;
    });

    export let width: number;
    export let plugin: Calendarium;
    export let color: string = null;
    export let top: number;
    export let store: ReturnType<typeof createStore>;
    setContext<Writable<Calendar>>("store", store);

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
                            $store = copy(modal.preset);
                            if ($store?.name == "Gregorian Calendar") {
                                const today = new Date();

                                store.setCurrentDate({
                                    year: today.getFullYear(),
                                    month: today.getMonth(),
                                    day: today.getDate(),
                                });
                            }
                        };
                        modal.open();
                    });
            });
    };

    let saved = false;

    $: missing = getMissingNotice($store);
    const { valid } = store;

    const savedEl = (node: HTMLElement) => {
        if ($valid) {
            setIcon(node, "checkmark");
        } else {
            warning(node);
        }
    };
</script>

<div
    class="calendarium-creator"
    style="--creator-background-color: {color}; --top: {top}px;"
>
    {#if ready}
        <div
            class="inherit calendarium-creator-inner"
            style={!mobile ? `width: ${width + 4}px;` : ""}
        >
            <!-- <div class="top-nav">
                <div class="icons">
                    <div class="left">
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
                </div>
            </div> -->
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
    .calendarium-creator,
    .calendarium-creator .calendarium-creator-inner,
    .calendarium-creator .calendarium-creator-app {
        background-color: var(--creator-background-color);
    }
    .calendarium-creator-app {
        overflow: auto;
        height: 100%;
    }
</style>
