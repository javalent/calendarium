<script lang="ts">
    import { ExtraButtonComponent, Platform } from "obsidian";
    import { UnitSystem } from "src/schemas/calendar/seasonal";
    import DropdownComponent from "src/settings/creator/Settings/DropdownComponent.svelte";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import TextComponent from "src/settings/creator/Settings/TextComponent.svelte";
    import ToggleComponent from "src/settings/creator/Settings/ToggleComponent.svelte";
    import Details from "src/settings/creator/Utilities/Details.svelte";
    import { getWeatherSeed, translateTemperature } from "src/utils/functions";
    import { getContext } from "svelte";
    const calendar = getContext("store");
    const { weatherStore } = calendar;
    const { enabled, seed, tempUnitsStore, windUnitsStore, freezingPointStore } = weatherStore;

    const newSeed = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("rotate-ccw");
    };
    
    $: usesFahrenheit = $tempUnitsStore === UnitSystem.IMPERIAL;
    $: shownFreezingTemperature = usesFahrenheit ? translateTemperature($freezingPointStore, "Imperial", "Metric") : $freezingPointStore;
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
                <div slot="name">Freezing temperature</div>
                <div slot="desc">Sets the temperature at which rain turns into snow. Default is 0 for Celsius, and 32 for Fahrenheit.</div>
                <input
                    slot="control"
                    type="number"
                    bind:value={shownFreezingTemperature}
                    on:change={(e) => {
                            const temperature = Number(e?.currentTarget.value ?? 0);
                            const tempInCelsius = usesFahrenheit ? translateTemperature(temperature, "Metric", "Imperial") : temperature;
                            $freezingPointStore = tempInCelsius;
                        }
                    }
                />
            </SettingItem>
        </div>
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
        <div class="setting-item">
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
        </div>
    {/if}
</Details>
