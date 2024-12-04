<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import {
        WeatherEffectCadence,
        WeatherEffectKind,
        type WeatherEffect,
    } from "src/schemas/weather/effects";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import { setNodeIcon } from "src/utils/icons";
    import { getContext } from "svelte";

    const calendar = getContext("store");
    const { weatherStore } = calendar;
    const { effects } = weatherStore;

    export let item: WeatherEffect;

    $: conditions = item.conditions.map(
        (c) => $effects.find((_c) => c.comparator == _c.id)?.name,
    );
    $: multipliers =
        (item.kind === WeatherEffectKind.CHANCE_TABLE &&
            item.multiplier?.map(
                (c) => $effects.find((_c) => c.base == _c.id)?.name,
            )) ||
        [];
</script>

<SettingItem>
    <div slot="name" class="flexed">
        {#if item.icon}
            <div use:setNodeIcon={item.icon} />
        {/if}
        {item.name}
    </div>
    <div slot="desc" class="flexed">
        {#if item.cadence === WeatherEffectCadence.SEASONAL}
            <div use:setNodeIcon={"sun-snow"} aria-label="Seasonal" />
        {:else}
            <div use:setNodeIcon={"equal-approximately"} aria-label="Static" />
        {/if}

        {#if item.kind === WeatherEffectKind.RANGE}
            <div
                use:setNodeIcon={"chevrons-left-right-ellipsis"}
                aria-label="Range effect"
            />
            {#if item.temperature}
                <div
                    use:setNodeIcon={"thermometer"}
                    aria-label="This effect is a temperature"
                />
            {/if}
        {/if}
        {#if item.kind === WeatherEffectKind.CHANCE_TABLE}
            <div
                use:setNodeIcon={"table-properties"}
                aria-label="Chance table effect"
            />

            {#if item.multiplier?.length}
                <div
                    use:setNodeIcon={"link"}
                    aria-label="Multiplying by {multipliers.join(', ')}"
                />
            {/if}
        {/if}
        {#if item.kind === WeatherEffectKind.CHANCE}
            <div use:setNodeIcon={"percent"} aria-label="Chance effect" />
        {/if}
        {#if item.conditions.length}
            <div
                use:setNodeIcon={"circuit-board"}
                aria-label="Conditional based on {conditions.join(', ')}"
            />
        {/if}
        {#if item.transform?.length}
            <div
                use:setNodeIcon={"square-function"}
                aria-label="Conditional based on {conditions.join(', ')}"
            />
        {/if}
    </div>
    <!-- 
    <div slot="control" class="flexed">
        <div class="icon" use:advanced />
        <div class="icon" use:trash />
    </div> -->
</SettingItem>

<style scoped>
    .flexed {
        display: flex;
        flex-flow: row;
        display: flex;
        gap: 0.25rem;
    }
</style>
