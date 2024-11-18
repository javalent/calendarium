<script lang="ts">
    import { getTypedContext } from "src/calendar/view.utils";
    import type { Weather } from "src/schemas/calendar/weather";
    import { setNodeIcon } from "src/utils/icons";
    import { derived, type Readable } from "svelte/store";

    const store = getTypedContext("store");
    $: staticStore = $store.staticStore;
    $: units = derived(staticStore.seasonal, (data) => data.weather.tempUnits);

    export let weather: Readable<Weather | null>;

    const translateTemperature = (temp: number) => {
        switch ($units) {
            case "Imperial":
                return Math.round((temp * 9) / 5 + 32);
            case "Metric":
                return Math.round(temp);
        }
    };

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
            if (weather.temperature.actual < 0 && precip <= 3)
                return WeatherIcon.SNOW;
            if (weather.temperature.actual < 0) return WeatherIcon.HEAVY_SNOW;

            if (weather.clouds.strength === "Dark storm clouds" && precip >= 5)
                return WeatherIcon.STORM;
            if (precip <= 2) return WeatherIcon.LIGHT_RAIN;
            if (precip <= 4) return WeatherIcon.RAIN;
            return WeatherIcon.HEAVY_RAIN;
        }

        return WeatherIcon.SUNNY;
    });
</script>

{#if $weather}
    <div class="weather">
        <div class="temperature">
            <div class="actual">
                {translateTemperature($weather.temperature.actual)}°
            </div>
        </div>
        {#key $icon}
            <div class="icon" use:setNodeIcon={$icon}></div>
        {/key}
    </div>
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
</style>
