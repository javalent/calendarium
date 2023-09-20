<script lang="ts">
    import { debounce, ExtraButtonComponent } from "obsidian";
    import type { Month } from "src/@types";
    import { createEventDispatcher, getContext } from "svelte";
    import SettingItem from "../../Settings/SettingItem.svelte";

    export let item: Month;
    const store = getContext("store");
    const { monthStore } = store;

    let name = item.name;
    let type = item.type;
    let length = item.length;

    const update = debounce(
        () => {
            item.name = name;
            item.type = type;
            item.length = length;
            monthStore.update(item.id, item);
        },
        300,
        true
    );
</script>

<SettingItem>
    <div slot="name">{item.name}</div>
    <div slot="desc">
        <span>
            {item.length} days
        </span>
        {#if item.type == "intercalary"}
            (intercalary)
        {/if}
    </div>
</SettingItem>

<style>
</style>
