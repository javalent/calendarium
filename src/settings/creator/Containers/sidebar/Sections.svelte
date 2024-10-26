<script lang="ts">
    import { setNodeIcon, WARNING } from "src/utils/icons";
    import type { CreatorSection } from "../../creator.types";
    import type { Writable } from "svelte/store";
    import { getContext } from "svelte";

    export let sections: CreatorSection[];
    export let selected: Writable<CreatorSection>;

    const getIcon = (section: CreatorSection) => {
        switch (section) {
            case "General":
                return "badge-info";
            case "Dates":
                return "calendar";
            case "Weather":
                return "cloud";
            case "Celestial bodies":
                return "moon";
            case "Eras":
                return "calendar-range";
            case "Events":
                return "calendar-clock";
        }
    };

    const store = getContext("store");
    const { validName, validDate, validMonths, validWeekdays, validYears } =
        store;

    $: validSection = (section: CreatorSection): boolean => {
        switch (section) {
            case "General": {
                return $validName;
            }
            case "Dates": {
                return (
                    $validDate && $validMonths && $validWeekdays && $validYears
                );
            }
            default: {
                return true;
            }
        }
    };
</script>

<div class="vertical-tab-header-group-items">
    {#each sections as SECTION}
        <div
            class="vertical-tab-nav-item"
            class:is-active={$selected === SECTION}
            on:click={() => ($selected = SECTION)}
        >
            <div class="section">
                <div use:setNodeIcon={getIcon(SECTION)} />
                {SECTION}
            </div>
            {#if !validSection(SECTION)}
                <div
                    class="calendarium-warning x-small"
                    use:setNodeIcon={WARNING}
                />
            {/if}
        </div>
    {/each}
</div>

<style scoped>
    .vertical-tab-nav-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .calendarium-warning {
        color: var(--interactive-accent);
    }
    .is-active .calendarium-warning {
        color: var(--text-on-accent);
    }
    .section {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
</style>
