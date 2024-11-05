<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import { createEventDispatcher } from "svelte";
    import { EDIT, TRASH } from "src/utils/icons";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";

    const dispatch = createEventDispatcher<{ edit: null; delete: null }>();

    const trash = (node: HTMLElement) => {
        let b = new ExtraButtonComponent(node)
            .setIcon(TRASH)
            .setTooltip("Delete");
        b.extraSettingsEl.setAttr("style", "margin-left: 0;");
    };
    const edit = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(EDIT).setTooltip("Edit");
    };
</script>

<div class="editable-item setting-item">
    <SettingItem>
        <div slot="name">
            <slot name="name" />
        </div>
        <div slot="desc" class="desc">
            <slot name="desc" />
        </div>
        <div class="icons" slot="control">
            <div class="icon" use:edit on:click={() => dispatch("edit")} />
            <div class="icon" use:trash on:click={() => dispatch("delete")} />
        </div>
    </SettingItem>
</div>

<style>
    .editable-item {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 0.5rem;
    }

    .icons {
        display: flex;
        align-self: center;
        justify-self: flex-end;
        align-items: flex-start;
    }
    .desc {
        display: flex;
        align-items: flex-start;
        flex-flow: column;
        gap: 0.5rem;
    }
</style>
