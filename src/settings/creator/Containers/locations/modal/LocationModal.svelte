<script lang="ts">
    import type { Location } from "src/schemas/calendar/locations";
    import {
        getWeatherData,
        UnitSystem,
        type Season,
    } from "src/schemas/calendar/seasonal";
    import TextComponent from "src/settings/creator/Settings/TextComponent.svelte";
    import WeatherData from "../../seasonal/seasons/modal/WeatherData.svelte";

    export let seasons: Season[];
    export let units: UnitSystem;
    export let location: Location;
</script>

<TextComponent name="Name" bind:value={location.name}></TextComponent>

{#each seasons as season, id}
    {@const lSeason = location.seasons[season.id]}
    {@const data = getWeatherData(lSeason)}
    {#if data}
        <WeatherData {units} {data} />
    {/if}
{/each}
