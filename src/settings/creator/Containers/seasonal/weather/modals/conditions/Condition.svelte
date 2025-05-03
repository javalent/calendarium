<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import type { Calendar } from "src/schemas";
    import type { Location } from "src/schemas/calendar/locations";
    import {
        WeatherEffectConditionType,
        type WeatherEffectCondition,
    } from "src/schemas/weather/conditions";
    import type { WeatherEffect } from "src/schemas/weather/effects";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import { EDIT, setNodeIcon, TRASH } from "src/utils/icons";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher<{ edit: null; trash: null }>();

    export let locations: Location[];
    export let effects: WeatherEffect[];
    export let condition: WeatherEffectCondition;

    const icon = () => {
        switch (condition.type) {
            case WeatherEffectConditionType.GT:
                return "chevron-right";
            case WeatherEffectConditionType.LT:
                return "chevron-left";
            case WeatherEffectConditionType.EQUAL:
                return "equal";
            case WeatherEffectConditionType.LOCATION:
                return "map-pin";
            case WeatherEffectConditionType.TRIGGER:
                return "workflow";
            case WeatherEffectConditionType.INV_TRIGGER:
                return "workflow";
        }
    };
    const advanced = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(EDIT);
    };

    const trash = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(TRASH);
    };
</script>

<SettingItem>
    <div slot="name" class="flex-center">
        <div use:setNodeIcon={icon()} />
        {#if condition.type === WeatherEffectConditionType.LOCATION}
            {@const location = locations.find(
                (l) => l.id == condition.comparator,
            )}
            {#if location}
                <div>Location <strong>is</strong> {location.name}</div>
            {:else}
                <div>Could not find location</div>
            {/if}
        {:else}
            {@const effect = effects.find((e) => e.id === condition.comparator)}
            {#if effect}
                {#if condition.type === WeatherEffectConditionType.TRIGGER}
                    <div>{effect.name} <strong>has</strong> triggered</div>
                {/if}
                {#if condition.type === WeatherEffectConditionType.INV_TRIGGER}
                    <div>{effect.name} <strong>has not</strong> triggered</div>
                {/if}
                {#if condition.type === WeatherEffectConditionType.GT}
                    <div>
                        {effect.name} is <strong>greater than</strong>
                        {condition.value}
                    </div>
                {/if}
                {#if condition.type === WeatherEffectConditionType.LT}
                    <div>
                        {effect.name} is <strong>less than</strong>
                        {condition.value}
                    </div>
                {/if}
                {#if condition.type === WeatherEffectConditionType.EQUAL}
                    <div>
                        {effect.name} is <strong>equal to</strong>
                        {condition.value}
                    </div>
                {/if}
            {:else}
                <div>Could not find effect</div>
            {/if}
        {/if}
    </div>
    <div slot="control" class="flex-center">
        <div use:advanced on:click={() => dispatch("edit")} />
        <div use:trash on:click={() => dispatch("trash")} />
    </div>
</SettingItem>

<style>
    strong {
        color: var(--text-accent);
    }
    .flex-center {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
</style>
