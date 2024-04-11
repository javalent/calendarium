<script lang="ts">
    import { getTypedContext } from "src/calendar/view.utils";
    import Month from "../Month/Month.svelte";
    import { nanoid } from "src/utils/functions";
    import { onMount } from "svelte";
    import { afterUpdate } from "svelte";

    let yearContainer: HTMLDivElement;

    const global = getTypedContext("store");
    $: store = $global;
    $: yearCalculator = store.yearCalculator;

    const ephemeral = getTypedContext("ephemeralStore");
    $: displaying = $ephemeral.displaying;
    $: displayedMonth = $ephemeral.displayingMonth;

    const full = getTypedContext("full");

    $: yearStore = yearCalculator.getYearFromCache($displaying.year);
    $: monthArray = yearStore.months;

    let _refs: HTMLElement[] = [];
    $: refs = _refs.filter(Boolean);
    const focus = (year: HTMLElement) => {
        const header = year.querySelector(
            `#${getIdForMonth($displayedMonth.name)}`,
        );
        if (header) header.scrollIntoView(true);
    };
    const id_map = new Map();
    const getIdForMonth = (month: string | null) => {
        if (!month) return "";
        if (!id_map.has(month)) {
            id_map.set(
                month,
                `ID_${nanoid(5)}_${month.replace(/^[^a-z]+|[^\w:.-]+/gi, "")}`,
            );
        }
        return id_map.get(month);
    };

    const monthInFrame = getTypedContext("monthInFrame");
    const intersectionObserver = new IntersectionObserver(([entry]) => {
        if (!mounted) {
            mounted = true;
            return;
        }

        if (
            entry.boundingClientRect.top < 0 &&
            entry.target instanceof HTMLElement
        ) {
            $monthInFrame = Number(entry.target.dataset.index) + 1;
        }
    });

    let mounted = false;
    onMount(() => {
        for (const ref of refs) {
            intersectionObserver.observe(ref);
        }
    });
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
                data-index={index}
                bind:this={refs[index]}
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
