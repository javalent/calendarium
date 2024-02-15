<script lang="ts">
    import type { CalDate, Calendar } from "src/@types";
    import type Calendarium from "src/main";
    import copy from "fast-copy";
    import { Platform, Setting } from "obsidian";
    import { CalendarPresetModal } from "../modals/preset";
    import { setContext } from "svelte";
    import { onMount } from "svelte";
    import CurrentDate from "./Containers/CurrentDate.svelte";
    import Info from "./Containers/Info.svelte";
    import WeekdayContainer from "./Containers/weekday/WeekdayContainer.svelte";
    import MonthContainer from "./Containers/months/MonthContainer.svelte";
    import YearContainer from "./Containers/YearContainer.svelte";
    import EventContainer from "./Containers/events/EventContainer.svelte";
    import CategoryContainer from "./Containers/CategoryContainer.svelte";
    import MoonContainer from "./Containers/MoonContainer.svelte";
    import LeapDayContainer from "./Containers/LeapDayContainer.svelte";
    import { type Writable } from "svelte/store";

    import createStore from "./stores/calendar";
    import { nanoid } from "src/utils/functions";
    import CreatorTitle from "./CreatorTitle.svelte";
    import History from "./Utilities/History.svelte";

    const mobile = Platform.isMobile;
    let ready = mobile;

    const SettingsSections = [
        "General",
        "Dates",
        "Eras",
        "Weather",
        "Celestial Bodies",
        "Events",
    ] as const;
    let SelectedSection: (typeof SettingsSections)[number] =
        SettingsSections[0];

    onMount(() => {
        ready = true;
    });

    export let plugin: Calendarium;
    export let color: string | null = null;
    export let top: number;
    export let store: ReturnType<typeof createStore>;
    setContext<Writable<Calendar>>("store", store);
    setContext<Calendarium>("plugin", plugin);
</script>

{#if !Platform.isMobile}
    <div class="vertical-tab-header">
        <div class="vertical-tab-header-group">
            <CreatorTitle {store} />
            <div class="vertical-tab-header-group-items">
                {#each SettingsSections as SECTION}
                    <div
                        class="vertical-tab-nav-item"
                        class:is-active={SelectedSection === SECTION}
                        on:click={() => (SelectedSection = SECTION)}
                    >
                        {SECTION}
                    </div>
                {/each}
            </div>
        </div>
    </div>
    <div
        class="vertical-tab-content-container {SelectedSection.toLowerCase()}s"
    >
        <History></History>
        <div class="vertical-tab-content">
            {#if SelectedSection == "General"}
                <Info />
            {/if}
            {#if SelectedSection == "Dates"}
                <CurrentDate />
                <WeekdayContainer />
                <MonthContainer />
                <LeapDayContainer {plugin} />
                <YearContainer app={plugin.app} />
            {/if}
            {#if SelectedSection === "Eras"}
                <!--<EraContainer {plugin} {calendar} />-->
            {/if}
            {#if SelectedSection == "Events"}
                <CategoryContainer />
                <EventContainer {plugin} />
            {/if}
            {#if SelectedSection == "Celestial Bodies"}
                <MoonContainer {plugin} />
            {/if}
        </div>
    </div>
{:else}
    <div
        class="calendarium-creator"
        style="--creator-background-color: {color}; --top: {top}px;"
    >
        {#if ready}
            <CreatorTitle {store} />
            <div class="inherit calendarium-creator-inner">
                <div class="calendarium-creator-app">
                    <Info />
                    <WeekdayContainer />
                    <MonthContainer />
                    <YearContainer app={plugin.app} />
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
{/if}

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
    .vertical-tab-header {
        display: flex;
        flex-flow: column nowrap;
    }
    .vertical-tab-content {
        padding: var(--size-4-8);
    }
</style>
