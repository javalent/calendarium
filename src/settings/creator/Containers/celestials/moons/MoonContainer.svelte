<script lang="ts">
    import { getContext } from "svelte";

    import { ExtraButtonComponent, Platform } from "obsidian";
    import AddNew from "../../../Utilities/AddNew.svelte";
    import NoExistingItems from "../../../Utilities/NoExistingItems.svelte";
    import ToggleComponent from "../../../Settings/ToggleComponent.svelte";
    import { CreateMoonModal, getDefaultMoon } from "src/settings/creator/Containers/celestials/moons/moons";
    import type Calendarium from "src/main";
    import Details from "../../../Utilities/Details.svelte";
    import type { Moon } from "src/schemas/calendar/moons";
    import MoonInstance from "./MoonInstance.svelte";

    const calendar = getContext("store");
    const plugin = getContext("plugin");
    const { moonStore, displayMoons } = calendar;

    const deleteMoon = (item: Moon) => {
        moonStore.delete(item.id);
    };

    const add = (moon?: Moon) => {
        const modal = new CreateMoonModal(plugin.app, $calendar, moon);
        modal.onClose = () => {
            if (!modal.saved) return;
            if (modal.editing && moon) {
                moonStore.update(moon.id, { ...modal.moon });
            } else {
                moonStore.add({ ...modal.moon });
            }
        };
        modal.open();
    };
</script>

<Details
    name={"Moons"}
    open={Platform.isDesktop}
    desc={`${$moonStore.length} moon${$moonStore.length != 1 ? "s" : ""}`}
>
    <ToggleComponent
        name={"Display moons"}
        desc={"Display moons by default when viewing this calendar."}
        value={$displayMoons}
        on:click={() => ($displayMoons = !$displayMoons)}
    />

    {#if !$moonStore.length}
        <NoExistingItems message={"Create a new moon to see it here."} />
    {:else}
        <div class="existing-items">
            {#each $moonStore as moon}
                <MoonInstance
                    {moon}
                    on:edit={() => add(moon)}
                    on:delete={() => deleteMoon(moon)}
                />
            {/each}
        </div>
    {/if}

    <AddNew on:add={(evt) => add(getDefaultMoon(evt.detail))} />
</Details>

<style>
</style>
