<script lang="ts">
    import { getTypedContext } from "src/calendar/view.utils";
    import type { Weather } from "src/schemas/calendar/weather";
    import {
        stringifyTemperature,
        translateTemperature,
    } from "src/utils/functions";
    import { setNodeIcon } from "src/utils/icons";
    import { onMount } from "svelte";
    import { derived, writable, type Readable } from "svelte/store";
    import { createPopperActions } from "svelte-popperjs";

    const store = getTypedContext("store");
    $: staticStore = $store.staticStore;
    $: units = derived(staticStore.seasonal, (data) => data.weather.tempUnits);
    $: freezingPoint = derived(staticStore.weather, (data) => data.freezingPoint);

    export let weather: Readable<Weather | null>;

    enum WeatherIcon {
        SUNNY = "sun-medium",
        PARTLY_CLOUDY = "cloud-sun",
        MOSTLY_CLOUDY = "cloud",
        CLOUDY = "cloudy",
        LIGHT_RAIN = "cloud-drizzle",
        RAIN = "cloud-rain",
        HEAVY_RAIN = "cloud-rain-wind",
        SNOW = "cloud-snow",
        HEAVY_SNOW = "snowflake",
        STORM = "cloud-lightning",
        WINDY = "wind",
        TORNADO = "tornado",
    }

    $: icon = derived(weather, (weather) => {
        if (!weather) return WeatherIcon.SUNNY;
        if (weather.precipitation.index === 0) {
            //check clouds & wind
            if (weather.clouds.index > 0) {
                if (weather.clouds.index === 1) {
                    return WeatherIcon.PARTLY_CLOUDY;
                }
                if (weather.clouds.index === 2) {
                    return WeatherIcon.MOSTLY_CLOUDY;
                }
                return WeatherIcon.CLOUDY;
            }
            if (weather.wind.index > 5) {
                return WeatherIcon.WINDY;
            }

            return WeatherIcon.SUNNY;
        }

        if (weather.precipitation.index > 0) {
            const precip = weather.precipitation.index;
            if (weather.temperature.actual < $freezingPoint && precip <= 3)
                return WeatherIcon.SNOW;
            if (weather.temperature.actual < $freezingPoint) return WeatherIcon.HEAVY_SNOW;

            if (weather.clouds.strength === "Dark storm clouds" && precip >= 5)
                return WeatherIcon.STORM;
            if (precip <= 2) return WeatherIcon.LIGHT_RAIN;
            if (precip <= 4) return WeatherIcon.RAIN;
            return WeatherIcon.HEAVY_RAIN;
        }

        return WeatherIcon.SUNNY;
    });
    const [popperRef, popperContent] = createPopperActions({
        placement: "top",
        strategy: "absolute",
    });
    const extraOpts = {
        modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
    };

    export let showTooltip = false;
</script>

{#if $weather}
    <div
        class="weather"
        use:popperRef
        on:mouseenter={() => (showTooltip = true)}
        on:mouseleave={() => (showTooltip = false)}
    >
        <div class="temperature">
            <div class="actual">
                {stringifyTemperature($weather.temperature.actual, $units)}
            </div>
        </div>
        {#key $icon}
            <div class="icon" use:setNodeIcon={$icon}></div>
        {/key}
    </div>

    {#if showTooltip}
        <div class="tooltip weather-tooltip" use:popperContent={extraOpts}>
            <div class="weather-line temperature">
                <div use:setNodeIcon={"thermometer"} />
                <span class="weather-information">
                    {stringifyTemperature($weather.temperature.low, $units)} to {stringifyTemperature(
                        $weather.temperature.high,
                        $units,
                    )}
                </span>
            </div>
            <div class="weather-line precipitation">
                <div use:setNodeIcon={"cloud-drizzle"} />
                <span>{$weather.precipitation.strength}</span>
            </div>
            <div class="weather-line wind">
                <div use:setNodeIcon={"wind"} />
                <span>{$weather.wind.strength} ({$weather.wind.direction})</span
                >
            </div>
            <div class="weather-line clouds">
                <div use:setNodeIcon={"cloudy"} />
                <span>{$weather.clouds.strength}</span>
            </div>
        </div>
    {/if}
{/if}

<style>
    .weather {
        display: flex;
        gap: 0.25rem;
        justify-content: center;
    }
    .temperature {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    .actual {
        font-size: larger;
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
