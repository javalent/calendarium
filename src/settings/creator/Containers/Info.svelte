<script lang="ts">
    import { getContext } from "svelte";
    import TextAreaComponent from "../Settings/TextAreaComponent.svelte";
    import TextComponent from "../Settings/TextComponent.svelte";
    import ToggleComponent from "../Settings/ToggleComponent.svelte";
    import Details from "../Utilities/Details.svelte";
    import { DEFAULT_CALENDAR } from "src/settings/settings.constants";

    const calendar = getContext("store");

    $: displayDayNumber = $calendar.static.displayDayNumber;
    $: incrementDay = $calendar.static.incrementDay;

    $: validName = $calendar.name != null && $calendar.name.length;

    if (!$calendar.inlineEventTag)
        $calendar.inlineEventTag = DEFAULT_CALENDAR.inlineEventTag;
</script>

<Details
    name={"Basic Info"}
    warn={!validName}
    label={"The calendar must have a name"}
>
    <div class="calendarium-info">
        <TextComponent
            name={"Calendar Name"}
            warn={!validName}
            desc={!validName ? "The calendar must have a name" : ""}
            value={$calendar.name}
            on:blur={(evt) => {
                $calendar.name = evt.detail;
            }}
            on:change={(evt) => ($calendar.name = evt.detail)}
        />
        <TextAreaComponent
            name={"Calendar Description"}
            value={$calendar.description ?? ""}
            on:blur={(evt) => ($calendar.description = evt.detail)}
        />
        <ToggleComponent
            name={"Display Day Number"}
            desc={"Display day of year in Day View"}
            value={displayDayNumber}
            on:click={() => {
                $calendar.static.displayDayNumber =
                    !$calendar.static.displayDayNumber;
            }}
        />
        <!-- <ToggleComponent
            name={"Auto Increment Day"}
            desc={"Automatically increment the current day every real-world day."}
            value={incrementDay}
            on:click={() => {
                $calendar.static.incrementDay = !$calendar.static.incrementDay;
            }}
        /> -->
    </div>
</Details>

<style>
    .calendarium-info :global(.setting-item) {
        padding-top: 18px;
    }
    .calendarium-info :global(.calendarium-description) {
        display: flex;
        flex-flow: column;
        align-items: flex-start;
    }
    .calendarium-info :global(.calendarium-description) :global(textarea) {
        width: 100%;
    }
</style>
