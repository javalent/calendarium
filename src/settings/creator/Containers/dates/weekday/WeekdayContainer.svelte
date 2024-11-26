<script lang="ts">
    import { getContext } from "svelte";
    import type { Day } from "src/schemas/calendar/timespans";
    import { WeekdayModal } from "src/settings/creator/Containers/dates/weekday/weekday";
    import copy from "fast-copy";
    import WeekdayInstance from "./WeekdayInstance.svelte";
    import Details from "src/settings/creator/Utilities/Details.svelte";
    import AddNew from "src/settings/creator/Utilities/AddNew.svelte";
    import NoExistingItems from "src/settings/creator/Utilities/NoExistingItems.svelte";
    import DropZone from "src/settings/creator/Utilities/DropZone.svelte";
    import ToggleComponent from "src/settings/creator/Settings/ToggleComponent.svelte";
    import { nanoid } from "src/utils/functions";
    import { Platform } from "obsidian";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";

    const calendar = getContext("store");

    const { staticStore, weekdayStore } = calendar;

    $: overflow = $staticStore.overflow;
    $: items = copy($weekdayStore);

    let firstWeekday = $staticStore.firstWeekDay;

    /*     const add = (name: string) => {
        weekdayStore.add({
            type: "day",
            name,
            id: nanoid(6),
        });
    }; */

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
    open={Platform.isDesktop}
    warn={!$weekdayStore?.length}
    label={"At least one weekday is required"}
    desc={`${$weekdayStore.length} weekday${
        $weekdayStore.length != 1 ? "s" : ""
    }`}
>
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

    <AddNew
        placeholder={"Weekday"}
        on:add={(evt) => {
            weekdayStore.add({
                type: "day",
                name: evt.detail,
                id: nanoid(6),
            });
        }}
    />

    <ToggleComponent
        name={"Overflow weeks"}
        desc={"Weeks will flow into the next month. Disable to reset the weekday each month."}
        value={$staticStore.overflow}
        on:click={() =>
            staticStore.setProperty("overflow", !$staticStore.overflow)}
    />
    <SettingItem>
        <div slot="name">First day</div>
        <div slot="desc">
            The weekday for the very first day on the calendar.
        </div>
        <div slot="control">
            <select
                class="dropdown"
                aria-label={$weekdayStore.filter((v) => v.name?.length).length
                    ? null
                    : "Named weekday required"}
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
    </SettingItem>
</Details>

<style>
</style>
