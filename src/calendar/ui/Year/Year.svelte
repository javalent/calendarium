<script lang="ts">
    import { getTypedContext } from "src/calendar/view";
    import Month from "../Month/Month.svelte";
    import { nanoid } from "src/utils/functions";

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

    /* const months = $monthArray.map((m) =>
        yearStore.getMonthFromCache($monthArray.indexOf(m))
    ); */
    const focus = (year: HTMLElement) => {
        const header = year.querySelector(
            `#${getIdForMonth($displayedMonth.name)}`
        );
        if (header) header.scrollIntoView(true);
    };
    const id_map = new Map();
    const getIdForMonth = (month: string) => {
        if (!id_map.has(month)) {
            id_map.set(
                month,
                `ID_${nanoid(5)}_${month.replace(/^[^a-z]+|[^\w:.-]+/gi, "")}`
            );
        }
        return id_map.get(month);
    };
</script>

<div class="year-container calendarium">
    <div
        class="year calendarium"
        bind:this={yearContainer}
        use:focus
        class:full={$full}
    >
        {#each $monthArray as month, index}
            <div
                class="month-container calendarium"
                id={getIdForMonth(month.name)}
            >
                <Month year={$displaying.year} month={index} />
            </div>
        {/each}
    </div>
</div>

<style scoped>
    .year-container {
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
