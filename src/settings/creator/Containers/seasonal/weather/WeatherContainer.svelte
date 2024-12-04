<script lang="ts">
    import { ExtraButtonComponent, Platform } from "obsidian";
    import { UnitSystem } from "src/schemas/weather/weather";
    import DropdownComponent from "src/settings/creator/Settings/DropdownComponent.svelte";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import TextComponent from "src/settings/creator/Settings/TextComponent.svelte";
    import ToggleComponent from "src/settings/creator/Settings/ToggleComponent.svelte";
    import AddNew from "src/settings/creator/Utilities/AddNew.svelte";
    import Details from "src/settings/creator/Utilities/Details.svelte";
    import { getWeatherSeed } from "src/utils/functions";
    import { getContext } from "svelte";
    import WeatherEffect from "./WeatherEffect.svelte";
    import DropZone from "src/settings/creator/Utilities/DropZone.svelte";
    const calendar = getContext("store");
    const { weatherStore } = calendar;
    const { enabled, seed, tempUnitsStore, windUnitsStore, effects } =
        weatherStore;

    const newSeed = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("rotate-ccw");
    };

    const add = (name: string) => {};
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

        <SettingItem heading={true}>
            <div slot="name">Effects</div>
            <div slot="desc">
                <span>
                    The weather generation model will take these effects into
                    account when determining the weather for a given day.
                </span>
                <br />
                <span
                    >Each effect will be calculated <strong>in order</strong> and
                    compared to their conditions (if any).</span
                >
            </div>
        </SettingItem>
        <DropZone
            items={$effects}
            type="weather-effects"
            component={WeatherEffect}
            onDrop={(items) => ($effects = [...items])}
        ></DropZone>

        <AddNew on:add={(evt) => add(evt.detail)} />
    {/if}
</Details>
