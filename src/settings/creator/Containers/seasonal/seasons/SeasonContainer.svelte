<script lang="ts">
    import { getContext } from "svelte";
    import AddNew from "../../../Utilities/AddNew.svelte";
    import NoExistingItems from "../../../Utilities/NoExistingItems.svelte";
    import Details from "../../../Utilities/Details.svelte";
    import { SeasonType, type Season } from "src/schemas/calendar/seasonal";
    import { CreateSeasonModal } from "./seasons";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import ToggleComponent from "src/settings/creator/Settings/ToggleComponent.svelte";
    import SeasonItem from "./SeasonItem.svelte";
    import DropZone from "src/settings/creator/Utilities/DropZone.svelte";
    import TextComponent from "src/settings/creator/Settings/TextComponent.svelte";
    import ButtonComponent from "src/settings/creator/Settings/ButtonComponent.svelte";
    import { getEffectiveYearLength } from "src/utils/functions";

    const calendar = getContext("store");
    const { seasonStore, seasonOffset, seasonType, displaySeasonColors } =
        calendar;

    const deleteSeason = (item: Season) => {
        console.log("🚀 ~ file: SeasonContainer.svelte:17 ~ item:", item);

        seasonStore.delete(item.id);
    };

    const add = (name: string) => {
        const modal = new CreateSeasonModal($calendar, $seasonType, name);
        modal.onClose = () => {
            seasonStore.add({ ...modal.item });
        };
        modal.open();
    };
    const edit = (item: Season) => {
        const modal = new CreateSeasonModal(
            $calendar,
            $seasonType,
            item.name,
            item,
        );
        modal.onClose = () => {
            seasonStore.update(item.id, { ...modal.item });
        };
        modal.open();
    };

    function distribute(): void {
        const period = Number(
            (
                getEffectiveYearLength($calendar) / $seasonStore.length
            ).toPrecision(10),
        );
        for (const season of $seasonStore) {
            if (season.type === SeasonType.PERIODIC) {
                season.duration = period;
            }
        }
        $seasonStore = $seasonStore;
    }
</script>

<Details
    name={"Seasons"}
    desc={`${$seasonStore.length} season${$seasonStore.length != 1 ? "s" : ""}`}
>
    <div class="setting-item">
        <SettingItem>
            <div slot="name">Season type</div>
            <div slot="desc">
                Change how the start and end date for seasons are calculated
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
    </div>
    <ToggleComponent
        name={"Display seasonal colors"}
        desc={"Show seasonal colors on the calendar"}
        value={$displaySeasonColors}
        on:click={(evt) => ($displaySeasonColors = !$displaySeasonColors)}
    ></ToggleComponent>
    <TextComponent
        name={"Seasonal offset"}
        desc={"Offset the first season from the start of the year. An offset of 0 means the seasons start on 1/1/0001."}
        value={$seasonOffset}
        on:change={(evt) => ($seasonOffset = evt.detail)}
    ></TextComponent>
    {#if $seasonType == SeasonType.PERIODIC}
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
                    items={$seasonStore}
                    onDrop={(items) => seasonStore.set(items)}
                    component={SeasonItem}
                    on:delete={(e) => deleteSeason(e.detail)}
                    on:advanced={(e) => edit(e.detail)}
                />
            {/key}
            <!--             {#each $seasonStore as season}
                <SeasonItem
                    {season}
                    on:delete={() => deleteSeason(season)}
                    on:edit={() => edit(season)}
                />
            {/each} -->
        </div>
    {/if}

    <AddNew on:add={(evt) => add(evt.detail)} />
</Details>

<style>
    .existing-items {
        margin-top: 1rem;
    }
</style>
