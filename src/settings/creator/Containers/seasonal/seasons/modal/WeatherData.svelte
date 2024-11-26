<script lang="ts">
    import { type SeasonalWeatherData } from "src/schemas/calendar/seasonal";
    import { UnitSystem } from "src/schemas/weather/weather";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import { transformed } from "src/settings/settings.utils";
    import { translateTemperature } from "src/utils/functions";
    import { setNodeIcon } from "src/utils/icons";
    import { writable } from "svelte/store";

    export let units: UnitSystem;
    export let data: SeasonalWeatherData;
    function percentize(number: number): number {
        return Number((number / 100).toPrecision(2));
    }

    const minimum = writable(translateTemperature(data.tempRange[0], units));
    minimum.subscribe((v) => {
        data.tempRange[0] = translateTemperature(v, UnitSystem.METRIC, units);
    });
    const maximum = writable(translateTemperature(data.tempRange[1], units));
    maximum.subscribe((v) => {
        data.tempRange[1] = translateTemperature(v, UnitSystem.METRIC, units);
    });

    const chance = writable(data.precipitationChance * 100);
    chance.subscribe((v) => {
        data.precipitationChance = percentize(v);
    });
    const intensity = writable(data.precipitationIntensity * 100);
    intensity.subscribe((v) => {
        data.precipitationIntensity = percentize(v);
    });
    const wind = writable(data.windy * 100);
    wind.subscribe((v) => {
        data.windy = percentize(v);
    });
    const cloud = writable(data.cloudy * 100);
    cloud.subscribe((v) => {
        data.cloudy = percentize(v);
    });
</script>

<div class="setting-item">
    <SettingItem>
        <div slot="name" class="flex-center">
            <div use:setNodeIcon={"thermometer"} />
            Temperature range
        </div>
        <div slot="desc">
            <span>
                Set the <strong>average</strong> minimum and maximum temperatures
            </span>
        </div>
        <div slot="control" class="setting-item-control">
            <div class="has-decorator">
                <input
                    type="number"
                    spellcheck="false"
                    placeholder="minimum"
                    bind:value={$minimum}
                />
                <!-- value={translateTemperature(data.tempRange[0], units)} -->
                <span class="input-decorator"
                    >°{#if units === UnitSystem.IMPERIAL}F{:else}C{/if}</span
                >
            </div>
            <div class="has-decorator">
                <input
                    type="number"
                    spellcheck="false"
                    placeholder="minimum"
                    bind:value={$maximum}
                />
                <span class="input-decorator"
                    >°{#if units === UnitSystem.IMPERIAL}F{:else}C{/if}</span
                >
            </div>
        </div>
    </SettingItem>
</div>
<div class="setting-item">
    <SettingItem>
        <div slot="name" class="flex-center">
            <div use:setNodeIcon={"droplets"} />
            Precipitation chance
        </div>
        <div slot="desc">
            <span>Increases likelihood of precipitation occuring</span>
        </div>
        <div slot="control">
            <div class="has-decorator">
                <input
                    type="number"
                    spellcheck="false"
                    min="0"
                    max="100"
                    bind:value={$chance}
                />
                <span class="input-decorator">%</span>
            </div>
        </div>
    </SettingItem>
</div>
<div class="setting-item">
    <SettingItem>
        <div slot="name" class="flex-center">
            <div use:setNodeIcon={"cloud-lightning"} />
            Precipitation intensity
        </div>
        <div slot="desc">
            <span>How strong the precipitation is, when it occurs</span>
        </div>
        <div slot="control">
            <div class="has-decorator">
                <input
                    type="number"
                    spellcheck="false"
                    min="0"
                    max="100"
                    bind:value={$intensity}
                />
                <span class="input-decorator">%</span>
            </div>
        </div>
    </SettingItem>
</div>
<div class="setting-item">
    <SettingItem>
        <div slot="name" class="flex-center">
            <div use:setNodeIcon={"wind"} />
            Windiness
        </div>
        <div slot="desc">
            <span>Increases likelihood of stronger wind</span>
        </div>
        <div slot="control">
            <div class="has-decorator">
                <input
                    type="number"
                    spellcheck="false"
                    min="0"
                    max="100"
                    bind:value={$wind}
                />
                <span class="input-decorator">%</span>
            </div>
        </div>
    </SettingItem>
</div>
<div class="setting-item">
    <SettingItem>
        <div slot="name" class="flex-center">
            <div use:setNodeIcon={"cloudy"} />
            Cloudiness
        </div>
        <div slot="desc">
            <span>Increases likelihood of cloud coverage</span>
        </div>
        <div slot="control">
            <div class="has-decorator">
                <input
                    type="number"
                    spellcheck="false"
                    min="0"
                    max="100"
                    bind:value={$cloud}
                />
                <span class="input-decorator">%</span>
            </div>
        </div>
    </SettingItem>
</div>

<style scoped>
    .has-decorator {
        position: relative;
    }
    .has-decorator input {
        padding-right: 10px;
        width: 5rem;
    }
    .input-decorator {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-accent);
    }
    .flex-center {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
</style>
