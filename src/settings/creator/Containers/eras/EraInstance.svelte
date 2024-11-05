<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ExtraButtonComponent } from "obsidian";
    import { dateString } from "src/utils/functions";
    import type { Era } from "src/schemas/calendar/timespans";
    import {
        EDIT,
        TRASH,
    } from "src/utils/icons";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import { getContext } from "svelte";

    const dispatch = createEventDispatcher();

    const trash = (node: HTMLElement) => {
        let b = new ExtraButtonComponent(node)
            .setIcon(TRASH)
            .setTooltip("Delete");
        b.extraSettingsEl.setAttr("style", "margin-left: 0;");
    };
    const edit = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(EDIT).setTooltip("Edit");
    };
    export let era: Era;

    const store = getContext("store");
</script>

<div class="era setting-item">
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
</div>

<style>
    .era {
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
    .clamp {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        word-break: keep-all;
        overflow: hidden;
        width: calc(var(--event-max-width) * 0.75);
    }
</style>
