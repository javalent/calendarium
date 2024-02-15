<script lang="ts">
    import { setIcon } from "obsidian";
    import { getMissingNotice } from "./Utilities/utils";
    import createStore from "./stores/calendar";

    export let store: ReturnType<typeof createStore>;
    const { valid } = store;

    const setValidation = (node: HTMLElement, valid: boolean) => {
        const icon = node.createSpan("save");
        if (valid) {
            icon.addClass("can-save");
        } else {
            icon.setAttr("aria-label", getMissingNotice($store));
        }
        setIcon(icon, valid ? "checkmark" : "calendarium-warning");
    };
</script>

<div class="creator-title">
    <div class="title">
        <h3>Calendar Creator</h3>
        <div class="creator-check">
            <div class="check" use:setValidation={$valid} />
        </div>
    </div>
</div>

<style scoped>
    .title {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .creator-title h3 {
        margin: 0;
    }
</style>
