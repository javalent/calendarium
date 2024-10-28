<script lang="ts">
    import { ExtraButtonComponent, TextComponent } from "obsidian";
    import { getContext } from "svelte";
    import randomColor from "randomcolor";

    import { nanoid } from "src/utils/functions";
    import AddNew from "../../Utilities/AddNew.svelte";
    import NoExistingItems from "../../Utilities/NoExistingItems.svelte";
    import Details from "../../Utilities/Details.svelte";
    import { TRASH } from "src/utils/icons";
    import type { CalWeatherCondition } from "../../../../schemas/calendar/weather";
    import ToggleComponent from "../../Settings/ToggleComponent.svelte";

    const calendar = getContext("store");
    const { weatherConditionStore, displayWeather } = calendar;

    $: weatherConditions = $calendar.weatherConditions;

    const name = (node: HTMLElement, weatherCondition: CalWeatherCondition) => {
        const comp = new TextComponent(node)
            .setValue(weatherCondition.name)
            .setPlaceholder("Name")
            .onChange((v) => {
                weatherCondition.name = v;
                weatherConditionStore.update(weatherCondition.id, weatherCondition);
            });
        comp.inputEl.setAttr("style", "width: 100%;");
    };
    const trash = (node: HTMLElement, item: CalWeatherCondition) => {
        new ExtraButtonComponent(node).setIcon(TRASH).onClick(() => {
            weatherConditionStore.delete(item.id);
        });
    };
    const updateColor = (event: Event, weatherCondition: CalWeatherCondition) => {
        const { target } = event;
        if (!(target instanceof HTMLInputElement)) return;
        weatherCondition.color = target.value;
        weatherConditionStore.update(weatherCondition.id, weatherCondition);
    };
</script>

<Details
    name={"Weather Conditions"}
    desc={`${$weatherConditionStore?.length} condition${
        $weatherConditionStore?.length !== 1 ? "s" : ""
    }`}
>
    <ToggleComponent
        name={"Display weather"}
        desc={"Display weather by default when viewing this calendar."}
        value={$displayWeather}
        on:click={() => ($displayWeather = !$displayWeather)}
    />

    {#if !weatherConditions?.length}
        <NoExistingItems
            message={"Create a new weather condition to see it here."}
        />
    {:else}
        <div class="deletion-alert">
            Be aware that deleting weather conditions will remove associated
            weather states!
        </div>
        <div class="existing-items">
            {#each weatherConditions as weatherCondition}
                <div class="weather-condition">
                    <div use:name={weatherCondition} />
                    <div class="color">
                        <input
                            type="color"
                            value={weatherCondition.color}
                            on:change={(evt) => updateColor(evt, weatherCondition)}
                        />
                    </div>
                    <div use:trash={weatherCondition} />
                </div>
            {/each}
        </div>
    {/if}

    <AddNew
        on:add={(evt) =>
            weatherConditionStore.add({
                id: nanoid(6),
                color: randomColor(),
                name: evt.detail,
            })}
    />
</Details>

<style>
    .weather-condition {
        display: grid;
        grid-template-columns: 1fr auto auto;
        align-items: center;
        gap: 0.5rem;
        padding-top: 0.75rem;
    }

    .deletion-alert {
        color: var(--text-error);
        padding: 0.5rem 0;
        font-style: italic;
    }
</style>
