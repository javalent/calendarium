<script lang="ts">
    import { getContext } from "svelte";
    import { flip } from "svelte/animate";
    import { dndzone, SOURCES, TRIGGERS } from "svelte-dnd-action";
    import {
        App,
        ExtraButtonComponent,
        Platform,
        setIcon,
        TextComponent,
    } from "obsidian";

    import { confirmWithModal } from "../../../../modals/confirm";
    import ToggleComponent from "../../../Settings/ToggleComponent.svelte";
    import AddNew from "../../../Utilities/AddNew.svelte";
    import NoExistingItems from "../../../Utilities/NoExistingItems.svelte";
    import Details from "../../../Utilities/Details.svelte";
    import type { Year } from "src/schemas/calendar/timespans";
    import { GRIP, TRASH } from "src/utils/icons";

    const calendar = getContext("store");
    const plugin = getContext("plugin");

    const { yearStore, staticStore, currentStore } = calendar;
    const { customYears } = yearStore;

    const grip = (node: HTMLElement) => {
        setIcon(node, GRIP);
    };

    const trash = (node: HTMLElement, item: Year) => {
        new ExtraButtonComponent(node).setIcon(TRASH).onClick(() => {
            const index =
                $yearStore?.findIndex((year) => year.id === item.id) ?? 0;
            yearStore.delete(item.id);
            if ($yearStore?.length) {
                if (index > 0) {
                    $currentStore.year = index;
                } else {
                    $currentStore.year = 1;
                }
            }
        });
    };

    const name = (node: HTMLElement, item: Year) => {
        const comp = new TextComponent(node)
            .setValue(item.name ?? "")
            .setPlaceholder("Name")
            .onChange((v) => {
                item.name = v;
                yearStore.update(item.id, item);
            });
        comp.inputEl.setAttr("style", "width: 100%;");
    };

    const customDesc = createFragment((el) => {
        el.createSpan({
            text: "Create custom years to display instead of incrementing from 1.",
        });
        el.createEl("br");
        el.createSpan({ text: "If on, " });
        el.createEl("strong", {
            text: "only the years added below will be displayed.",
        });
        return el;
    });

    const confirmCustom = async () => {
        if (
            !$yearStore?.length ||
            ($customYears &&
                (await confirmWithModal(
                    plugin.app,
                    "The custom years you have created will be removed. Proceed?",
                )))
        ) {
            yearStore.set([]);
        }
        staticStore.setProperty("useCustomYears", !$staticStore.useCustomYears);
    };

    function startDrag(e: Event) {
        e.preventDefault();
        dragDisabled = false;
    }
    const flipDurationMs = 300;
    let dragDisabled = false;

    function handleConsider(e: CustomEvent<GenericDndEvent<Year>>) {
        const {
            items: newItems,
            info: { source, trigger },
        } = e.detail;
        yearStore.set(newItems);
        // Ensure dragging is stopped on drag finish via keyboard
        if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STOPPED) {
            dragDisabled = true;
        }
    }
    function handleFinalize(e: CustomEvent<GenericDndEvent<Year>>) {
        const {
            items: newItems,
            info: { source },
        } = e.detail;
        yearStore.set(newItems);
        // Ensure dragging is stopped on drag finish via pointer (mouse, touch)
        if (source === SOURCES.POINTER) {
            dragDisabled = true;
        }
    }
</script>

<Details
    name={"Years"}
    open={Platform.isDesktop}
    warn={$customYears && !$yearStore?.length}
    label={"At least one year is required when using custom years"}
>
    <ToggleComponent
        name="Use custom years"
        desc={customDesc}
        value={$customYears ?? false}
        on:click={() => confirmCustom()}
    />

    {#if $customYears}
        {#if !$yearStore?.length}
            <NoExistingItems message={"Create a new year to see it here."} />
        {:else}
            <div
                use:dndzone={{
                    items: $yearStore,
                    flipDurationMs,
                    dragDisabled,
                }}
                class="existing-items"
                on:consider={handleConsider}
                on:finalize={handleFinalize}
            >
                {#each $yearStore as item (item.id)}
                    <div
                        animate:flip={{ duration: flipDurationMs }}
                        class="weekday"
                    >
                        <div
                            class="icon"
                            use:grip
                            on:mousedown={startDrag}
                            on:touchstart={startDrag}
                        />

                        <div use:name={item} />

                        <div class="icon" use:trash={item} />
                    </div>
                {/each}
            </div>
        {/if}

        <AddNew
            on:add={(evt) => {
                yearStore.add(evt.detail);
                if ($yearStore?.length === 1) {
                    $currentStore.year = 1;
                }
            }}
        />
    {/if}
</Details>

<style>
    .weekday {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .weekday .icon {
        align-items: center;
    }
    .weekday {
        margin-top: 0.5rem;
    }
</style>
