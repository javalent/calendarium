<script lang="ts">
    export let isFilled: boolean = true;
    export let isActive: boolean = false;
    export let color: string | undefined;
</script>

<svg
    class="dot"
    class:filled={isFilled}
    class:active={isActive}
    viewBox="0 0 6 6"
    xmlns="http://www.w3.org/2000/svg"
>
    <circle
        stroke={color ?? "currentColor"}
        fill={color ?? "currentColor"}
        cx="3"
        cy="3"
        r="2"
    />
</svg>

<style>
    .dot {
        display: inline-block;
        min-height: 6px;
        min-width: 6px;
        height: 6px;
        width: 6px;
    }
    .active {
        color: var(--text-on-accent);
    }
</style>
