<script lang="ts">
    export let heading: boolean = false;
</script>

<div class="setting-item" class:setting-item-heading={heading}>
    <div class="setting-item-info">
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
</div>
