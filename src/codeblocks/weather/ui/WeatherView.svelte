<script lang="ts">
    import { getTypedContext } from "src/calendar/view.utils";
    import { derived, get, writable } from "svelte/store";
    import { onMount } from "svelte";
    import { scaleLinear } from "d3-scale";
    import { stringifyTemperature } from "src/utils/functions";

    const store = getTypedContext("store");
    $: ({ weatherStore, yearCalculator, current, staticStore } = $store);
    $: year = yearCalculator.getYearFromCache($current.year);
    $: next = yearCalculator.getYearFromCache($current.year + 1).daysBefore;
    $: daysBefore = year.daysBefore;
    $: date = { year: $current.year, day: 1, month: 0 };
    $: days = derived([daysBefore, next], ([daysBefore, next]) => [
        ...Array(next - daysBefore).keys(),
    ]);

    $: units = derived(staticStore.weather, (data) => data.tempUnits);

    $: temperatures = derived([store, days], ([store, days]) => {
        const temperatures = [];
        for (const day of days) {
            const next = store.getOffsetDate(date, day);
            const weather = get(weatherStore.getWeatherForDate(next));
            temperatures.push(weather?.temperature.actual ?? null);
        }
        return temperatures;
    });
    $: max = derived(temperatures, (t) =>
        Math.max(...t.filter((t) => t != null)),
    );
    $: min = derived(temperatures, (t) =>
        Math.min(...t.filter((t) => t != null)),
    );

    let svg: SVGElement;
    let width = writable(750);
    let height = writable(200);

    const padding = { top: 20, right: 40, bottom: 40, left: 25 };

    $: xScale = derived([width, temperatures], ([width, temperatures]) =>
        scaleLinear()
            .domain([0, temperatures.length])
            .range([padding.left, width - padding.right]),
    );

    $: yScale = derived([height, max, min], ([height, max, min]) =>
        scaleLinear()
            .domain([min * 0.75, max * 1.25])
            .range([height - padding.bottom, padding.top]),
    );
    $: xTicks = derived([year.months, days], ([months, days]) => {
        let ticks: { name: string; pos: number }[] = [];
        let pos = 0;
        for (const month of months) {
            ticks.push({ name: month.name!.slice(0, 3), pos });
            pos += month.length;
        }
        ticks.push({
            name: `${year.year + 1}`,
            pos: days.length,
        });
        return ticks;
    });
    $: yTicks = derived([max, min], ([max, min]) => {
        //3 high, 3 low?
        const ticks: { name: string; pos: number }[] = [];
        let range = max - min;
        for (let i = 0; i < 7; i++) {
            ticks.push({
                name: `${stringifyTemperature(max - i * (range / 7), $units)}`,
                pos: max - (i * range) / 7,
            });
        }
        ticks.push({
            name: `${stringifyTemperature(min, $units)}`,
            pos: min,
        });

        return ticks;
    });

    onMount(resize);

    function resize() {
        const { width: w, height: h } = svg.getBoundingClientRect();
        width.set(w);
        height.set(h);
    }
</script>

<h2>Weather</h2>

<svg bind:this={svg}>
    <!-- y axis -->
    <g class="axis y-axis">
        {#each $yTicks as tick}
            <g
                class="tick"
                transform="translate(0, {$yScale(tick.pos)})"
                stroke="#ddd"
            >
                <line x1={padding.left} x2={$width - padding.right} />
                <text x={padding.left - 2} y="+4">{tick.name}</text>
            </g>
        {/each}
    </g>

    <!-- x axis -->
    <g class="axis x-axis">
        {#each $xTicks as tick, index}
            <g
                class="tick"
                transform="translate({$xScale(tick.pos)},0)"
                stroke="#ddd"
            >
                <line
                    y1={$yScale($min)}
                    y2={$yScale($max)}
                    stroke-dasharray={index !== 0 ? 2 : 0}
                />
                <text y={$height - padding.bottom + 35} text-anchor="middle"
                    >{tick.name}</text
                >
            </g>
        {/each}
    </g>

    <!-- data -->
    <!--     {#each points as point}
        <circle cx={$xScale(point.x)} cy={$yScale(point.y)} r="5" />
        {/each} -->
    {#each $temperatures as temp, index}
        {#if temp}
            <circle cx={$xScale(index)} cy={$yScale(temp)} r="5" />
        {/if}
    {/each}
</svg>

<style>
    svg {
        width: 100%;
        height: 400px;
        float: left;
    }

    circle {
        fill: orange;
        fill-opacity: 0.6;
        stroke: rgba(0, 0, 0, 0.5);
    }

    .tick line {
        stroke: #ddd;
        stroke-dasharray: 2;
    }

    text {
        font-size: 12px;
        fill: #999;
    }

    .x-axis text {
        text-anchor: middle;
    }

    .y-axis text {
        text-anchor: end;
    }
</style>
