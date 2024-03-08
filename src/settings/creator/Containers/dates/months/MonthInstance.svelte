<script lang="ts">
    import { getContext } from "svelte";
    import type { Month } from "src/schemas/calendar/timespans";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import { setNodeIcon } from "src/utils/icons";
    import { INTERCALARY, MONTH } from "src/utils/icons";

    export let item: Month;
    const store = getContext("store");
    let icon = item.type == "intercalary" ? INTERCALARY : MONTH;
    let label = item.type == "intercalary" ? "Intercalary" : "Month";
</script>

<SettingItem>
    <div slot="name">{item.name}</div>
    <div slot="desc" class="desc">
        <div use:setNodeIcon={icon} aria-label={label} />
        <span
            >{item.length} day{item.length == 1
                ? ""
                : "s"}{#if item.interval > 1}, every {item.interval}{#if item.offset > 0}+{item.offset}{/if}
                years{/if}</span
        >
    </div>
</SettingItem>

<style>
    .desc {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
</style>
