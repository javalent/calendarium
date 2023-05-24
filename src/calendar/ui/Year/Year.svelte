<script lang="ts">
    import { getTypedContext } from "src/calendar/view";
    import Month from "../Month/Month.svelte";

    let yearContainer: HTMLDivElement;

    const global = getTypedContext("store");
    $: store = $global;
    $: yearCalculator = store.yearCalculator;

    const ephemeral = getTypedContext("ephemeralStore");
    $: displaying = $ephemeral.displaying;
    $: displayedMonth = $ephemeral.displayingMonth;

    const full = getTypedContext("full");

    $: yearStore = yearCalculator.getYearFromCache($displaying.year);
    $: monthArray = store.staticStore.months;
    $: console.log("🚀 ~ file: Year.svelte:16 ~ monthArray:", monthArray);

    /* const months = $monthArray.map((m) =>
        yearStore.getMonthFromCache($monthArray.indexOf(m))
    ); */
    const focus = (year: HTMLElement) => {
        const header = year.querySelector(`#${$displayedMonth.name}`);
        if (header) header.scrollIntoView(true);
    };
</script>

<div class="year-view">
    <div class="year" bind:this={yearContainer} use:focus class:full={$full}>
        {#each $monthArray as month, index}
            <div class="month-container">
                <Month year={$displaying.year} month={index} />
            </div>
        {/each}
    </div>
</div>

<style scoped>
    .year-view {
        height: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
        overflow: auto;
    }
    .year {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
        overflow: auto;
        flex: 1;
    }
    .year.full {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
</style>
