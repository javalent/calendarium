<script lang="ts">
    import { TextComponent, type App, TFile } from "obsidian";
    import { FileInputSuggest } from "obsidian-utilities";
    import { CalEventHelper } from "src/events/event.helper";
    import { EventType } from "src/events/event.types";
    import type Calendarium from "src/main";
    import type { CalEvent } from "src/schemas";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import type { CalendarStore } from "src/stores/calendar.store";
    import { nanoid } from "src/utils/functions";
    import type { Writable } from "svelte/store";

    export let event: Writable<CalEvent>;
    export let plugin: Calendarium;
    export let store: CalendarStore;

    const helper = new CalEventHelper($store, plugin.data.parseDates);

    const suggest = (node: HTMLElement) => {
        const text = new TextComponent(node);
        let files = app.vault.getFiles();
        text.setPlaceholder("Path");
        if ($event.note) {
            const [path, subpath] = $event.note.split(/[#^]/);
            const note = app.metadataCache.getFirstLinkpathDest(path, "");
            if (note && note instanceof TFile) {
                text.setValue(
                    `${note.basename}${subpath ? "#" : ""}${
                        subpath ? subpath : ""
                    }`,
                );
            }
        }

        const modal = new FileInputSuggest(plugin.app, text, [...files]);

        modal.onSelect(async (value) => {
            text.inputEl.blur();
            if (value.item) {
                $event.note = value.item.path;
                tryParse(value.item);
            }
        });
    };
    const tryParse = async (file: TFile) => {
        $event.name = file.basename;
        const cache = app.metadataCache.getFileCache(file);

        const { frontmatter } = cache ?? {};
        if (frontmatter) {
            if ("fc-display-name" in frontmatter) {
                $event.name = frontmatter["fc-display-name"];
            }

            const info = helper.parseFileForDates(frontmatter, {
                path: file.path,
                basename: file.basename,
            });
            if (info) {
                $event.type = info.type;
                $event.date = { ...info.date };
                if ("end" in info && $event.type === EventType.Range) {
                    $event.end = { ...info.end };
                }
            }

            if ("fc-category" in frontmatter) {
                if (
                    !$store.categories.find(
                        (c) => c.name === frontmatter["fc-category"],
                    )
                ) {
                    $store.categories.push({
                        name: frontmatter["fc-category"],
                        color: "#808080",
                        id: nanoid(6),
                    });
                }
                $event.category =
                    $store.categories.find(
                        (c) => c.name === frontmatter["fc-category"],
                    )?.id ?? null;
            }
        }
    };
</script>

<div class="setting-item">
    <SettingItem>
        <div slot="name">Event name</div>
        <input type="text" slot="control" bind:value={$event.name} />
    </SettingItem>
</div>
<div class="setting-item">
    <SettingItem>
        <div slot="name">Note</div>
        <div slot="desc">Link the event to a note</div>
        <div slot="control" use:suggest />
    </SettingItem>
</div>
<div class="setting-item">
    <SettingItem>
        <div slot="name">Event description</div>
    </SettingItem>
</div>
<textarea class="desc" bind:value={$event.description} />
{#if $store.categories.length}
    <div class="setting-item">
        <SettingItem>
            <div slot="name">Event category</div>
            <select slot="control" bind:value={$event.category}>
                {#each $store.categories as category}
                    <option
                        value={category.id}
                        selected={($event.category ??
                            $store.categories[0].id) === category.id}
                        >{category.name}</option
                    >
                {/each}
            </select>
        </SettingItem>
    </div>
{/if}

<style scoped>
    .setting-item {
        border: 0;
    }
    .desc {
        resize: vertical;
        width: 100%;
    }
</style>
