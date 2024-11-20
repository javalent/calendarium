<script lang="ts">
    import { ButtonComponent, Platform } from "obsidian";
    import { onMount } from "svelte";

    import CreatorTitle from "./CreatorTitle.svelte";
    import History from "./Utilities/History.svelte";
    import General from "./Containers/general/General.svelte";
    import Dates from "./Containers/dates/Dates.svelte";
    import Celestials from "./Containers/celestials/Celestials.svelte";
    import Events from "./Containers/events/Events.svelte";
    import Eras from "./Containers/eras/EraContainer.svelte";
    import { SettingsSections, type CreatorSection } from "./creator.types";
    import { writable } from "svelte/store";
    import Sidebar from "./Containers/sidebar/Sidebar.svelte";
    import Seasonal from "./Containers/seasonal/Seasonal.svelte";

    const mobile = Platform.isMobile;

    let ready = mobile;

    onMount(() => {
        ready = true;
    });

    let selected = writable<CreatorSection>("General");

    export let color: string | null = null;
    export let top: number;
</script>

{#if Platform.isTablet || Platform.isDesktop}
    <Sidebar {selected} sections={[...SettingsSections]} on:cancel />
    <div class="vertical-tab-content-container {$selected.toLowerCase()}">
        <History></History>
        <div class="vertical-tab-content">
            {#if $selected == "General"}
                <General />
            {/if}
            {#if $selected == "Dates"}
                <Dates />
            {/if}
            {#if $selected === "Eras"}
                <Eras />
            {/if}
            {#if $selected === "Seasons & weather"}
                <Seasonal />
            {/if}
            <!--  -->
            <!-- {#if $selected === "Weather"}
                <Weather {plugin} {calendar} />
            {/if} -->
            {#if $selected == "Events"}
                <Events />
            {/if}
            {#if $selected == "Celestial bodies"}
                <Celestials />
            {/if}
        </div>
    </div>
{:else}
    <div
        class="calendarium-creator"
        style="--creator-background-color: {color}; --top: {top}px;"
    >
        {#if ready}
            <CreatorTitle />
            <div class="inherit calendarium-creator-inner">
                <div class="calendarium-creator-app">
                    <General />
                    <Dates />
                    <Celestials />
                    <Seasonal />
                    <Events />
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
    .vertical-tab-content {
        padding: var(--size-4-8);
        padding-top: 0;
    }
</style>
