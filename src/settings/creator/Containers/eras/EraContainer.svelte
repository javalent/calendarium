<script lang="ts">
    import { getContext } from "svelte";
    import EraUI from "./EraInstance.svelte";
    import AddNew from "../../Utilities/AddNew.svelte";
    import NoExistingItems from "../../Utilities/NoExistingItems.svelte";
    import Details from "../../Utilities/Details.svelte";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";

    import type { Era } from "src/schemas/calendar/timespans";
    import { EraEditModal } from "./edit/era";
    import { Platform, ToggleComponent } from "obsidian";

    const calendar = getContext("store");
    const plugin = getContext("plugin");

    const { eraStore } = calendar;

    const add = (era: Era | string) => {
        const modal = new EraEditModal(plugin, calendar, era);

        modal.onClose = () => {
            if (typeof era === "string") {
                eraStore.add(modal.era);
            } else {
                eraStore.update(era.id, modal.era);
            }
        };

        modal.open();
    };

    const toggleEra = (node: HTMLElement) => {
        new ToggleComponent(node)
            .setValue(!$calendar.hideEra)
            .onChange(bool => { 
                $calendar.hideEra = !bool;
             });
    };
</script>

<Details
    name={"Eras"}
    open={Platform.isDesktop}
    desc={`${$eraStore.length} era${$eraStore.length != 1 ? "s" : ""}`}
>
    {#if !$eraStore.length}
        <NoExistingItems message={"Create a new era to see it here."} />
    {:else}
        <div class="existing-items">
            {#each $eraStore as era}
                <EraUI
                    {era}
                    on:edit={() => add(era)}
                    on:delete={() => eraStore.delete(era.id ?? "")}
                />
            {/each}
        </div>
    {/if}

    <AddNew placeholder={"Add era"} on:add={(evt) => add(evt.detail)} />

    <div class="setting-item">
        <SettingItem>
            <div slot="name">Display eras on calendar</div>
            <div slot="desc">
                This can always be toggled in the calendar menu.
            </div>
            <div slot="control" use:toggleEra />
        </SettingItem>
    </div>
</Details>

<style>
</style>
