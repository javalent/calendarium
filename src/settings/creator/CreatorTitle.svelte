<script lang="ts">
    import { ExtraButtonComponent, setIcon } from "obsidian";
    import { getMissingNotice, warning } from "./Utilities/utils";
    import createStore from "./stores/calendar";

    export let store: ReturnType<typeof createStore>;
    const { undo, redo, canRedo, canUndo, valid } = store;

    const isValid = (node: HTMLElement) => {
        setIcon(node.createSpan("save can-save"), "checkmark");
        node.createSpan({
            cls: "additional can-save",
            text: "All good! Exit to save calendar.",
        });
    };
    const isInvalid = (node: HTMLElement) => {
        warning(
            node.createSpan({
                cls: "save",
                attr: {
                    "aria-label": getMissingNotice($store),
                },
            })
        );
        node.createSpan({
            cls: "additional",
            text: "Additional information is required to save.",
        });
    };

    const undoBtn = (node: HTMLElement) => {
        setIcon(node, "undo");
    };
    const redoBtn = (node: HTMLElement) => {
        setIcon(node, "redo");
    };
    const tryUndo = () => {
        if (!$canUndo) return;
        undo();
    };
    const tryRedo = () => {
        if (!$canRedo) return;
        redo();
    };
</script>

<div class="creator-title">
    <span>Calendar Creator</span>
    <div class="creator-context">
        <div class="creator-check">
            {#if $valid}
                <div class="check" use:isValid />
            {:else}
                <div class="check" use:isInvalid />
            {/if}
        </div>
        <div class="creator-history">
            <div
                class="clickable-icon setting-editor-extra-setting-button"
                class:is-disabled={!$canUndo}
                use:undoBtn
                on:click={tryUndo}
            />
            <div
                class="clickable-icon setting-editor-extra-setting-button"
                class:is-disabled={!$canRedo}
                use:redoBtn
                on:click={tryRedo}
            />
        </div>
    </div>
</div>

<style scoped>
    .creator-context {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    /* .creator-title {
        display: flex;
    } */
    .creator-history {
        display: flex;
    }
</style>
