<script lang="ts">
    import { setIcon } from "obsidian";
    import { getMissingNotice } from "./Utilities/utils";
    import createStore from "./stores/calendar";
    import { getContext } from "svelte";
    import { CHECK, WARNING } from "src/utils/icons";

    const store = getContext("store");
    const { valid } = store;

    const setValidation = (node: HTMLElement, valid: boolean) => {
        const icon = node.createSpan("save");
        if (valid) {
            icon.addClass("can-save");
        }
        icon.setAttr(
            "aria-label",
            valid ? "All good! Exit to save." : getMissingNotice($store),
        );
        setIcon(icon, valid ? CHECK : WARNING);
    };
</script>

<div class="creator-title vertical-tab-nav-item">
    <h3 class="title">
        Calendar Creator
        <div class="creator-check">
            {#key $valid}
                <div class="check" use:setValidation={$valid} />
            {/key}
        </div>
    </h3>
</div>

<style scoped>
    .title {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .creator-title h3 {
        margin-top: 0;
    }
    .creator-title :global(.can-save) {
        color: var(--background-modifier-success);
    }
    .creator-title.vertical-tab-nav-item:hover {
        background-color: initial;
    }
</style>
