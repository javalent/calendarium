<script lang="ts">
    import { getContext } from "svelte";
    import {
        invalidDayLabel,
        invalidMonthLabel,
        invalidYearLabel,
    } from "../Utilities/utils";
    import type { CalDate } from "src/schemas";
    import { derived, type Readable } from "svelte/store";
    import { isValidDay, isValidMonth, isValidYear } from "src/utils/functions";
    import { createEventDispatcher } from "svelte";

    export let date: Readable<CalDate>;

    const calendar = getContext("store");
    const { monthStore, yearStore } = calendar;
    const validDay = derived([calendar, date], ([calendar, date]) => {
        return isValidDay(date, calendar);
    });
    const validMonth = derived([calendar, date], ([calendar, date]) => {
        return isValidMonth(date.month, calendar);
    });
    const validYear = derived([calendar, date], ([calendar, date]) => {
        return isValidYear(date.year, calendar);
    });

    const dispatch = createEventDispatcher<{ valid: boolean }>();

    const isValid = derived(
        [validDay, validMonth, validYear],
        ([day, month, year]) => {
            return day && month && year;
        },
    );
    isValid.subscribe((v) => {
        dispatch("valid", v);
    });
</script>

<div class="setting-item calendarium-date-field-container">
    <div class="calendarium-date-field">
        <label for="">Day</label>
        <div class="warning-container">
            <input
                type="number"
                spellcheck="false"
                placeholder="Day"
                class:invalid={!$validDay}
                bind:value={$date.day}
            />
            {#if !$validDay}
                <div class="setting-item-description">
                    {#if !$validDay}
                        {invalidDayLabel($date, $calendar)}
                    {/if}
                </div>
            {/if}
        </div>
    </div>
    <div class="calendarium-date-field">
        <label for="">Month</label>
        <div class="warning-container">
            <select
                class="dropdown"
                bind:value={$date.month}
                class:invalid={!$validMonth}
            >
                {#each $monthStore.filter((m) => m.name) as month, index}
                    <option value={index}>{month.name}</option>
                {/each}
            </select>
            {#if !$validMonth}
                <div class="setting-item-description">
                    {#if !$validMonth}
                        {invalidMonthLabel($date.month, $calendar)}
                    {/if}
                </div>
            {/if}
        </div>
    </div>
    <div class="calendarium-date-field">
        <label for="">Year</label>
        <div class="warning-container">
            {#if $calendar.static.useCustomYears}
                <select
                    class="dropdown"
                    bind:value={$date.year}
                    class:invalid={!$validYear}
                >
                    {#each $yearStore?.filter((m) => m && m.name) ?? [] as year, index (year.id)}
                        <option value={index + 1}>{year.name}</option>
                    {/each}
                </select>
            {:else}
                <input
                    type="number"
                    spellcheck="false"
                    placeholder="Year"
                    class:invalid={!$validYear}
                    bind:value={$date.year}
                />
            {/if}
            {#if !$validYear}
                <div class="setting-item-description">
                    {#if !$validYear}
                        {invalidYearLabel($date.year, $calendar)}
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .calendarium-date-field-container.calendarium-date-field-container {
        display: flex;
        align-items: flex-start;
        flex-direction: row;
        gap: 1rem;
        border: 0;
    }
    .calendarium-date-field {
        display: grid;
        grid-auto-rows: auto 1fr;
        flex: 1 1 0;
        gap: 0.5rem;
        margin: 0;
    }

    .calendarium-date-field .setting-item-description {
        padding-top: 0;
    }

    .calendarium-date-field .invalid {
        border: 1px solid var(--text-error);
    }
    .warning-container {
        position: relative;
        display: flex;
        flex-flow: column nowrap;
        align-items: flex-start;
        gap: 0.25rem;
    }
    select {
        width: 100%;
    }
</style>
