<script lang="ts">
    import { debounce } from "obsidian";
    import { getContext } from "svelte";
    import type { Month } from "src/schemas/calendar/timespans";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import { setNodeIcon } from "src/utils/icons";
    import { INTERCALARY, MONTH } from "src/utils/icons";

    export let item: Month;
    const store = getContext("store");
    const { monthStore } = store;

    let name = item.name;
    let type = item.type;
    let length = item.length;
    let icon = item.type == "intercalary" ? INTERCALARY : MONTH;
    let label = item.type == "intercalary" ? "Intercalary" : "Month";
</script>

<SettingItem>
    <div slot="name">{item.name}</div>
    <div slot="desc" class="desc">
        <div use:setNodeIcon={icon} aria-label={label} />
        <span>
            {item.length} day{item.length == 1 ? "" : "s"}
        </span>
    </div>
</SettingItem>

<style>
    .desc {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
</style>
