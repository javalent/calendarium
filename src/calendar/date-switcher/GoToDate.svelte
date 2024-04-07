<script lang="ts">
    import type Calendarium from "src/main";
    import DateWithValidation from "src/settings/creator/Utilities/DateWithValidation.svelte";
    import createCreatorStore from "src/settings/creator/stores/calendar";
    import type { CalendarStore } from "src/stores/calendar.store";
    import { createEventDispatcher } from "svelte";
    import { setContext } from "svelte";
    import { derived, writable } from "svelte/store";

    export let store: CalendarStore;
    export let plugin: Calendarium;

    const ephemeral = store.ephemeralStore;
    const { displaying } = ephemeral;

    const date = writable($displaying);

    setContext("store", createCreatorStore(plugin, $store));

    const valid = writable(true);

    const dispatch = createEventDispatcher<{ close: void }>();

    const go = () => {
        if (!$valid) return;
        store.ephemeralStore.displayDate($date);
        dispatch("close");
    };
</script>

<DateWithValidation {date} on:valid={(evt) => ($valid = evt.detail)} />

<div class="calendarium-modal-buttons setting-item">
    <button
        disabled={!$valid}
        class="mod-cta"
        on:click={() => {
            go();
        }}>Go</button
    >
</div>
