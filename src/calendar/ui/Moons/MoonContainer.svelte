<script lang="ts">
    import Moon from "./Moon.svelte";
    import type { MoonState } from "src/schemas/calendar/moons";

    export let moons: MoonState[] = [];
    export let dayView: boolean = false;

    /* export */ let width: number;

    let target: HTMLElement;
</script>

<div class="moon-container" class:full={!dayView} bind:this={target}>
    <div class="left-button"></div>
    <div class="moons">
        {#if target != null}
            {#each moons as moon}
                <Moon {moon} />
            {/each}
        {/if}
    </div>
    <div class="right-button"></div>
</div>

<style>
    .moons {
        display: inline-flex;
        overflow-y: scroll;
    }
</style>
