<script lang="ts">
    import { Platform } from "obsidian";
    import { onMount } from "svelte";
    import CreatorTitle from "./CreatorTitle.svelte";
    import History from "./Utilities/History.svelte";
    import Events from "./Containers/events/Events.svelte";
    import Info from "./Containers/general/Info.svelte";
    import CurrentDate from "./Containers/dates/current/CurrentDate.svelte";
    import type { CreatorSection } from "./creator.types";
    import { writable } from "svelte/store";
    import Sidebar from "./Containers/sidebar/Sidebar.svelte";

    const mobile = Platform.isMobile;
    let ready = mobile;

    onMount(() => {
        ready = true;
    });

    let selected = writable<CreatorSection>("General");
</script>

{#if !Platform.isMobile}
    <Sidebar {selected} sections={["General", "Events"]} on:cancel />
    <div class="vertical-tab-content-container {$selected.toLowerCase()}s">
        <History></History>
        <div class="vertical-tab-content">
            {#if $selected == "General"}
                <Info />
                <CurrentDate />
            {/if}
            {#if $selected == "Events"}
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
    .bottom {
        margin-top: auto;
        justify-content: flex-end;
        display: flex;
    }
</style>
