<script lang="ts">
    import { getContext } from "svelte";

    import { EDIT, GRIP, TRASH } from "src/utils/icons";

    import { ExtraButtonComponent, Scope, setIcon } from "obsidian";
    import { dndzone } from "svelte-dnd-action";
    import { type ComponentType, createEventDispatcher } from "svelte";
    import { flip } from "svelte/animate";

    type T = $$Generic<TimeSpan>;
    export let items: T[];
    console.log("🚀 ~ file: DropZone.svelte:13 ~ items:", items);

    export let type: string;
    export let component: ComponentType;
    export let onDrop: (items: T[]) => void;

    const plugin = getContext("plugin");

    let dispatch = createEventDispatcher<{
        advanced: T;
        trash: T;
    }>();
    const grip = (node: HTMLElement) => {
        setIcon(node, GRIP);
    };

    let _scope = new Scope();
    function startDrag(e: Event) {
        e.preventDefault();
        plugin.app.keymap.pushScope(_scope);
        dragDisabled = false;
    }
    const flipDurationMs = 300;
    export let dragDisabled = false;

    function handleConsider(e: CustomEvent<GenericDndEvent<T>>) {
        items = e.detail.items;
    }
    function handleFinalize(e: CustomEvent<GenericDndEvent<T>>) {
        plugin.app.keymap.popScope(_scope);
        onDrop(e.detail.items);
    }
    const advanced = (node: HTMLElement, item: T) => {
        new ExtraButtonComponent(node)
            .setIcon(EDIT)
            .onClick(() => dispatch("advanced", item));
    };

    const trash = (node: HTMLElement, item: T) => {
        new ExtraButtonComponent(node)
            .setIcon(TRASH)
            .onClick(() => dispatch("trash", item));
    };
</script>

<div
    use:dndzone={{
        items,
        flipDurationMs,
        dragDisabled,
        dropFromOthersDisabled: true,
        type,
    }}
    class="drop-items"
    on:consider={handleConsider}
    on:finalize={handleFinalize}
>
    {#each items as item (item.id)}
        <div
            animate:flip={{ duration: flipDurationMs }}
            class="drop-item-container"
        >
            <div
                class="icon"
                use:grip
                on:mousedown={startDrag}
                on:touchstart={startDrag}
                style={dragDisabled ? "cursor: grab" : "cursor: grabbing"}
            />
            {#key item}
                <div class="drop-item" class:type>
                    <svelte:component this={component} {item} ...args />
                </div>
            {/key}
            <div class="icons">
                <div class="icon" use:advanced={item} />
                <div class="icon" use:trash={item} />
            </div>
        </div>
    {/each}
</div>

<style>
    .drop-items {
        width: 100%;
        margin: 0.5rem 0;
    }
    .drop-item-container .icon,
    .icons {
        display: flex;
        align-items: center;
    }
    .drop-item-container {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        width: 100%;
    }
    .drop-item-container:not(:last-child) {
        margin-bottom: 0.5rem;
    }
</style>
