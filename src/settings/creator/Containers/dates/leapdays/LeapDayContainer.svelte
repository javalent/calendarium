<script lang="ts">
    import { getContext } from "svelte";
    import LeapDayUI from "./LeapDayInstance.svelte";
    import AddNew from "../../../Utilities/AddNew.svelte";
    import NoExistingItems from "../../../Utilities/NoExistingItems.svelte";
    import { CreateLeapDayModal } from "src/settings/modals/leapday/leapday";

    import Details from "../../../Utilities/Details.svelte";
    import type { LeapDay } from "src/schemas/calendar/timespans";
    import { derived } from "svelte/store";

    const calendar = getContext("store");
    const plugin = getContext("plugin");

    const { leapDayStore, leapDayDisabled } = calendar;
    const label = derived(leapDayDisabled, (disabled) =>
        disabled ? "At least one month is required" : null,
    );

    const add = (leapday?: Partial<LeapDay>) => {
        const modal = new CreateLeapDayModal(plugin.app, $calendar, leapday);
        modal.onClose = () => {
            if (!modal.saved) return;
            if (!modal.leapday.interval.length) return;
            if (!modal.leapday.name) return;
            if (modal.editing && leapday != null && leapday.id) {
                leapDayStore.update(leapday.id, { ...modal.leapday });
            } else {
                leapDayStore.add({ ...modal.leapday });
            }
        };
        modal.open();
    };
</script>

<Details
    name={"Leap days"}
    desc={`${$leapDayStore.length} leap day${
        $leapDayStore.length != 1 ? "s" : ""
    }`}
>
    {#if !$leapDayStore.length}
        <NoExistingItems message={"Create a new leap day to see it here."} />
    {:else}
        <div class="existing-items">
            {#each $leapDayStore as leapday}
                <LeapDayUI
                    {leapday}
                    on:edit={() => add(leapday)}
                    on:delete={() => leapDayStore.delete(leapday.id ?? "")}
                />
            {/each}
        </div>
    {/if}

    <AddNew
        placeholder={"Leap Day"}
        disabled={leapDayDisabled}
        label={$label}
        on:add={(evt) => add({ name: evt.detail })}
    />
</Details>

<style>
</style>
