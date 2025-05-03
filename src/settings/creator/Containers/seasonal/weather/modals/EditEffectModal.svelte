<script lang="ts">
    import {
        getIconIds,
        TextComponent as ObsidianTextComponent,
    } from "obsidian";
    import type { Calendar } from "src/schemas";
    import {
        WeatherEffectCadence,
        WeatherEffectDisplay,
        WeatherEffectKind,
        WeatherUnitKind,
        type WeatherEffect,
    } from "src/schemas/weather/effects";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import TextComponent from "src/settings/creator/Settings/TextComponent.svelte";
    import ToggleComponent from "src/settings/creator/Settings/ToggleComponent.svelte";

    import { IconSuggester } from "./icon";
    import Details from "src/settings/creator/Utilities/Details.svelte";
    import RangeEffect from "./range/RangeEffect.svelte";
    import ChanceEffect from "./chance/ChanceEffect.svelte";
    import { setNodeIcon } from "src/utils/icons";
    import ChanceTableTable from "./chance-table/ChanceTableTable.svelte";
    import Condition from "./conditions/Condition.svelte";

    export let effect: WeatherEffect;
    export let calendar: Calendar;

    const icons = getIconIds().map((v) => v.replace(/^lucide-/, ""));
    const iconEl = (iconEl: HTMLElement) => {
        const text = new ObsidianTextComponent(iconEl);
        const modal = new IconSuggester(app, text, icons);

        modal.onSelect(async (match) => {
            effect.icon = match.item;
            text.setValue(match.item);
            modal.close();
        });
    };

    const updateData = (
        evt: Event & {
            currentTarget: EventTarget & HTMLSelectElement;
        },
    ) => {
        const cadence = evt.currentTarget.value as WeatherEffectCadence;
        if (cadence === WeatherEffectCadence.SEASONAL) {
            effect.data = Object.fromEntries(
                calendar.seasonal.seasons.map((s) => {
                    return [s.id, effect.data as any];
                }),
            );
        } else {
            effect.data = (effect.data as any)[calendar.seasonal.seasons[0].id];
        }
        effect.cadence = cadence;
    };
</script>

<Details name="Details" open={true}>
    <TextComponent name="Name" value={effect.name} />
    <SettingItem>
        <div slot="name">Cadence</div>
        <div slot="desc">
            A seasonal cadence allows an effect to vary between seasons.
        </div>
        <select
            slot="control"
            class="dropdown"
            on:change={(evt) => updateData(evt)}
        >
            <option
                selected={effect.cadence === WeatherEffectCadence.STATIC}
                value={WeatherEffectCadence.STATIC}>Constant</option
            >
            <option
                selected={effect.cadence === WeatherEffectCadence.SEASONAL}
                value={WeatherEffectCadence.SEASONAL}>Seasonal</option
            >
        </select>
    </SettingItem>
    {#if effect.cadence === WeatherEffectCadence.SEASONAL}
        <ToggleComponent
            name="Interpolate between seasons"
            desc="Surrounding seasons will influence this effect up until the 'peak' of the current season."
            value={effect.interpolate}
        />
    {/if}
    <SettingItem>
        <div slot="name">Display type</div>
        <div slot="desc">
            Control how this effect is displayed on the calendar.
        </div>
        <select slot="control" class="dropdown" bind:value={effect.display}>
            <option
                selected={effect.display === WeatherEffectDisplay.NONE}
                value={WeatherEffectDisplay.NONE}>None</option
            >
            <option
                selected={effect.display === WeatherEffectDisplay.TOOLTIP}
                value={WeatherEffectDisplay.TOOLTIP}>Tooltip</option
            >
            <option
                selected={effect.display === WeatherEffectDisplay.MAIN}
                value={WeatherEffectDisplay.MAIN}>Main calendar</option
            >
            <option
                selected={effect.display === WeatherEffectDisplay.BOTH}
                value={WeatherEffectDisplay.BOTH}>Both</option
            >
        </select>
    </SettingItem>
    {#if effect.display !== WeatherEffectDisplay.NONE}
        <SettingItem>
            <div slot="name">Unit system</div>
            <div slot="desc">
                Control how the displayed value is transformed for display.
            </div>
            <select slot="control" class="dropdown" bind:value={effect.unit}>
                <option
                    selected={effect.unit === WeatherUnitKind.NONE}
                    value={WeatherUnitKind.NONE}>None</option
                >
                <option
                    selected={effect.unit === WeatherUnitKind.TEMPERATURE}
                    value={WeatherUnitKind.TEMPERATURE}>Temperature</option
                >
                <!-- <option
                    selected={effect.unit === WeatherUnitKind.WIND}
                    value={WeatherUnitKind.WIND}>Wind</option
                > -->
            </select>
        </SettingItem>
        <SettingItem>
            <div slot="name">Icon (optional)</div>
            <div slot="desc">This icon will be displayed for this effect.</div>
            <div slot="control" use:iconEl></div>
        </SettingItem>
    {/if}</Details
>
{#key effect.unit}
    <Details name="Weather data" open={true}>
        <div class="setting-container">
            <SettingItem>
                <div slot="name">Kind</div>
                <select
                    slot="control"
                    class="dropdown"
                    bind:value={effect.kind}
                >
                    <option
                        selected={effect.kind === WeatherEffectKind.RANGE}
                        value={WeatherEffectKind.RANGE}>Range</option
                    >
                    <option
                        selected={effect.kind === WeatherEffectKind.CHANCE}
                        value={WeatherEffectKind.CHANCE}>Chance</option
                    >
                    <option
                        selected={effect.kind ===
                            WeatherEffectKind.CHANCE_TABLE}
                        value={WeatherEffectKind.CHANCE_TABLE}>Table</option
                    >
                </select>
            </SettingItem>
        </div>
        {#if effect.cadence === WeatherEffectCadence.STATIC}
            {#if effect.kind === WeatherEffectKind.RANGE}
                <RangeEffect
                    {effect}
                    data={effect.data}
                    units={calendar.weather.tempUnits}
                />
            {/if}
            {#if effect.kind === WeatherEffectKind.CHANCE}
                <ChanceEffect
                    value={effect.data}
                    on:change={(evt) => (effect.data = evt.detail)}
                />
            {/if}
            {#if effect.kind === WeatherEffectKind.CHANCE_TABLE}
                <ChanceEffect
                    value={effect.data}
                    on:change={(evt) => (effect.data = evt.detail)}
                />
            {/if}
        {:else}
            {#each calendar.seasonal.seasons as season}
                <SettingItem heading={true}>
                    <div slot="name">{season.name}</div>
                </SettingItem>
                <div class="setting-container">
                    {#if effect.kind === WeatherEffectKind.RANGE}
                        <RangeEffect
                            {effect}
                            data={effect.data[season.id]}
                            units={calendar.weather.tempUnits}
                        />
                    {/if}
                    {#if effect.kind === WeatherEffectKind.CHANCE}
                        <ChanceEffect
                            value={effect.data[season.id]}
                            on:change={(evt) =>
                                (effect.data[season.id] = evt.detail)}
                        />
                    {/if}
                    {#if effect.kind === WeatherEffectKind.CHANCE_TABLE}
                        <ChanceEffect
                            value={effect.data[season.id]}
                            on:change={(evt) =>
                                (effect.data[season.id] = evt.detail)}
                        />
                    {/if}
                </div>
            {/each}
        {/if}

        {#if effect.kind === WeatherEffectKind.CHANCE_TABLE}
            <ChanceTableTable {effect} />
        {/if}
    </Details>

    <Details open={true} name="Conditions">
        {#each effect.conditions as condition}
            <Condition
                {condition}
                effects={calendar.weather.effects}
                locations={calendar.locations.locations}
            />
        {/each}
    </Details>
{/key}

<style scoped>
    .flex-center {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
</style>
