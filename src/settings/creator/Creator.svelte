<script lang="ts">
    import { ButtonComponent, Platform } from "obsidian";
    import { onMount } from "svelte";

    import CreatorTitle from "./CreatorTitle.svelte";
    import History from "./Utilities/History.svelte";
    import General from "./Containers/general/General.svelte";
    import Dates from "./Containers/dates/Dates.svelte";
    import Celestials from "./Containers/celestials/Celestials.svelte";
    import Events from "./Containers/events/Events.svelte";
    import { createEventDispatcher } from "svelte";
    import { setNodeIcon } from "src/utils/icons";
    import { getContext } from "svelte";
    import { WARNING } from "src/utils/icons";

    const mobile = Platform.isMobile;

    let ready = mobile;

    onMount(() => {
        ready = true;
    });

    export let color: string | null = null;
    export let top: number;

    const store = getContext("store");
    const plugin = getContext("plugin");

    const SettingsSections = [
        "General",
        "Dates",
        /* "Eras",
        "Weather", */
        "Celestial bodies",
        "Events",
    ] as const;
    type CreatorSection = (typeof SettingsSections)[number];
    let SelectedSection: CreatorSection = SettingsSections[0];

    const { validName, validDate, validMonths, validWeekdays, validYears } =
        store;

    $: validSection = (section: CreatorSection): boolean => {
        switch (section) {
            case "General": {
                return $validName;
            }
            case "Dates": {
                return (
                    $validDate && $validMonths && $validWeekdays && $validYears
                );
            }
            case "Celestial bodies":
            case "Events":
            default: {
                return true;
            }
        }
    };

    const dispatch = createEventDispatcher<{ cancel: null }>();
    const cancel = (node: HTMLDivElement) => {
        new ButtonComponent(node)
            .setButtonText("Cancel")
            .setCta()
            .onClick(() => {
                dispatch("cancel");
            });
    };
    const getIcon = (section: CreatorSection) => {
        switch (section) {
            case "General":
                return "badge-info";
            case "Dates":
                return "calendar";
            case "Celestial bodies":
                return "moon";
            case "Events":
                return "calendar-clock";
        }
    };
</script>

{#if Platform.isTablet || Platform.isDesktop}
    <div class="vertical-tab-header">
        <CreatorTitle />
        <div class="vertical-tab-header-group">
            <div class="vertical-tab-header-group-items">
                {#each SettingsSections as SECTION}
                    <div
                        class="vertical-tab-nav-item"
                        class:is-active={SelectedSection === SECTION}
                        on:click={() => (SelectedSection = SECTION)}
                    >
                        <div class="section">
                            <div use:setNodeIcon={getIcon(SECTION)} />
                            {SECTION}
                        </div>
                        {#if !validSection(SECTION)}
                            <div
                                class="calendarium-warning x-small"
                                use:setNodeIcon={WARNING}
                            />
                        {/if}
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
            {#if SelectedSection == "Celestial bodies"}
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
        padding-top: 0;
    }
    .vertical-tab-nav-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .calendarium-warning {
        color: var(--interactive-accent);
    }
    .is-active .calendarium-warning {
        color: var(--text-on-accent);
    }
    .bottom {
        margin-top: auto;
        justify-content: flex-end;
        display: flex;
    }
    .section {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
</style>
