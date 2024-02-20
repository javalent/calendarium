<script lang="ts">
    import { ButtonComponent, ExtraButtonComponent } from "obsidian";
    import { nanoid } from "src/utils/functions";
    import { createEventDispatcher } from "svelte";
    import { writable, derived, readable } from "svelte/store";
    import WarningLabel from "./WarningLabel.svelte";
    import { ADD } from "src/utils/icons";

    const dispatch = createEventDispatcher<{ add: string }>();

    export let disabled = readable(false);
    export let placeholder = "Add new";
    export let isInput = true;
    export let label: string | null = null;

    let value = writable("");
    let _disabled = isInput
        ? derived(
              [value, disabled],
              ([value, disabled]) => disabled || value.length <= 0,
          )
        : readable(false);
    let addButton: ButtonComponent | ExtraButtonComponent;
    $: {
        if (addButton) {
            addButton.setDisabled($_disabled);
        }
    }
    const addNew = (node: HTMLElement) => {
        addButton = (
            isInput ? new ExtraButtonComponent(node) : new ButtonComponent(node)
        )
            .setIcon(ADD)
            .onClick(() => {
                if ($_disabled) return;
                sendIt();
            });
    };

    const sendIt = () => {
        dispatch("add", $value);
        $value = "";
    };
</script>

<div class="add-new setting-item">
    {#if isInput}
        <input
            type="text"
            spellcheck="false"
            {placeholder}
            bind:value={$value}
            on:keyup={(evt) => {
                if ($_disabled) return;
                if (evt.key === "Enter") {
                    sendIt();
                }
            }}
        />
    {:else}
        <span class="setting-item-name">{placeholder}</span>
    {/if}

    <div class="add-button" use:addNew />
</div>
{#if label}
    <WarningLabel {label} />
{/if}

<style>
    .add-button {
        display: flex;
        align-items: center;
    }
    .add-new {
        gap: 0.5rem;
    }
    input {
        margin-right: initial;
    }
</style>
