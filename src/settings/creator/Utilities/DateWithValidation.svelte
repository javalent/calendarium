<script lang="ts">
    import { getContext } from "svelte";
    import {
        invalidDayLabel,
        invalidMonthLabel,
        invalidYearLabel,
    } from "../Utilities/utils";

    const calendar = getContext("store");
    const {
        monthStore,
        validDay,
        validMonth,
        validYear,
        yearStore,
        currentStore,
    } = calendar;
</script>

<div class="calendarium-date-field-container">
    <div class="calendarium-date-field">
        <div class="warning-container">
            <label for="">Day</label>
            {#if !$validDay}
                <div class="setting-item-description">
                    {#if !$validDay}
                        {invalidDayLabel($currentStore.day, $calendar)}
                    {/if}
                </div>
            {/if}
        </div>
        <input
            type="number"
            spellcheck="false"
            placeholder="Day"
            class:invalid={!$validDay}
            bind:value={$currentStore.day}
        />
    </div>
    <div class="calendarium-date-field">
        <div class="warning-container">
            <label for="">Month</label>
            {#if !$validMonth}
                <div class="setting-item-description">
                    {#if !$validMonth}
                        {invalidMonthLabel($currentStore.month, $calendar)}
                    {/if}
                </div>
            {/if}
        </div>
        <select
            class="dropdown"
            bind:value={$currentStore.month}
            class:invalid={!$validMonth}
        >
            {#each $monthStore.filter((m) => m.name) as month, index}
                <option value={index}>{month.name}</option>
            {/each}
        </select>
    </div>
    <div class="calendarium-date-field">
        <div class="warning-container">
            <label for="">Year</label>
            {#if !$validYear}
                <div class="setting-item-description">
                    {#if !$validYear}
                        {invalidYearLabel($currentStore.year, $calendar)}
                    {/if}
                </div>
            {/if}
        </div>
        {#if $calendar.static.useCustomYears}
            <select
                class="dropdown"
                bind:value={$currentStore.year}
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
                bind:value={$currentStore.year}
            />
        {/if}
    </div>
</div>

<style>
    .calendarium-date-field-container.calendarium-date-field-container {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        border: 0;
    }
    .calendarium-date-field {
        display: grid;
        grid-auto-rows: 1fr;
        flex: 1 1 0;
        gap: 0.5rem;
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
</style>
