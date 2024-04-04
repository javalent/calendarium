<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let name: string;
    export let desc: string | DocumentFragment;

    export let value: boolean;
    export let disabled = false;
    const descEl = (node: HTMLElement) => {
        node.append(desc);
    };
    const dispatch = createEventDispatcher<{ click: MouseEvent }>();
</script>

<div class="setting-item mod-toggle">
    <div class="setting-item-info">
        <div class="setting-item-name">{name}</div>
        {#if desc}
            {#if typeof desc == "string"}
                <div class="setting-item-description">{desc}</div>
            {:else}
                <div class="setting-item-description" use:descEl />
            {/if}
        {/if}
    </div>
    <div class="setting-item-control">
        <div
            class="checkbox-container"
            class:is-disabled={disabled}
            class:is-enabled={value}
            on:click={(evt) => {
                if (!disabled) {
                    dispatch("click", evt);
                }
            }}
        />
    </div>
</div>
