<script lang="ts">
    import type { Location } from "src/schemas/calendar/locations";
    import SettingItem from "../../Settings/SettingItem.svelte";

    export let item: Location;
</script>

<div class="location">
    <SettingItem>
        <div slot="name">
            <span class="season-name">{item.name}</span>
        </div>
    </SettingItem>
</div>
