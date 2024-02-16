<script lang="ts">
    import { getContext } from "svelte";
    import TextAreaComponent from "../../Settings/TextAreaComponent.svelte";
    import TextComponent from "../../Settings/TextComponent.svelte";
    import ToggleComponent from "../../Settings/ToggleComponent.svelte";
    import Details from "../../Utilities/Details.svelte";
    import { DEFAULT_DATA } from "src/settings/settings.constants";
    import { DEFAULT_FORMAT } from "src/utils/constants";
    import Calendarium from "src/main";

    const calendar = getContext("store");

    $: displayDayNumber = $calendar.static.displayDayNumber;
    $: validName = $calendar.name != null && $calendar.name.length;

    if (!$calendar.inlineEventTag)
        $calendar.inlineEventTag = DEFAULT_DATA.inlineEventsTag;

    const descFormat = () =>
        createFragment((e) => {
            e.createSpan({
                text: "Event dates will be parsed using this format.",
            });
            e.createEl("br");
            e.createSpan({
                text: "Information on how the format works can be seen ",
            });
            e.createEl("a", {
                href: "https://plugins.javalent.com/calendarium/create-calendar#Date+Format",
                text: "here",
            });
            e.createSpan({
                text: ".",
            });
        });
</script>

<Details
    name={"Basic Info"}
    warn={!validName}
    label={"The calendar must have a name"}
    alwaysOpen={true}
>
    <div class="calendarium-info">
        {#key $calendar.name}
            <TextComponent
                name={"Name"}
                warn={!validName}
                desc={!validName ? "The calendar must have a name" : ""}
                value={$calendar.name}
                on:blur={(evt) => {
                    if (evt.detail === $calendar.name) return;
                    $calendar.name = evt.detail;
                }}
            />
        {/key}
        <TextAreaComponent
            name={"Description"}
            value={$calendar.description ?? ""}
            on:blur={(evt) => {
                if (evt.detail === $calendar.description) return;
                $calendar.description = evt.detail;
            }}
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
        <TextComponent
            name={"Date Format"}
            desc={descFormat()}
            value={$calendar.dateFormat ?? DEFAULT_FORMAT}
            on:blur={(evt) => {
                if (evt.detail === $calendar.dateFormat) return;
                $calendar.dateFormat = evt.detail;
            }}
        />
        <ToggleComponent
            name={"Support inline events"}
            desc={"Display day of year in Day View"}
            value={$calendar.supportInlineEvents ?? false}
            on:click={() => {
                $calendar.supportInlineEvents = !$calendar.supportInlineEvents;
            }}
        />
        <TextComponent
            name={"Tag to indicate notes to scan for inline events"}
            desc={""}
            value={$calendar.inlineEventTag ?? ""}
            on:blur={(evt) => {
                if (evt.detail === $calendar.inlineEventTag) return;
                $calendar.inlineEventTag = evt.detail;
            }}
        />
    </div>
</Details>

<style>
    .calendarium-info :global(.calendarium-description) {
        display: flex;
        flex-flow: column;
        align-items: flex-start;
    }
    .calendarium-info :global(.calendarium-description) :global(textarea) {
        width: 100%;
    }
</style>
