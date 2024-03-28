<script lang="ts">
    import type { CalEvent } from "src/schemas";
    import type { CalendarStore } from "src/stores/calendar.store";
    import Date from "./Date/Date.svelte";
    import Info from "./Info/Info.svelte";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import { App, ButtonComponent, ExtraButtonComponent } from "obsidian";
    import { createEventDispatcher } from "svelte";
    import type Calendarium from "src/main";
    import { writable } from "svelte/store";

    export let event: CalEvent;
    export let store: CalendarStore;
    export let plugin: Calendarium;

    const eventStore = writable(event);
    eventStore.subscribe((evt) => (event = { ...evt }));

    const dispatch = createEventDispatcher<{ cancel: void }>();

    const cancel = (node: HTMLElement) => {
        new ButtonComponent(node)
            .setButtonText("Cancel")
            .onClick(() => dispatch("cancel"));
    };
</script>

<Info event={eventStore} {plugin} {store} />

<Date event={eventStore} {store} />

<div class="setting-item">
    <SettingItem>
        <div slot="control">
            <div use:cancel />
        </div>
    </SettingItem>
</div>

<style scoped>
</style>
