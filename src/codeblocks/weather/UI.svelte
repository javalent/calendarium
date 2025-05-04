<script lang="ts">
    import type { ViewParent } from "src/calendar/view.types";
    import { setTypedContext } from "src/calendar/view.utils";
    import type { CalendarStore } from "src/stores/calendar.store";
    import { writable } from "svelte/store";
    import WeatherView from "./ui/WeatherView.svelte";

    export let store: CalendarStore | null;
    export let view: ViewParent;
    $: {
        if (store) {
            setTypedContext("store", writable(store));
            setTypedContext(
                "ephemeralStore",
                writable(store.getEphemeralStore(view.id)),
            );
        }
    }
</script>

{#if !store}
    <p>No calendars created! Create one in settings to get started.</p>
{:else}
    <div class="calendar-container calendarium">
        {#key store}
            <WeatherView />
        {/key}
    </div>
{/if}
