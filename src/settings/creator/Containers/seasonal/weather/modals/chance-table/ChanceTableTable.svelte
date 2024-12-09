<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import type {
        ChanceTableEntry,
        ChanceTableWeatherEffect,
    } from "src/schemas/weather/effects";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import { EDIT, setNodeIcon, TRASH } from "src/utils/icons";
    import { ChanceTableItemModal } from "../effects";

    export let effect: ChanceTableWeatherEffect;

    const advanced = (node: HTMLElement, item: ChanceTableEntry) => {
        new ExtraButtonComponent(node).setIcon(EDIT).onClick(() => {
            const modal = new ChanceTableItemModal(item);

            modal.onClose = () =>
                (effect.table[effect.table.indexOf(item)] = modal.item);

            modal.open();
        });
    };

    const trash = (node: HTMLElement, item: ChanceTableEntry) => {
        new ExtraButtonComponent(node).setIcon(TRASH).onClick(() => {
            if (effect.table.length > 1) {
                const filtered = effect.table.filter((i) => i != item);
                effect.table = [filtered[0], ...filtered.slice(1)];
            }
        });
    };
</script>

<SettingItem heading={true}>
    <div slot="name">Table</div>
    <div slot="desc">Map your effects to a corresponding chance here.</div>
</SettingItem>
<div class="setting-container">
    {#each effect.table as item}
        <SettingItem>
            <div slot="name" class="flex-center">
                {#if item.icon}
                    <div use:setNodeIcon={item.icon} />
                {/if}
                {item.name}
            </div>
            <div slot="desc">
                {Math.round(item.chance * 100)}%
            </div>
            <div slot="control" class="flex-center">
                <div use:advanced={item} />
                <div use:trash={item} />
            </div>
        </SettingItem>
    {/each}
</div>

<style scoped>
    .flex-center {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
</style>
