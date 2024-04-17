<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { CalEvent, CalEventCategory } from "src/@types";
    import {
        ExtraButtonComponent,
        TFile,
        prepareSimpleSearch,
        renderMatches,
        setIcon,
    } from "obsidian";
    import Dot from "../../Utilities/Dot.svelte";
    import {
        EDIT,
        EVENT_FROM_FRONTMATTER,
        TRASH,
        WARNING,
    } from "src/utils/icons";
    import type { Writable } from "svelte/store";
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

    const open = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(EVENT_FROM_FRONTMATTER)
            .setTooltip("Open note");
    };
    const plugin = getContext("plugin");
    function tryOpen() {
        if (event.note) {
            const note = event.note.endsWith(".md")
                ? event.note
                : `${event.note}.md`;
            const file = plugin.app.vault.getAbstractFileByPath(note);
            if (file && file instanceof TFile) {
                plugin.app.workspace.getLeaf().openFile(file);
                plugin.app.setting.close();
            }
        }
    }

    export let event: CalEvent;
    export let file: boolean;
    export let category: CalEventCategory | undefined;
    export let date: string;
    export let nameFilter: Writable<string>;

    let nameEl: HTMLElement, descEl: HTMLElement;
    $: {
        if (nameEl && descEl) {
            if (!event.name) {
                setIcon(nameEl.createDiv(), WARNING);
                nameEl.createSpan({ text: "(no name)" });
            } else if ($nameFilter.length) {
                const nameResult = prepareSimpleSearch($nameFilter)(event.name);
                if (nameResult) {
                    nameEl.empty();
                    renderMatches(nameEl, event.name, nameResult.matches);
                } else {
                    nameEl.setText(event.name);
                }
                if (event.description) {
                    const descResult = prepareSimpleSearch($nameFilter)(
                        event.description,
                    );
                    if (descResult) {
                        descEl.empty();
                        renderMatches(
                            descEl,
                            event.description,
                            descResult.matches,
                        );
                    } else {
                        descEl.setText(event.description ?? "");
                    }
                }
            } else {
                nameEl.setText(event.name);
                descEl.setText(event.description ?? "");
            }
        }
    }
</script>

<div class="event">
    <div class="event-info">
        <span class="setting-item-name event-name">
            {#if category != null}
                <Dot color={category.color} label={category.name} />
            {/if}
            <div bind:this={nameEl} />
        </span>
        <div class="setting-item-description">
            <span class="date">
                <em>
                    {date}
                </em>
            </span>
            <span class="clamp" bind:this={descEl}></span>
        </div>
    </div>
    {#if file}
        <div class="icons">
            <div class="icon" use:open on:click={() => tryOpen()} />
        </div>
    {:else}
        <div class="icons">
            <div class="icon" use:edit on:click={() => dispatch("edit")} />
            <div class="icon" use:trash on:click={() => dispatch("delete")} />
        </div>
    {/if}
</div>

<style>
    .event {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 0.5rem;
        width: 100%;
        margin: 0;
    }
    .event-info {
        width: 100%;
    }

    .icons {
        display: flex;
        align-self: flex-start;
        justify-self: flex-end;
        align-items: center;
    }
    .event .icon {
        align-items: center;
    }
    .date {
        display: flex;
        justify-content: flex-start;
        gap: 0.25rem;
    }
    .clamp {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        word-break: keep-all;
        overflow: hidden;
        width: calc(var(--event-max-width) * 0.75);
    }
    .event-name {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
</style>
