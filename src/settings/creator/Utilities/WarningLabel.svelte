<script lang="ts">
    export let label: string;
</script>

<div class="warning-label-container">
    <div class="setting-item-description warning-label">
        {label}
    </div>
</div>

<style scoped>
    .warning-label {
        color: var(--text-error);
    }
</style>
