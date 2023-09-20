<script lang="ts">
    import type { Day } from "src/schemas";
    import SettingItem from "../../Settings/SettingItem.svelte";
    import { getAbbreviation } from "src/utils/functions";

    export let item: Day;
</script>

<SettingItem>
    <div slot="name">{item.name}</div>
    <div slot="desc" style="text-transform: uppercase">
        {getAbbreviation(item)}
    </div>
</SettingItem>

<style>
</style>
