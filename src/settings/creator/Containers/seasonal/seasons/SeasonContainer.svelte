<script lang="ts">
    import { getContext } from "svelte";
    import AddNew from "../../../Utilities/AddNew.svelte";
    import NoExistingItems from "../../../Utilities/NoExistingItems.svelte";
    import Details from "../../../Utilities/Details.svelte";
    import {
        SeasonType,
        type PeriodicSeason,
        type Season,
    } from "src/schemas/calendar/seasonal";
    import { CreateSeasonModal } from "./modal/seasons";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import ToggleComponent from "src/settings/creator/Settings/ToggleComponent.svelte";
    import SeasonItem from "./SeasonItem.svelte";
    import DropZone from "src/settings/creator/Utilities/DropZone.svelte";
    import TextComponent from "src/settings/creator/Settings/TextComponent.svelte";
    import ButtonComponent from "src/settings/creator/Settings/ButtonComponent.svelte";
    import { getEffectiveYearLength } from "src/utils/functions";
    import { Platform } from "obsidian";

    const calendar = getContext("store");
    const {
        seasonStore,
        seasonOffset,
        seasonType,
        displaySeasonalColors,
        interpolateColors,
    } = calendar;

    const deleteSeason = (item: Season) => {
        seasonStore.delete(item.id);
    };

    const add = (name: string) => {
        const modal = new CreateSeasonModal(
            $calendar,
            calendar,
            $seasonType,
            name,
        );
        modal.onClose = () => {
            if (!modal.valid) return;
            seasonStore.add({ ...modal.item });
        };
        modal.open();
    };
    const edit = (item: Season) => {
        const modal = new CreateSeasonModal(
            $calendar,
            calendar,
            $seasonType,
            item.name,
            item,
        );
        modal.onClose = () => {
            if (!modal.valid) return;
            seasonStore.update(item.id, { ...modal.item });
        };
        modal.open();
    };

    $: effectiveLength = getEffectiveYearLength($calendar);
    $: seasonalLength = ($seasonStore as PeriodicSeason[]).reduce(
        (a, b) => a + (b.duration ?? 0),
        0,
    );
    $: couldDrift = Math.abs(effectiveLength - seasonalLength) > 0.001;

    function distribute(): void {
        const period = Number(
            (
                getEffectiveYearLength($calendar) / $seasonStore.length
            ).toPrecision(10),
        );
        for (const season of $seasonStore as PeriodicSeason[]) {
            season.duration = period;
        }
        $seasonStore = $seasonStore;
    }
    $: typedSeason = $seasonStore as PeriodicSeason[];
</script>

<Details
    name={"Seasons"}
    open={Platform.isDesktop}
    desc={`${$seasonStore.length} season${$seasonStore.length != 1 ? "s" : ""}`}
    warn={$seasonType === SeasonType.PERIODIC && couldDrift}
    label={"Your seasons are not fully distributed and could drift over time."}
>
    <ToggleComponent
        name={"Display seasonal colors"}
        desc={"Show seasonal colors on the calendar. Can be changed using the calendar settings menu."}
        value={$displaySeasonalColors}
        on:click={() => ($displaySeasonalColors = !$displaySeasonalColors)}
    ></ToggleComponent>
    {#if $displaySeasonalColors}
        <ToggleComponent
            name={"Gradient seasonal colors"}
            desc={"When seasonal colors are displayed, show a gradient between one color and the next."}
            value={$interpolateColors}
            on:click={() => ($interpolateColors = !$interpolateColors)}
        ></ToggleComponent>
    {/if}

    <SettingItem>
        <div slot="name">Season type</div>
        <div slot="desc">
            Change how the start and end dates for seasons are calculated
        </div>
        <select slot="control" class="dropdown" bind:value={$seasonType}>
            <option
                value={SeasonType.DATED}
                selected={$seasonType === SeasonType.DATED}
                >{SeasonType.DATED}</option
            >
            <option
                value={SeasonType.PERIODIC}
                selected={$seasonType === SeasonType.PERIODIC}
                >{SeasonType.PERIODIC}</option
            >
        </select>
    </SettingItem>
    {#if $seasonType == SeasonType.PERIODIC}
        <TextComponent
            name={"Seasonal offset"}
            desc={"Offset the first season from the start of the year. An offset of 0 means the seasons start on 1/1/0001."}
            value={$seasonOffset}
            type={"number"}
            on:change={(evt) => ($seasonOffset = evt.detail)}
        ></TextComponent>
        <ButtonComponent
            name="Distribute seasonal periods"
            desc="Evenly distribute the year between your seasons, taking into account month length and leap days."
            icon="align-vertical-space-around"
            on:click={() => distribute()}
        ></ButtonComponent>
    {/if}
    {#if !$seasonStore.length}
        <NoExistingItems message={"Create a new season to see it here."} />
    {:else}
        <div class="existing-items">
            {#key $seasonStore}
                <DropZone
                    type="season"
                    items={typedSeason}
                    onDrop={(items) => seasonStore.set(items)}
                    dragDisabled={$seasonType === SeasonType.DATED}
                    component={SeasonItem}
                    on:delete={(e) => deleteSeason(e.detail)}
                    on:advanced={(e) => edit(e.detail)}
                />
            {/key}
        </div>
    {/if}

    <AddNew on:add={(evt) => add(evt.detail)} />
</Details>

<style>
    .existing-items {
        margin-top: 1rem;
    }
</style>
