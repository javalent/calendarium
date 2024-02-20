<script lang="ts">
    import type Calendarium from "src/main";
    import type { Calendar } from "src/schemas";
    import { setContext } from "svelte";
    import type { Writable } from "svelte/store";
    import type createStore from "./stores/calendar";
    import QuickCreator from "./QuickCreator.svelte";
    import Creator from "./Creator.svelte";

    export let plugin: Calendarium;
    export let color: string | null = null;
    export let top: number;
    export let store: ReturnType<typeof createStore>;
    export let quick = false;
    setContext<Writable<Calendar>>("store", store);
    setContext<Calendarium>("plugin", plugin);
</script>

{#if quick}
    <QuickCreator on:cancel />
{:else}
    <Creator {top} {color} on:cancel />
{/if}
