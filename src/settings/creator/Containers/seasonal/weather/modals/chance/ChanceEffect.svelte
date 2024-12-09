<script lang="ts">
    import type { RangeWeatherEffect } from "src/schemas/weather/effects";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import { createEventDispatcher } from "svelte";
    import { writable } from "svelte/store";
    import DecoratedInput from "../DecoratedInput.svelte";

    const dispatch = createEventDispatcher<{ change: number }>();
    export let value: number;
    function percentize(number: number): number {
        return Number((number / 100).toPrecision(2));
    }

    const chance = writable(Math.round(value * 100));
    chance.subscribe((v) => {
        value = percentize(Math.min(Math.max(0, v), 100));
        dispatch("change", value);
    });
</script>

<SettingItem>
    <div slot="name">Base chance</div>
    <div slot="control">
        <DecoratedInput bind:value={$chance} label={"%"} min={0} max={100} />
    </div>
</SettingItem>
