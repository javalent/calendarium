<script lang="ts">
    import type Calendarium from "src/main";
    import { writable } from "svelte/store";
    import { type CalendarStore } from "src/stores/calendar.store";
    import { setTypedContext } from "../calendar/view.utils";
    import Agenda from "./Agenda.svelte";

    export let store: CalendarStore | null;
    export let plugin: Calendarium;
    export let parent: string;

    setTypedContext("plugin", plugin);
    setTypedContext("parent", parent);

    $: {
        if (store) {
            setTypedContext("store", writable(store));
        }
    }
</script>

{#if !store}
    <p>No calendars created! Create one in settings to get started.</p>
{:else}
    {#key store}
        <Agenda />
    {/key}
{/if}

<style scoped>
    .calendar-container {
        padding: 0 8px 20px 8px;
        background: inherit;
        display: flex;
        flex-flow: column;
        overflow: auto;
        height: 100%;
    }
</style>
