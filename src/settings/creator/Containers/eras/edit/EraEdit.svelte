<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";

    import type { Era } from "src/schemas/calendar/timespans";

    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import TextAreaComponent from "src/settings/creator/Settings/TextAreaComponent.svelte";
    import TextComponent from "src/settings/creator/Settings/TextComponent.svelte";
    import ToggleComponent from "src/settings/creator/Settings/ToggleComponent.svelte";
    import Details from "src/settings/creator/Utilities/Details.svelte";
    import type { CreatorStore } from "src/settings/creator/stores/calendar";
    import { derived, writable, type Readable } from "svelte/store";
    import { slide } from "svelte/transition";
    import DateWithValidation from "src/settings/creator/Utilities/DateWithValidation.svelte";
    import { setContext } from "svelte";
    import { TRASH } from "src/utils/icons";
    import { formatEra } from "src/utils/functions";

    export let era: Era;
    export let store: CreatorStore;
    /* export let plugin: Calendarium; */
    setContext("store", store);

    const { eraStore } = store;

    const otherStarting: Readable<Era | undefined> = derived(eraStore, (eras) =>
        eras.find((e) => era.id != e.id && e.isStartingEra),
    );
    const startingDesc = derived(otherStarting, (era) =>
        era
            ? `This era can't be set to the starting era, because a starting era already exists.`
            : "",
    );

    const end = writable(!era.isStartingEra ? era.end : null);
    end.subscribe((v) => {
        if (!era.isStartingEra) {
            era.end = v ?? undefined;
        }
    });

    const remove = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(TRASH)
            .setTooltip("Make recurring");
    };

    const showHelp = writable(false);
    const helpIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon("help-circle")
            .onClick(() => ($showHelp = !$showHelp));
    };
    const rangedSetting = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("calendar-range");
    };
</script>

<Details name="Details" open={true}>
    <TextComponent
        name="Name"
        value={era.name}
        desc=""
        on:change={(evt) => (era.name = evt.detail)}
    />
    <TextAreaComponent
        name="Description"
        value={era.description ?? ""}
        on:change={(evt) => (era.description = evt.detail)}
    />
    <div class="setting-item text-area-component">
        <div class="setting-item align-start">
            <div class="setting-item-info">
                <div class="setting-item-name">
                    <label>Display format</label>
                </div>
                <div class="setting-item-description">
                    <span>
                        <strong>{formatEra(era, $store.current.year)}</strong>
                    </span><br />
                    {#if $showHelp}
                        <hr />
                        <div class="help-text" transition:slide={{ axis: "y" }}>
                            <span
                                >The display format of your era can be whatever
                                you want, but you can also include the following
                                options:</span
                            >
                            <ul>
                                <li>
                                    {"{{ year }}"} - Displays the current year
                                </li>
                                <li>
                                    {"{{ abs_year }}"} - Displays the current year,
                                    but without a minus in front of it if is negative.
                                </li>
                                <li>
                                    {"{{ nth_year }}"} - Display the year with an
                                    ordinal (1st, 2nd, etc).
                                </li>
                                <li>
                                    {"{{ abs_nth_year }}"} - Combination of abs_year
                                    and nth_year.
                                </li>
                                <li>
                                    {"{{ era_year }}"} - The current era year. If
                                    any eras in the past has restarted the year count,
                                    this number will be different than the year number.
                                </li>
                                <li>
                                    {"{{ era_nth_year }}"} - Similar to nth_year,
                                    but counting only the era years.
                                </li>
                                <li>
                                    {"{{ era_name }}"} - Inserts the current name
                                    of the era
                                </li>
                            </ul>
                        </div>
                    {/if}
                </div>
            </div>
            <div class="setting-item-control" use:helpIcon></div>
        </div>
        <textarea
            spellcheck="false"
            placeholder={"Display format"}
            bind:value={era.format}
        />
    </div>
</Details>

<Details name="Duration" open={false}>
    <ToggleComponent
        name="Starting era"
        disabled={$otherStarting != undefined}
        value={era.isStartingEra}
        desc={$startingDesc}
        on:click={() => (era.isStartingEra = !era.isStartingEra)}
    />

    {#if !era.isStartingEra}
        <ToggleComponent
            name="Ends the year"
            value={era.endsYear}
            desc={"A new year will begin the date this era starts."}
            on:click={() => (era.endsYear = !era.endsYear)}
        />
        <SettingItem heading={true}>
            <div slot="name">Start date</div>
        </SettingItem>
        <DateWithValidation date={writable(era.date)} />
        {#if !era.end}
            <SettingItem>
                <div class="ranged-event" slot="name">
                    <span>Add end date</span>
                    <div
                        use:rangedSetting
                        on:click={() => {
                            if (!era.isStartingEra) {
                                $end = { ...era.date };
                            }
                        }}
                    />
                </div>
            </SettingItem>
        {:else}
            <SettingItem heading={true}>
                <div slot="name">End date</div>
                <div
                    slot="control"
                    use:remove
                    on:click={() => {
                        $end = null;
                    }}
                />
            </SettingItem>
            <DateWithValidation date={writable(era.end)} />
        {/if}
    {/if}
</Details>

{#if !era.isStartingEra}
    <Details name="Event" open={false}>
        <ToggleComponent
            name="Add event"
            value={era.isEvent}
            desc={""}
            on:click={() => (era.isEvent = !era.isEvent)}
        />
        {#if era.isEvent && $store.categories.length}
            <SettingItem>
                <div slot="name">Event category</div>
                <select
                    slot="control"
                    class="dropdown"
                    bind:value={era.category}
                >
                    <option
                        value=""
                        selected={!era.category}
                        on:select={() => (era.category = null)}>None</option
                    >
                    {#each $store.categories as category}
                        <option
                            value={category.id}
                            selected={era.category === category.id}
                            >{category.name}</option
                        >
                    {/each}
                </select>
            </SettingItem>
        {/if}
    </Details>
{/if}

<style>
    .text-area-component {
        display: flex;
        flex-flow: column nowrap;
        align-items: flex-start;
        gap: 0.5rem;
        width: 100%;
    }
    .setting-item {
        width: 100%;
    }
    .align-start {
        align-items: flex-start;
    }
    hr {
        margin: 0.5rem 0;
    }
    textarea {
        width: 100%;
    }
    .ranged-event {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-muted);
        font-style: italic;
    }
</style>
