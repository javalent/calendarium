<script lang="ts">
    import { getContext } from "svelte";
    import AddNew from "../../Utilities/AddNew.svelte";
    import Details from "../../Utilities/Details.svelte";
    import { Platform } from "obsidian";
    import SettingItem from "../../Settings/SettingItem.svelte";
    import NoExistingItems from "../../Utilities/NoExistingItems.svelte";
    import { LocationModal } from "./modal/locations";
    import { nanoid } from "src/utils/functions";
    import DropZone from "../../Utilities/DropZone.svelte";
    import LocationInstance from "./LocationInstance.svelte";
    import { SeasonKind, type Weathered } from "src/schemas/calendar/seasonal";
    import { NO_LOCATION, type Location } from "src/schemas/calendar/locations";
    import copy from "fast-copy";

    const calendar = getContext("store");
    const { locationStore, seasonStore, weatherStore } = calendar;
    const units = weatherStore.tempUnitsStore;
    const defaultLocationStore = locationStore.defaultLocationStore;

    const add = (name: string) => {
        const data = $seasonStore.reduce((a, b) => {
            let weathered: Weathered;
            if (b.kind === SeasonKind.CUSTOM) {
                weathered = {
                    weatherOffset: b.weatherOffset,
                    weatherPeak: b.weatherPeak,
                    kind: b.kind,
                    weather: { ...b.weather },
                };
            } else {
                weathered = {
                    weatherOffset: b.weatherOffset,
                    weatherPeak: b.weatherPeak,
                    kind: b.kind,
                };
            }
            return {
                ...a,
                [b.id]: weathered,
            };
        }, {});
        const modal = new LocationModal(
            {
                name,
                id: nanoid(6),
                seasons: data,
            },
            $seasonStore,
            $units,
        );
        modal.onClose = () => locationStore.add(modal.item);
        modal.open();
    };

    const edit = (location: Location) => {
        const modal = new LocationModal(
            copy(location),
            $seasonStore,
            $units,
            false,
        );
        modal.onClose = () => locationStore.update(location.id, modal.item);
        modal.open();
    };
</script>

<Details
    name={"Locations"}
    open={Platform.isDesktop}
    desc={`${$locationStore.length} location${$locationStore.length != 1 ? "s" : ""}`}
>
    <SettingItem>
        <div slot="desc">
            Locations are different regions of your world that can have their
            own weather settings.
        </div>
    </SettingItem>
    {#if !$locationStore.length}
        <NoExistingItems message={"Create a new location to see it here."} />
    {:else}
        <SettingItem>
            <div slot="name">Default location</div>
            <div slot="desc">Choose a location to use by default.</div>
            <div slot="control">
                <select class="dropdown" bind:value={$defaultLocationStore}>
                    <option
                        value={NO_LOCATION}
                        selected={$defaultLocationStore == NO_LOCATION}
                        >None</option
                    >
                    {#each $locationStore as location}
                        <option
                            value={location.id}
                            selected={location.id == $defaultLocationStore}
                            >{location.name}</option
                        >
                    {/each}
                </select>
            </div>
        </SettingItem>
        <DropZone
            component={LocationInstance}
            items={$locationStore}
            type="location"
            onDrop={(locations) => ($locationStore = [...locations])}
            on:advanced={(evt) => edit(evt.detail)}
            on:trash={(evt) => locationStore.delete(evt.detail.id)}
        />
    {/if}
    <AddNew on:add={(evt) => add(evt.detail)} />
</Details>

<style>
</style>
