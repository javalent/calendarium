<script lang="ts">
    import type { Calendar } from "src/@types";
    import type Calendarium from "src/main";
    import { ButtonComponent, Platform } from "obsidian";
    import { setContext } from "svelte";
    import { onMount } from "svelte";
    import { type Writable } from "svelte/store";

    import createStore from "./stores/calendar";
    import CreatorTitle from "./CreatorTitle.svelte";
    import History from "./Utilities/History.svelte";
    import General from "./Containers/general/General.svelte";
    import Dates from "./Containers/dates/Dates.svelte";
    import Celestials from "./Containers/celestials/Celestials.svelte";
    import Events from "./Containers/events/Events.svelte";
    import { createEventDispatcher } from "svelte";

    const mobile = Platform.isMobile;
    let ready = mobile;

    const SettingsSections = [
        "General",
        "Dates",
        /* "Eras",
        "Weather", */
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

    const dispatch = createEventDispatcher<{ cancel: null }>();
    const cancel = (node: HTMLDivElement) => {
        new ButtonComponent(node)
            .setButtonText("Cancel")
            .setCta()
            .onClick(() => {
                dispatch("cancel");
            });
    };
</script>

{#if !Platform.isMobile}
    <div class="vertical-tab-header">
        <CreatorTitle {store} />
        <div class="vertical-tab-header-group">
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

        <div class="bottom">
            <div class="cancel" use:cancel />
        </div>
    </div>
    <div
        class="vertical-tab-content-container {SelectedSection.toLowerCase()}s"
    >
        <History></History>
        <div class="vertical-tab-content">
            {#if SelectedSection == "General"}
                <General />
            {/if}
            {#if SelectedSection == "Dates"}
                <Dates />
            {/if}
            <!-- {#if SelectedSection === "Eras"}
                <Eras {plugin} {calendar} />
            {/if}
            {#if SelectedSection === "Weather"}
                <Weather {plugin} {calendar} />
            {/if} -->
            {#if SelectedSection == "Events"}
                <Events />
            {/if}
            {#if SelectedSection == "Celestial Bodies"}
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
            <CreatorTitle {store} />
            <div class="inherit calendarium-creator-inner">
                <div class="calendarium-creator-app">
                    <General />
                    <Dates />
                    <Celestials />
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
    .vertical-tab-header {
        display: flex;
        flex-flow: column nowrap;
    }
    .vertical-tab-content {
        padding: var(--size-4-8);
    }
    .bottom {
        margin-top: auto;
        justify-content: flex-end;
        display: flex;
    }
</style>
