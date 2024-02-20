<script lang="ts">
    import { setNodeIcon } from "src/utils/icons";
    import type createStore from "../stores/calendar";
    import { getContext } from "svelte";
    import { REDO, UNDO } from "src/utils/icons";

    const store = getContext("store");
    const { undo, redo, canRedo, canUndo } = store;

    const tryUndo = () => {
        if (!$canUndo) return;
        undo();
    };
    const tryRedo = () => {
        if (!$canRedo) return;
        redo();
    };
</script>

<div class="creator-history">
    <div
        class="clickable-icon setting-editor-extra-setting-button"
        class:is-disabled={!$canUndo}
        use:setNodeIcon={UNDO}
        on:click={tryUndo}
    />
    <div
        class="clickable-icon setting-editor-extra-setting-button"
        class:is-disabled={!$canRedo}
        use:setNodeIcon={REDO}
        on:click={tryRedo}
    />
</div>

<style>
    .creator-history {
        display: flex;
        padding: var(--size-2-3);
    }
</style>
