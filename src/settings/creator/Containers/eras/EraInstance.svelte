<script lang="ts">
    import { dateString } from "src/utils/functions";
    import type { Era } from "src/schemas/calendar/timespans";
    import { getContext } from "svelte";
    import SettingItem from "../../Settings/SettingItem.svelte";
    import { createEventDispatcher } from "svelte";
    import { ExtraButtonComponent } from "obsidian";
    import { TRASH, EDIT } from "src/utils/icons";

    const dispatch = createEventDispatcher<{ edit: null; delete: null }>();
    export let era: Era;
    const trash = (node: HTMLElement) => {
        let b = new ExtraButtonComponent(node)
            .setIcon(TRASH)
            .setTooltip("Delete");
        b.extraSettingsEl.setAttr("style", "margin-left: 0;");
    };
    const edit = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(EDIT).setTooltip("Edit");
    };
    const store = getContext("store");
</script>

<SettingItem>
    <div slot="name">{era.name}</div>
    <div slot="desc" class="desc">
        <span
            >{#if "isStartingEra" in era && era.isStartingEra}Starting era{:else if "date" in era}{dateString(
                    era.date,
                    $store,
                    era.end,
                )}{/if}</span
        >
        <span class="clamp">{era.description ?? ""}</span>
    </div>
    <div class="icons" slot="control">
        <div class="icon" use:edit on:click={() => dispatch("edit")} />
        <div class="icon" use:trash on:click={() => dispatch("delete")} />
    </div>
</SettingItem>

<style>
    .desc {
        display: flex;
        align-items: flex-start;
        flex-flow: column;
        gap: 0.5rem;
    }
    .clamp {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        word-break: keep-all;
        overflow: hidden;
        width: calc(var(--event-max-width) * 0.75);
    }

    .icons {
        display: flex;
        align-self: center;
        justify-self: flex-end;
    }
</style>
