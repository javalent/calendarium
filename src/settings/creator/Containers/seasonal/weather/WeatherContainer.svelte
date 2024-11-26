<script lang="ts">
    import { ExtraButtonComponent, Platform } from "obsidian";
    import { UnitSystem } from "src/schemas/weather/weather";
    import DropdownComponent from "src/settings/creator/Settings/DropdownComponent.svelte";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import TextComponent from "src/settings/creator/Settings/TextComponent.svelte";
    import ToggleComponent from "src/settings/creator/Settings/ToggleComponent.svelte";
    import Details from "src/settings/creator/Utilities/Details.svelte";
    import { getWeatherSeed } from "src/utils/functions";
    import { getContext } from "svelte";
    const calendar = getContext("store");
    const { weatherStore } = calendar;
    const { enabled, seed, tempUnitsStore, windUnitsStore } = weatherStore;

    const newSeed = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("rotate-ccw");
    };
</script>

<Details
    name={"Weather"}
    open={Platform.isDesktop}
    desc={$enabled ? "Enabled" : "Disabled"}
>
    <ToggleComponent
        name="Enable weather"
        value={$enabled}
        on:click={() => ($enabled = !$enabled)}
    ></ToggleComponent>
    {#if $enabled}
        <!-- svelte-ignore missing-declaration -->
        <TextComponent
            name="Seed"
            desc={createFragment((e) => {
                e.createSpan({
                    text: "This will be used to do all weather calculations.",
                });
                e.createEl("br");
                e.createSpan({
                    text: "The same seed will return the same weather for the same calendar.",
                });
            })}
            value={$seed}
            type="number"
        >
            <div
                slot="additional"
                use:newSeed
                on:click={() => ($seed = getWeatherSeed())}
            ></div>
        </TextComponent>

        <div class="setting-item">
            <SettingItem>
                <div slot="name">Temperature units</div>
                <select
                    slot="control"
                    class="dropdown"
                    bind:value={$tempUnitsStore}
                >
                    <option
                        value={UnitSystem.IMPERIAL}
                        selected={$tempUnitsStore === UnitSystem.IMPERIAL}
                        >{UnitSystem.IMPERIAL}</option
                    >
                    <option
                        value={UnitSystem.METRIC}
                        selected={$tempUnitsStore === UnitSystem.METRIC}
                        >{UnitSystem.METRIC}</option
                    >
                </select>
            </SettingItem>
        </div>
        <!--         <div class="setting-item">
            <SettingItem>
                <div slot="name">Wind units</div>
                <select
                    slot="control"
                    class="dropdown"
                    bind:value={$windUnitsStore}
                >
                    <option
                        value={UnitSystem.IMPERIAL}
                        selected={$windUnitsStore === UnitSystem.IMPERIAL}
                        >{UnitSystem.IMPERIAL}</option
                    >
                    <option
                        value={UnitSystem.METRIC}
                        selected={$windUnitsStore === UnitSystem.METRIC}
                        >{UnitSystem.METRIC}</option
                    >
                </select>
            </SettingItem>
        </div> -->

        <div class="setting-item">
            <SettingItem></SettingItem>
        </div>
    {/if}
</Details>
