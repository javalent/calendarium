<script lang="ts">
    import { createEventDispatcher } from "svelte";

    type T = $$Generic<string | number>;

    export let value: T;
    export let name: string;
    export let warn: boolean = false;
    export let type = "text";
    export let desc: string | DocumentFragment | null = null;
    export let placeholder = name;

    const dispatch = createEventDispatcher<{ change: T; blur: T }>();
    const descEl = (node: HTMLElement) => {
        node.append((desc as DocumentFragment).cloneNode(true));
    };
</script>

<div class="setting-item">
    <div class="setting-item-info">
        <div class="setting-item-name">
            {name}
        </div>
        {#if desc}
            {#if typeof desc == "string"}
                <div class="setting-item-description">{desc}</div>
            {:else}
                <div class="setting-item-description" use:descEl />
            {/if}
        {/if}
    </div>
    <div class="setting-item-control">
        <div class="warning-container">
            <slot>
                {#if type == "text"}
                    <input
                        type="text"
                        spellcheck="false"
                        {placeholder}
                        class:warn
                        bind:value
                        on:input={() => dispatch("change", value)}
                        on:blur={() => {
                            dispatch("blur", value);
                        }}
                    />
                {:else if type == "number"}
                    <input
                        type="number"
                        spellcheck="false"
                        {placeholder}
                        class:warn
                        bind:value
                        on:input={() => dispatch("change", value)}
                        on:blur={() => {
                            dispatch("blur", value);
                        }}
                    />
                {/if}
            </slot>
            <slot name="additional"></slot>
        </div>
    </div>
</div>

<style>
    input.warn {
        border-color: var(--text-error);
    }
</style>
