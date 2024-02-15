<script lang="ts">
    import { getContext } from "svelte";
    import type { Day } from "src/schemas/calendar/timespans";
    import ToggleComponent from "../../Settings/ToggleComponent.svelte";
    import AddNew from "../../Utilities/AddNew.svelte";
    import NoExistingItems from "../../Utilities/NoExistingItems.svelte";
    import Details from "../../Utilities/Details.svelte";
    import { WeekdayModal } from "src/settings/modals/weekday/weekday";
    import copy from "fast-copy";
    import DropZone from "../../Utilities/DropZone.svelte";
    import WeekdayInstance from "./WeekdayInstance.svelte";

    const calendar = getContext("store");

    const { staticStore, weekdayStore } = calendar;

    $: overflow = $staticStore.overflow;
    $: items = copy($weekdayStore);

    let firstWeekday = $staticStore.firstWeekDay;

    const add = () => {
        const modal = new WeekdayModal();

        modal.onCancel = () => {}; //no op;
        modal.onClose = () => {
            if (!modal.item.name) return;
            weekdayStore.add(modal.item);
        };

        modal.open();
    };

    const advanced = (item: Day) => {
        const modal = new WeekdayModal(item);
        modal.onCancel = () => {}; //no op;
        modal.onClose = () => {
            if (!modal.item.name || !item.id) return;
            weekdayStore.update(item.id, modal.item);
        };
        modal.open();
    };

    const trash = (item: Day) => {
        weekdayStore.delete(item.id ?? "");
    };
    const onDrop = (items: Day[]) => {
        weekdayStore.set(items);
    };
</script>

<Details
    name={"Weekdays"}
    warn={!$weekdayStore?.length}
    label={"At least one weekday is required"}
    desc={`${$weekdayStore.length} weekday${
        $weekdayStore.length != 1 ? "s" : ""
    }`}
>
    <AddNew
        on:click={() => {
            add();
        }}
    />

    <div class="existing-items">
        {#if !$weekdayStore.length}
            <NoExistingItems message={"Create a new weekday to see it here."} />
        {:else}
            <DropZone
                type="weekday"
                {items}
                {onDrop}
                component={WeekdayInstance}
                on:advanced={(e) => advanced(e.detail)}
                on:trash={(e) => trash(e.detail)}
            />
        {/if}
    </div>

    <ToggleComponent
        name={"Overflow Weeks"}
        desc={"Weeks will flow into the next month. Disable to reset the weekday each month."}
        value={$staticStore.overflow}
        on:click={() =>
            staticStore.setProperty("overflow", !$staticStore.overflow)}
    />
    <div class="setting-item">
        <div class="setting-item-info">
            <div class="setting-item-name">First Day</div>
            <div class="setting-item-description">
                The weekday for the very first day on the calendar.
            </div>
        </div>
        <div class="setting-item-control">
            <select
                class="dropdown"
                aria-label={$weekdayStore.filter((v) => v.name?.length).length
                    ? null
                    : "Named Weekday Required"}
                bind:value={firstWeekday}
                on:change={() => {
                    staticStore.setProperty("firstWeekDay", firstWeekday);
                }}
            >
                <option selected hidden disabled>Select a Weekday</option>
                {#each $weekdayStore.filter((v) => v.name?.length) as weekday, index}
                    <option disabled={!overflow} value={index}>
                        {weekday.name ?? ""}
                    </option>
                {/each}
            </select>
        </div>
    </div>
</Details>

<style>
</style>
