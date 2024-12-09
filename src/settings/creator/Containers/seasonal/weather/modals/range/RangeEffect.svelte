<script lang="ts">
    import {
        WeatherUnitKind,
        type RangeWeatherEffect,
        type RangeWeatherEffectData,
    } from "src/schemas/weather/effects";
    import { UnitSystem } from "src/schemas/weather/weather";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import { translateTemperature } from "src/utils/functions";
    import { writable } from "svelte/store";
    import DecoratedInput from "../DecoratedInput.svelte";

    export let effect: RangeWeatherEffect;
    export let data: RangeWeatherEffectData;

    export let units: UnitSystem;

    const temp = effect.unit === WeatherUnitKind.TEMPERATURE;

    const minimum = writable(
        temp ? translateTemperature(data[0], units) : data[0],
    );
    minimum.subscribe((v) => {
        data[0] = temp ? translateTemperature(v, UnitSystem.METRIC, units) : v;
    });
    const maximum = writable(
        temp ? translateTemperature(data[1], units) : data[1],
    );
    maximum.subscribe((v) => {
        data[1] = temp ? translateTemperature(v, UnitSystem.METRIC, units) : v;
    });
</script>

<SettingItem>
    <div slot="name" class="flex-center">Range</div>
    <div slot="control" class="setting-item-control">
        <DecoratedInput
            value={$minimum}
            label={temp ? (units === UnitSystem.IMPERIAL ? "°F" : "°C") : null}
            placeholder={"min"}
        />
        <DecoratedInput
            value={$maximum}
            label={temp ? (units === UnitSystem.IMPERIAL ? "°F" : "°C") : null}
            placeholder={"max"}
        />
    </div>
</SettingItem>

<style scoped>
    .flex-center {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
</style>
