<script lang="ts">
    export let isHeading = false;
</script>

<div class="setting-item-info" class:setting-item-heading={isHeading}>
    <span class="setting-item-name">
        <slot name="name" />
    </span>
    <div class="setting-item-description">
        <slot name="desc" />
    </div>
</div>
<div class="setting-item-control">
    <slot name="control" />
</div>
