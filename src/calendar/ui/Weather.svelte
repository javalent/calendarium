<script lang="ts">
    import type { CalWeatherCondition, WeatherState } from "../../schemas/calendar/weather";
    import CalendariumMenu from "../../utils/menu";
    import { getTypedContext } from "../view.utils";

    const plugin = getTypedContext("plugin");
    const store = getTypedContext("store");

    $: weatherConditions = $store.weatherConditions;

    export let weatherState: WeatherState;

    $: weatherCondition = $weatherConditions?.find(
        (condition) => condition.id === weatherState.conditionId
    )

    const contextMenu = (evt: MouseEvent) => {
        evt.stopPropagation();
        const menu = new CalendariumMenu(plugin);
        menu.addItem((item) =>
            item.setTitle("Remove weather").onClick(async () => {
                await $store.weatherStateStore.removeWeatherState(weatherState);
            })
        );

        menu.showAtMouseEvent(evt);
    };
</script>

{#if weatherCondition}
    <div
        class="weather-pill"
        aria-label={weatherCondition.name ? `${weatherCondition.name}` : null}
        style="background-color: {weatherCondition.color}40;"
        on:contextmenu={contextMenu}
    >
        {weatherCondition.name}
    </div>
{/if}


<style>
    .weather-pill {
        padding: 0.25rem 0.5rem;
        border-radius: 0.5rem;
    }
</style>
