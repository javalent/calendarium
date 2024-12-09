<script lang="ts">
    import { getTypedContext } from "src/calendar/view.utils";
    import { stringifyTemperature } from "src/utils/functions";
    import { setNodeIcon } from "src/utils/icons";
    import { derived, type Readable } from "svelte/store";
    import { createPopperActions } from "svelte-popperjs";
    import {
        WeatherEffectDisplay,
        WeatherEffectKind,
        type CalculatedWeatherEffect,
    } from "src/schemas/weather/effects";

    const store = getTypedContext("store");

    $: staticStore = $store.staticStore;
    $: units = derived(staticStore.weather, (data) => data.tempUnits);

    export let weather: Readable<CalculatedWeatherEffect[] | null>;

    $: mainIcon = derived([staticStore.weather, weather], ([data, weather]) => {
        for (const effect of weather ?? []) {
            if (effect.icon) return effect.icon;
        }
        return data.defaultIcon;
    });

    $: main =
        $weather?.filter(
            (e) =>
                e.display === WeatherEffectDisplay.MAIN ||
                e.display === WeatherEffectDisplay.BOTH,
        ) ?? [];
    $: tooltips =
        $weather?.filter(
            (e) =>
                e.display === WeatherEffectDisplay.TOOLTIP ||
                e.display === WeatherEffectDisplay.BOTH,
        ) ?? [];

    const [popperRef, popperContent] = createPopperActions({
        placement: "top",
        strategy: "absolute",
    });
    const extraOpts = {
        modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
    };

    export let showTooltip = false;

    const translateUnit = (
        value: number,
        effect: CalculatedWeatherEffect,
    ): string => {
        switch (effect.unit) {
            case "Temperature":
                return stringifyTemperature(value, $units);
            case "None":
            case "Wind":
                return `${Math.round(value)}`;
        }
    };
</script>

{#if $weather}
    <div
        class="weather"
        use:popperRef
        on:mouseenter={() => (showTooltip = true)}
        on:mouseleave={() => (showTooltip = false)}
    >
        <div class="weather-line">
            {#each main as effect}
                {#if effect.kind === WeatherEffectKind.RANGE}
                    <div>{translateUnit(effect.value, effect)}</div>
                {/if}
                {#if effect.kind === WeatherEffectKind.CHANCE_TABLE}
                    {effect.strength}
                {/if}
            {/each}
            <div use:setNodeIcon={$mainIcon} />
        </div>
    </div>

    {#if showTooltip}
        <div class="tooltip weather-tooltip" use:popperContent={extraOpts}>
            {#each tooltips as effect}
                <div class="weather-line">
                    {#if effect.icon}
                        <div use:setNodeIcon={effect.icon} />
                    {/if}
                    {#if effect.kind === WeatherEffectKind.RANGE}
                        <div>
                            {translateUnit(
                                effect.range[0],
                                effect,
                            )}-{translateUnit(effect.range[1], effect)}
                        </div>
                    {/if}
                    {#if effect.kind === WeatherEffectKind.CHANCE_TABLE}
                        {effect.strength}
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
{/if}

<style>
    .weather {
        display: flex;
        gap: 0.25rem;
        justify-content: center;
    }
    .tooltip {
        left: unset;
        top: unset;
        bottom: unset;
        right: unset;
        transform: unset;
        animation: unset;
        display: flex;
        flex-flow: column;
        justify-content: flex-start;
        width: max-content;
    }
    .weather-line {
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        gap: 0.25rem;
    }
</style>
