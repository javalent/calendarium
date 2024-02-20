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
    import Events from "./Containers/events/Events.svelte";
    import { createEventDispatcher } from "svelte";
    import { setNodeIcon } from "src/utils/helpers";
    import Info from "./Containers/general/Info.svelte";
    import CurrentDate from "./Containers/dates/current/CurrentDate.svelte";

    const mobile = Platform.isMobile;
    let ready = mobile;

    onMount(() => {
        ready = true;
    });

    const SettingsSections = ["General", "Events"] as const;
    type CreatorSection = (typeof SettingsSections)[number];
    let SelectedSection: CreatorSection = SettingsSections[0];

    $: validSection = (section: CreatorSection): boolean => {
        switch (section) {
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
</script>

{#if !Platform.isMobile}
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
                        {SECTION}
                        {#if !validSection(SECTION)}
                            <div
                                class="calendarium-warning x-small"
                                use:setNodeIcon={"calendarium-warning"}
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
                <Info />
                <CurrentDate />
            {/if}
            {#if SelectedSection == "Events"}
                <Events />
            {/if}
        </div>
    </div>
{:else}
    <div class="calendarium-creator">
        {#if ready}
            <CreatorTitle />
            <div class="inherit calendarium-creator-inner">
                <div class="calendarium-creator-app">
                    <Info />
                    <CurrentDate />
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
</style>
