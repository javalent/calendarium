<script lang="ts">
    import { createEventDispatcher, getContext } from "svelte";
    import { flip } from "svelte/animate";
    import {
        dndzone,
        SHADOW_PLACEHOLDER_ITEM_ID,
        SOURCES,
        TRIGGERS,
    } from "svelte-dnd-action";
    import { ExtraButtonComponent, setIcon, TextComponent } from "obsidian";
    import type { Day } from "src/@types";
    import ToggleComponent from "../Settings/ToggleComponent.svelte";
    import AddNew from "../Utilities/AddNew.svelte";
    import NoExistingItems from "../Utilities/NoExistingItems.svelte";
    import Details from "../Utilities/Details.svelte";
    import SettingItem from "../Settings/SettingItem.svelte";
    import { WeekdayModal } from "src/settings/modals/weekday/weekday";
    import copy from "fast-copy";
    import { getAbbreviation } from "src/utils/functions";

    const calendar = getContext("store");

    const { staticStore, weekdayStore } = calendar;

    $: overflow = $staticStore.overflow;
    $: items = copy($weekdayStore);

    let firstWeekday = $staticStore.firstWeekDay;

    const grip = (node: HTMLElement) => {
        setIcon(node, "grip-horizontal");
    };

    const add = () => {
        const modal = new WeekdayModal();

        modal.onCancel = () => {}; //no op;
        modal.onClose = () => {
            if (!modal.item.name) return;
            weekdayStore.add(modal.item);
        };

        modal.open();
    };
    const advanced = (node: HTMLElement, item: Day) => {
        new ExtraButtonComponent(node).setIcon("wrench").onClick(() => {
            const modal = new WeekdayModal(item);
            modal.onCancel = () => {}; //no op;
            modal.onClose = () => {
                if (!modal.item.name || !item.id) return;
                weekdayStore.update(item.id, modal.item);
            };
            modal.open();
        });
    };

    const trash = (node: HTMLElement, item: Day) => {
        new ExtraButtonComponent(node)
            .setIcon("trash")
            .onClick(() => weekdayStore.delete(item.id ?? ""));
    };
    function startDrag(e: Event) {
        e.preventDefault();
        dragDisabled = false;
    }
    const flipDurationMs = 300;
    let dragDisabled = false;

    function handleConsider(e: CustomEvent<GenericDndEvent<Day>>) {
        const {
            items: newItems,
            info: { source, trigger },
        } = e.detail;
        weekdayStore.set(newItems);
        // Ensure dragging is stopped on drag finish via keyboard
        if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STOPPED) {
            dragDisabled = true;
        }
    }
    function handleFinalize(e: CustomEvent<GenericDndEvent<Day>>) {
        const {
            items: newItems,
            info: { source },
        } = e.detail;
        weekdayStore.set(newItems);
        // Ensure dragging is stopped on drag finish via pointer (mouse, touch)
        if (source === SOURCES.POINTER) {
            dragDisabled = true;
        }
    }
</script>

<Details
    name={"Weekdays"}
    warn={!$weekdayStore?.length}
    label={"At least one weekday is required"}
    desc={`${$weekdayStore.length} weekday${
        $weekdayStore.length != 1 ? "s" : ""
    }`}
    open={false}
>
    <ToggleComponent
        name={"Overflow Weeks"}
        desc={"Turn this off to make each month start on the first of the week."}
        value={$staticStore.overflow}
        on:click={() =>
            staticStore.setProperty("overflow", !$staticStore.overflow)}
    />

    <AddNew
        on:click={() => {
            add();
        }}
    />

    {#if !$weekdayStore.length}
        <NoExistingItems message={"Create a new weekday to see it here."} />
    {:else}
        <div
            use:dndzone={{
                items,
                flipDurationMs,
                dragDisabled,
                dropFromOthersDisabled: true,
                type: "weeks",
            }}
            class="existing-items"
            on:consider={handleConsider}
            on:finalize={handleFinalize}
        >
            {#each items.filter((x) => x.id !== SHADOW_PLACEHOLDER_ITEM_ID) as item (item.id)}
                <div
                    animate:flip={{ duration: flipDurationMs }}
                    class="weekday"
                >
                    <div
                        class="icon"
                        use:grip
                        on:mousedown={startDrag}
                        on:touchstart={startDrag}
                        style={dragDisabled
                            ? "cursor: grab"
                            : "cursor: grabbing"}
                    />

                    <SettingItem>
                        <div slot="name">{item.name}</div>
                        <div slot="desc" style="text-transform: uppercase">
                            {getAbbreviation(item)}
                        </div>
                    </SettingItem>

                    <div class="icons">
                        <div class="icon" use:advanced={item} />
                        <div class="icon" use:trash={item} />
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <div class="setting-item">
        <div class="setting-item-info">
            <div class="setting-item-name">First Day</div>
            <div class="setting-item-description">
                The day of the week the first year starts on.
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
    .existing-items {
        width: 100%;
    }

    .weekday {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        width: 100%;
    }

    .icons {
        display: flex;
        align-items: center;
    }
    .weekday .icon {
        display: flex;
        align-items: center;
    }
    .weekday {
        margin-top: 0.5rem;
    }
</style>
