<script lang="ts">
    import type { CalEvent } from "src/@types";
    import EventInstance from "./EventInstance.svelte";
    import NoExistingItems from "../../Utilities/NoExistingItems.svelte";
    import { CreateEventModal } from "src/settings/modals/event/event";
    import Details from "../../Utilities/Details.svelte";
    import ButtonComponent from "../../Settings/ButtonComponent.svelte";
    import { confirmWithModal } from "src/settings/modals/confirm";
    import { ExtraButtonComponent, prepareSimpleSearch } from "obsidian";
    import { getContext } from "svelte";
    import { derived, writable } from "svelte/store";
    import { ADD, TRASH } from "src/utils/icons";
    import { eventDateString } from "src/utils/functions";
    import Pagination from "./Pagination.svelte";
    import Search from "./filters/Search.svelte";

    const calendar = getContext("store");
    const plugin = getContext("plugin");
    const { eventStore } = calendar;
    const { sortedStore } = eventStore;

    let nameFilter = writable<string>("");

    const slice = writable(50);
    const page = writable(1);
    const filtered = derived([sortedStore, nameFilter], ([events, name]) => {
        let toConsider: CalEvent[] = [];
        for (const event of events) {
            let should = true;
            if (name.length) {
                const search = prepareSimpleSearch(name);
                if (!search(event.name)) {
                    should = false;
                } else {
                    should = true;
                }
                if (event.description?.length) {
                    const search = prepareSimpleSearch(name);

                    if (!search(event.description)) {
                        should = false;
                    } else {
                        should = true;
                    }
                }
            }
            if (should) {
                toConsider.push(event);
            }
        }

        return toConsider;
    });

    const pages = derived([slice, filtered], ([slice, filtered]) =>
        Math.ceil(filtered.length / slice),
    );
    const sliced = derived(
        [filtered, slice, page],
        ([filtered, slice, page]) => {
            return filtered.slice((page - 1) * slice, page * slice);
        },
    );

    const deleteEvent = (item: CalEvent) => {
        eventStore.delete(item.id);
    };
    const getCategory = (category: string | null) => {
        return $calendar.categories.find(({ id }) => id == category);
    };
    const add = (event?: CalEvent) => {
        const modal = new CreateEventModal($calendar, plugin, event);
        modal.onClose = () => {
            if (!modal.saved) return;
            if (modal.editing && event) {
                eventStore.update(event.id, { ...modal.event });
            } else {
                eventStore.add({ ...modal.event });
            }
        };
        modal.open();
    };
    const deleteAll = async () => {
        if (
            await confirmWithModal(
                plugin.app,
                "Are you sure you want to delete all events from this calendar?",
            )
        ) {
            eventStore.set([]);
        }
    };
    const resetIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("reset");
    };
    const reset = () => {
        $nameFilter = "";
    };
</script>

<Details
    name={"Events"}
    desc={`Displaying ${$filtered.length}/${$calendar.events.length} events.`}
>
    <ButtonComponent
        name={"Delete all events"}
        icon={TRASH}
        on:click={() => deleteAll()}
    />

    <ButtonComponent name={"Add event"} icon={ADD} on:click={() => add()} />
    <div class="setting-item filters-container">
        <Search filter={nameFilter} placeholder={"Search events"} />
        <div use:resetIcon on:click={() => reset()} />
    </div>
    <div class="existing-items setting-item">
        {#each $sliced as event}
            <EventInstance
                {event}
                category={getCategory(event.category)}
                date={eventDateString(event, $calendar)}
                on:edit={() => add(event)}
                on:delete={() => deleteEvent(event)}
                {nameFilter}
            />
        {:else}
            <div class="setting-item">
                <NoExistingItems
                    message={"Create a new event to see it here."}
                />
            </div>
        {/each}
    </div>
    <div class="pagination-container setting-item">
        <Pagination {slice} {page} {pages} />
    </div>
</Details>

<style>
    .filters-container {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
    }
    .existing-items {
        flex-flow: column;
    }
</style>
