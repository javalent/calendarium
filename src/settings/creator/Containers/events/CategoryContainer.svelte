<script lang="ts">
    import { ExtraButtonComponent, Platform, TextComponent } from "obsidian";
    import { createEventDispatcher, getContext } from "svelte";
    import randomColor from "randomcolor";

    import type { CalEventCategory } from "src/@types";
    import { nanoid } from "src/utils/functions";
    import AddNew from "../../Utilities/AddNew.svelte";
    import NoExistingItems from "../../Utilities/NoExistingItems.svelte";
    import Details from "../../Utilities/Details.svelte";
    import { TRASH } from "src/utils/icons";

    const calendar = getContext("store");
    const { categoryStore } = calendar;

    $: categories = $calendar.categories;

    const name = (node: HTMLElement, category: CalEventCategory) => {
        const comp = new TextComponent(node)
            .setValue(category.name)
            .setPlaceholder("Name")
            .onChange((v) => {
                category.name = v;
                categoryStore.update(category.id, category);
            });
        comp.inputEl.setAttr("style", "width: 100%;");
    };
    const trash = (node: HTMLElement, item: CalEventCategory) => {
        new ExtraButtonComponent(node).setIcon(TRASH).onClick(() => {
            categoryStore.delete(item.id);
        });
    };
    const updateColor = (event: Event, category: CalEventCategory) => {
        const { target } = event;
        if (!(target instanceof HTMLInputElement)) return;
        category.color = target.value;
        categoryStore.update(category.id, category);
    };
</script>

<Details
    name={"Categories"}
    open={Platform.isDesktop}
    desc={`${$categoryStore.length} categor${
        $categoryStore.length != 1 ? "ies" : "y"
    }`}
>
    {#if !categories.length}
        <NoExistingItems
            message={"Create a new event category to see it here."}
        />
    {:else}
        <div class="existing-items">
            {#each categories as category (category.id)}
                <div class="category">
                    <div use:name={category} />
                    <div class="color">
                        <input
                            type="color"
                            value={category.color}
                            on:change={(evt) => updateColor(evt, category)}
                        />
                    </div>
                    <div use:trash={category} />
                </div>
            {/each}
        </div>
    {/if}

    <AddNew
        on:add={(evt) =>
            categoryStore.add({
                id: nanoid(6),
                color: randomColor(),
                name: evt.detail,
            })}
    />
</Details>

<style>
    .category {
        display: grid;
        grid-template-columns: 1fr auto auto;
        align-items: center;
        gap: 0.5rem;
        padding-top: 0.75rem;
    }
</style>
