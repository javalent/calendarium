<script lang="ts">
    import { ExtraButtonComponent, Setting } from "obsidian";
    import { EventType } from "src/events/event.types";
    import type {
        CalEvent,
        CalEventDate,
        OneTimeCalEventDate,
        RecurringCalEventDate,
    } from "src/schemas";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";
    import type { CalendarStore } from "src/stores/calendar.store";
    import { TRASH } from "src/utils/icons";

    import { derived, get, writable, type Writable } from "svelte/store";
    import RecurringDate from "./RecurringInput.svelte";
    import RecurringSelect from "./RecurringSelect.svelte";

    export let event: Writable<CalEvent>;
    export let store: CalendarStore;

    const date = derived(event, (event) => event.date);
    const end = writable($event.type === EventType.Range ? $event.end : null);
    end.subscribe((v) => {
        if ($event.type === EventType.Range && v !== null) {
            $event.end = v;
        }
    });

    $: onetime = $date as OneTimeCalEventDate;

    const { yearCalculator } = store;

    let months: Set<string> = new Set();

    const isRecurringYear = derived(date, (date) => Array.isArray(date.year));
    const isRecurringMonth = derived(date, (date) => Array.isArray(date.month));
    const isRecurringDay = derived(date, (date) => Array.isArray(date.day));
    const isRecurring = derived(
        [isRecurringYear, isRecurringMonth, isRecurringDay],
        ([year, month, day]) => year || month || day,
    );
    isRecurring.subscribe((v) => {
        if (v) {
            $end = null;
            $event.type = EventType.Recurring;
        } else {
            $event.type = EventType.Date;
        }
    });
    const isRange = derived(end, (end) => end != null);
    $: {
        if ($isRange) {
            $event.type = EventType.Range;
        } else if ($isRecurring) {
            $event.type = EventType.Recurring;
        } else if (
            $date.year == null &&
            $date.month == null &&
            $date.day == null
        ) {
            $event.type = EventType.Undated;
        } else {
            $event.type = EventType.Date;
        }
    }

    $: {
        const arr = [$date.year].flat();
        if (arr.every((y) => y == null)) {
            months = new Set($store.static.months.map((m) => m.name!));
        } else {
            months = new Set();
            for (let i = 0; i < arr.length; i++) {
                const year = arr[i];
                if (!year) continue;
                const monthsInYear =
                    yearCalculator.getYearFromCache(year).months;
                for (const month of get(monthsInYear)) {
                    months.add(month.name!);
                }
            }
        }
    }

    const recurringIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon("repeat")
            .setTooltip("Make recurring");
    };
    const removeRecurring = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon(TRASH)
            .setTooltip("Make recurring");
    };
    const rangedSetting = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("calendar-range");
    };

    const setRecurring = (field: keyof CalEventDate) => {
        $date[field] = [$date[field] as number, null];
    };
</script>

{#if $event.type === EventType.Undated}
    <div class="setting-item">
        <SettingItem>
            <div class="ranged-event" slot="name">
                <span>Add event date</span>
                <div
                    use:rangedSetting
                    on:click={() => {
                        $date = { ...$store.current };
                        $event.type = EventType.Date;
                    }}
                />
            </div>
        </SettingItem>
    </div>
{:else}
    <div class="setting-item setting-item-heading">
        <SettingItem>
            <div slot="name">{$isRange ? "Start" : "Event"} date</div>
            <div
                slot="control"
                use:removeRecurring
                on:click={() => {
                    $date = {
                        year: null,
                        month: null,
                        day: null,
                    };
                    if ($end) {
                        $end = null;
                    }
                    $event.type = EventType.Undated;
                }}
            />
        </SettingItem>
    </div>
    <div class="setting-item calendarium-date-field-container">
        <div class="calendarium-date-field">
            <span>Year</span>
            {#if !$isRecurringYear || $isRange}
                <div class="recurring">
                    <input
                        type="number"
                        spellcheck="false"
                        placeholder="Year"
                        class:warning={$date.year == null}
                        bind:value={$date.year}
                    />

                    {#if !$isRange}
                        <div
                            use:recurringIcon
                            on:click={() => setRecurring("year")}
                        />
                    {/if}
                </div>
            {:else}
                <RecurringDate {date} field={"year"} placeholder={"Year"} />
            {/if}
        </div>
        <div class="calendarium-date-field">
            <span>Month</span>
            {#if !$isRecurringMonth || $isRange}
                <div class="recurring">
                    <select class="dropdown" bind:value={$date.month}>
                        {#each [...months] as month, index}
                            <option value={index}>{month}</option>
                        {/each}
                    </select>

                    {#if !$isRange}
                        <div
                            use:recurringIcon
                            on:click={() => setRecurring("month")}
                        />
                    {/if}
                </div>
            {:else}
                <RecurringSelect items={[...months]} {date} field="month" />
            {/if}
        </div>
        <div class="calendarium-date-field">
            <span>Day</span>

            {#if !$isRecurringDay || $isRange}
                <div class="recurring">
                    <input
                        type="number"
                        spellcheck="false"
                        placeholder="Day"
                        class:warning={$date.day == null}
                        bind:value={$date.day}
                    />
                    {#if !$isRange}
                        <div
                            use:recurringIcon
                            on:click={() => setRecurring("day")}
                        />
                    {/if}
                </div>
            {:else}
                <RecurringDate {date} field={"day"} placeholder={"Day"} />
            {/if}
        </div>
    </div>
    {#if !$isRecurring}
        {#if $end}
            <div class="setting-item setting-item-heading">
                <SettingItem>
                    <div slot="name">End date</div>
                    <div
                        slot="control"
                        use:removeRecurring
                        on:click={() => {
                            $end = null;
                            $event.type = EventType.Date;
                        }}
                    />
                </SettingItem>
            </div>
            <div class="setting-item calendarium-date-field-container">
                <div class="calendarium-date-field">
                    <span>Year</span>
                    <input
                        type="number"
                        spellcheck="false"
                        placeholder="Year"
                        class:warning={$end.year == null}
                        bind:value={$end.year}
                    />
                </div>
                <div class="calendarium-date-field">
                    <span>Month</span>
                    <select class="dropdown" bind:value={$end.month}>
                        {#each [...months] as month, index}
                            <option value={index}>{month}</option>
                        {/each}
                    </select>
                </div>
                <div class="calendarium-date-field">
                    <span>Day</span>

                    <input
                        type="number"
                        spellcheck="false"
                        placeholder="Day"
                        class:warning={$end.day == null}
                        bind:value={$end.day}
                    />
                </div>
            </div>
        {:else}
            <div class="setting-item">
                <SettingItem>
                    <div class="ranged-event" slot="name">
                        <span>Add end date</span>
                        <div
                            use:rangedSetting
                            on:click={() => {
                                $end = { ...onetime };
                                $event.type = EventType.Range;
                            }}
                        />
                    </div>
                </SettingItem>
            </div>
        {/if}
    {/if}
{/if}

<style scoped>
    .calendarium-date-field-container.calendarium-date-field-container {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-items: flex-start;
        gap: 0.5rem;
        border: 0;
        max-width: 100%;
    }
    .calendarium-date-field {
        display: flex;
        flex-flow: column;
        gap: 0.5rem;
    }

    .recurring {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    .ranged-event {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-muted);
        font-style: italic;
    }
    .calendarium-date-field input,
    .calendarium-date-field select {
        width: 100%;
    }
    .setting-item {
        border: 0;
        padding-top: 0;
    }
    .warning {
        border-color: var(--text-error);
    }
</style>
