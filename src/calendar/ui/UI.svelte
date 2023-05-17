<script lang="ts">
    import type { Calendar as CalendarInterface } from "src/@types";
    import type Calendarium from "src/main";
    import Calendar from "./Calendar.svelte";
    import { setContext } from "svelte";
    import { CalendarStore } from "src/stores/calendar.store";
    import { setTypedContext } from "../view";
    import { writable } from "svelte/store";

    export let calendar: CalendarInterface;
    export let plugin: Calendarium;
    setTypedContext("plugin", plugin);

    const store = plugin.getStore(calendar);
    console.log("🚀 ~ file: UI.svelte:15 ~ store:", store);

    $: {
        if (store) {
            setTypedContext("store", writable(store));
            const ephemeralStore = store.getEphemeralStore();
            setTypedContext("ephemeralStore", writable(ephemeralStore));
        }
    }
</script>

{#if !store}
    <p>No calendars created! Create one in settings to get started.</p>
{:else}
    {#key store}
        <div class="calendar-container calendarium">
            <Calendar />
        </div>
    {/key}
{/if}

<style scoped>
    .calendar-container {
        padding: 0 8px 20px 8px;
        background: inherit;
        display: flex;
        flex-flow: column;
        overflow: hidden;
        height: 100%;
    }
</style>
