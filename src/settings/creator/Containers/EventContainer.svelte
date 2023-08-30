<script lang="ts">
    import type { CalEvent, Calendar } from "src/@types";
    import { dateString } from "src/utils/functions";

    import EventInstance from "./EventInstance.svelte";
    import AddNew from "../Utilities/AddNew.svelte";
    import NoExistingItems from "../Utilities/NoExistingItems.svelte";
    import type Calendarium from "src/main";
    import { CreateEventModal } from "src/settings/modals/event/event";
    import Details from "../Utilities/Details.svelte";
    import ButtonComponent from "../Settings/ButtonComponent.svelte";
    import { confirmWithModal } from "src/settings/modals/confirm";
    import {
        Setting,
        prepareFuzzySearch,
        FuzzyMatch,
        debounce,
        SearchComponent,
        normalizePath,
        TFolder,
        TextComponent as ObsidianTextComponent,
        ExtraButtonComponent,
    } from "obsidian";
    import { getContext } from "svelte";
    import { derived, writable } from "svelte/store";
    import ToggleComponent from "../Settings/ToggleComponent.svelte";
    import TextComponent from "../Settings/TextComponent.svelte";
    import { FolderSuggestionModal } from "src/suggester/folder";
    import { DEFAULT_CALENDAR } from "src/settings/settings.constants";

    export let plugin: Calendarium;

    const calendar = getContext("store");
    const { eventStore, monthStore } = calendar;
    const { sortedStore } = eventStore;

    const slicer = writable(1);
    let filtered = false;
    let nameFilter = writable<string>("");

    $: autoParse = $calendar.autoParse;

    $: supportInlineEvents = $calendar.supportInlineEvents;
    if (!$calendar.inlineEventTag)
        $calendar.inlineEventTag = DEFAULT_CALENDAR.inlineEventTag;

    let path = writable(DEFAULT_CALENDAR.path[0]);
    const folder = (node: HTMLElement) => {
        let folders = plugin.app.vault
            .getAllLoadedFiles()
            .filter(
                (f) =>
                    f instanceof TFolder &&
                    !$calendar.path.find((p) => f.path.startsWith(p))
            );
        const text = new ObsidianTextComponent(node);
        if (!$calendar.path) $calendar.path = ["/"];
        text.setPlaceholder($calendar.path[0] ?? "/");
        const modal = new FolderSuggestionModal(plugin.app, text, [
            ...(folders as TFolder[]),
        ]);

        modal.onClose = async () => {
            const v = text.inputEl.value?.trim()
                ? text.inputEl.value.trim()
                : "/";
            $path = normalizePath(v);
        };

        text.inputEl.onblur = async () => {
            const v = text.inputEl.value?.trim()
                ? text.inputEl.value.trim()
                : "/";
            $path = normalizePath(v);
        };
    };

    const addPathButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("plus-with-circle");
    };
    const addPath = () => {
        if ($path.length && !$calendar.path.includes($path)) {
            $calendar.path = [...$calendar.path, $path];
        }
    };
    const pathSetting = (node: HTMLElement, path: string) => {
        new Setting(node).setName(path).addExtraButton((b) =>
            b.setIcon("trash").onClick(() => {
                $calendar.path = $calendar.path.filter((p) => p != path);
            })
        );
    };
    $: inlineEventTagDesc = createFragment((e) => {
        e.createSpan({
            text: "Tag to specify which notes to scan for inline events, e.g. ",
        });
        e.createEl("code", { text: "inline-events" });
        e.createSpan({
            text: " to use the ",
        });
        e.createEl("code", { text: "#inline-events" });
        e.createSpan({
            text: " tag.",
        });
    });

    const inlineEventTagSetting = (node: HTMLElement) => {
        const text = new ObsidianTextComponent(node);
        text.setValue(
            `${$calendar.inlineEventTag ?? ""}`.replace("#", "")
        ).onChange(async (v) => {
            $calendar.inlineEventTag = v.startsWith("#") ? v : `#${v}`;
            await plugin.saveSettings();
        });
    };

    const sorted = derived([sortedStore, nameFilter], ([events, filter]) => {
        if (!filter || !filter.length) {
            filtered = false;
            return events;
        }
        const results = [];
        for (const event of events) {
            const result = prepareFuzzySearch(filter)(event.name);
            if (result) {
                results.push(event);
            }
        }
        filtered = true;
        return results;
    });

    const sliced = derived([sorted, slicer], ([events, slicer]) =>
        events.slice(0, 100 * slicer)
    );

    const deleteEvent = (item: CalEvent) => {
        eventStore.delete(item.id);
    };
    const getCategory = (category: string) => {
        return $calendar.categories.find(({ id }) => id == category);
    };
    const add = (event?: CalEvent) => {
        const modal = new CreateEventModal($calendar, event);
        modal.onClose = () => {
            if (!modal.saved) return;
            if (modal.editing) {
                eventStore.update(event.id, { ...modal.event });
            } else {
                eventStore.add({ ...modal.event });
            }
        };
        modal.open();
    };
    const deleteAll = async () => {
        if (
            await confirmWithModal(
                plugin.app,
                "Are you sure you want to delete all events from this calendar?"
            )
        ) {
            eventStore.set([]);
        }
    };
    const filter = (node: HTMLElement) => {
        node.createDiv();
        let search: SearchComponent;
        new Setting(node)
            .setName("Filter events")
            .addSearch((s) => {
                search = s;
                s.onChange(
                    debounce((v) => {
                        $nameFilter = v;
                    }, 250)
                );
            })
            .addExtraButton((b) => {
                b.setIcon("trash")
                    .setTooltip("Delete Filtered Events")
                    .onClick(async () => {
                        if (
                            await confirmWithModal(
                                plugin.app,
                                "Are you sure you want to delete the filtered events from this calendar?"
                            )
                        ) {
                            eventStore.set(
                                $eventStore.filter((e) => !$sorted.includes(e))
                            );
                            search.setValue("");
                            $nameFilter = "";
                        }
                    });
            });
    };
</script>

<Details
    name={"Events"}
    desc={`Displaying ${$sorted.length}/${$calendar.events.length} events.`}
    open={false}
>
    <ToggleComponent
        name={"Parse Files for Events"}
        desc={"The plugin will automatically parse files in the vault for events for this calendar."}
        value={autoParse}
        on:click={() => {
            $calendar.autoParse = !$calendar.autoParse;
        }}
    />
    {#if autoParse}
        <TextComponent
            name={"Events Folders"}
            desc={"The plugin will only parse files in these folders for events."}
            value={$calendar.path[0]}
        >
            <div use:folder />
            <div use:addPathButton on:click={addPath} />
        </TextComponent>
        <div class="existing-paths">
            {#each $calendar.path as path (path)}
                <div class="existing-path" use:pathSetting={path} />
            {/each}
        </div>
        <ToggleComponent
            name={"Support Inline Events"}
            desc={"Look for <span> tags defining events in notes."}
            value={supportInlineEvents}
            on:click={() => {
                $calendar.supportInlineEvents = !$calendar.supportInlineEvents;
            }}
        />
        {#if supportInlineEvents}
            {#key $calendar.supportInlineEvents}
                <TextComponent
                    name={"Default Inline Events Tag"}
                    desc={inlineEventTagDesc}
                    value={""}
                >
                    <div
                        use:inlineEventTagSetting
                        class="setting-item-control"
                    />
                </TextComponent>
            {/key}
        {/if}
    {/if}
    <ButtonComponent
        name={"Delete All Events"}
        icon="trash"
        on:click={() => deleteAll()}
    />
    <div class="filter" use:filter />
    <AddNew on:click={() => add()} />
    <div class="existing-items">
        {#each $sliced as event}
            <EventInstance
                {event}
                category={getCategory(event.category)}
                date={dateString(event.date, $calendar, event.end)}
                on:edit={() => add(event)}
                on:delete={() => deleteEvent(event)}
            />
        {:else}
            <div />
            <div class="setting-item">
                <NoExistingItems
                    message={"Create a new event to see it here."}
                />
            </div>
        {/each}
    </div>
    {#if !filtered && $sliced.length < $eventStore.length}
        <div class="more" on:click={() => $slicer++}>
            <small>Load More Events...</small>
        </div>
    {/if}
</Details>

<style>
    .more {
        text-align: center;
        padding-top: 10px;
        text-decoration: underline;
        font-style: italic;
        cursor: pointer;
    }
    .existing-paths {
        padding: 1rem 2rem;
        display: flex;
        flex-flow: column;
    }
</style>
