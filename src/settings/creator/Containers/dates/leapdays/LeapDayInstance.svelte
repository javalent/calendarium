<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { ExtraButtonComponent, setIcon } from "obsidian";
    import { getIntervalDescription } from "src/utils/functions";
    import type { LeapDay } from "src/schemas/calendar/timespans";
    import {
        EDIT,
        INTERCALARY,
        MONTH,
        TRASH,
        setNodeIcon,
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
    export let leapday: LeapDay;

    let icon = leapday.intercalary ? INTERCALARY : MONTH;
    const store = getContext("store");

    const buildDescription = (descEl: HTMLElement) => {
        let desc = $store.static.months[leapday.timespan].name;
        if (leapday.intercalary) {
            if (leapday.after === 0) {
                desc += ", before 1";
            } else {
                desc += `, after ${leapday.after}`;
            }
        }
        descEl.createSpan({ text: desc ?? "" });
        descEl.createSpan({ text: getIntervalDescription(leapday) });
    };
</script>

<div class="leapday">
    <SettingItem>
        <div slot="name">{leapday.name}</div>
        <div slot="desc" class="desc">
            <div use:setNodeIcon={icon} />
            <div class="description" use:buildDescription />
        </div>
    </SettingItem>

    <div class="icons">
        <div class="icon" use:edit on:click={() => dispatch("edit")} />
        <div class="icon" use:trash on:click={() => dispatch("delete")} />
    </div>
</div>

<style>
    .leapday {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 0.5rem;
    }

    .icons {
        display: flex;
        align-self: center;
        justify-self: flex-end;
        align-items: center;
    }
    .desc {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
    }
    .desc .description {
        display: flex;
        flex-flow: column;
    }
</style>
