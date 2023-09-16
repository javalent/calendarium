<script lang="ts">
    import { LeapDayCondition } from "src/schemas";
    import TextComponent from "src/settings/creator/Settings/TextComponent.svelte";
    import ToggleComponent from "src/settings/creator/Settings/ToggleComponent.svelte";

    export let canBeExclusive: boolean | undefined = false;
    export let condition: LeapDayCondition;
</script>

<TextComponent
    type="number"
    name="Interval"
    desc="How often the condition applies."
    value={condition.interval ?? 0}
    warn={!condition.interval}
    on:blur={(evt) => (condition.interval = evt.detail)}
/>
<ToggleComponent
    disabled={!canBeExclusive}
    name="Exclusive"
    desc="If true, the leap day will not apply when the year meets the condition.\n\nRequires the leap day to have at least one non-exclusive condition."
    value={condition.exclusive ?? false}
    on:click={() =>
        canBeExclusive ? (condition.exclusive = !condition.exclusive) : null}
/>
<ToggleComponent
    name="Ignore Offset"
    desc="The condition will ignore the leap day's offset when checking to apply."
    value={condition.ignore ?? false}
    on:click={() => (condition.ignore = !condition.ignore)}
/>
