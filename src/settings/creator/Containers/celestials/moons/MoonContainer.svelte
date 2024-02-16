<script lang="ts">
    import { getContext } from "svelte";

    import { ExtraButtonComponent } from "obsidian";
    import AddNew from "../../../Utilities/AddNew.svelte";
    import NoExistingItems from "../../../Utilities/NoExistingItems.svelte";
    import ToggleComponent from "../../../Settings/ToggleComponent.svelte";
    import { CreateMoonModal } from "src/settings/modals/moons";
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
    desc={`${$moonStore.length} moon${$moonStore.length != 1 ? "s" : ""}`}
>
    <ToggleComponent
        name={"Display Moons"}
        desc={"Display moons by default when viewing this calendar."}
        value={$displayMoons}
        on:click={() => ($displayMoons = !$displayMoons)}
    />

    <AddNew on:click={() => add()} />

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
                <!-- <div class="moon">
                    <div class="moon-info">
                        <span class="setting-item-name">
                            <MoonSVG
                                moon={{ ...moon, phase: "First Quarter" }}
                                label={false}
                                size={20}
                            />
                            {moon.name}
                        </span>
                        <div class="setting-item-description">
                            <div class="date">
                                <div class="icons">
                                    <span
                                        class="icon small"
                                        use:setNodeIcon={"orbit"}
                                    ></span>
                                    {moon.cycle} days
                                </div>
                                {#if moon.offset}
                                    <div class="icons">
                                        <span
                                            class="icon small"
                                            use:setNodeIcon={"arrow-big-right-dash"}
                                        ></span>
                                        {moon.offset} days
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                    <div class="icons">
                        <div class="icon" use:edit on:click={() => add(moon)} />
                        <div
                            class="icon"
                            use:trash
                            on:click={() => deleteMoon(moon)}
                        />
                    </div>
                </div> -->
            {/each}
        </div>
    {/if}
</Details>

<style>
</style>
