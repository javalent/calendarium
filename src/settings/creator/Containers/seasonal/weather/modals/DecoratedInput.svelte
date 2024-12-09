<script lang="ts">
    export let value: number;
    export let label: string | null = null;

    export let placeholder: string | null = null;
    export let min: number | null = null;
    export let max: number | null = null;
</script>

<div class="has-decorator">
    <input
        type="number"
        spellcheck="false"
        {placeholder}
        {min}
        {max}
        bind:value
        on:change
    />
    {#if label}
        <span class="input-decorator">{label}</span>
    {/if}
</div>

<style scoped>
    .has-decorator {
        position: relative;
    }
    .has-decorator input {
        padding-right: 10px;
        width: 5rem;
    }
    .input-decorator {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-accent);
    }
</style>
