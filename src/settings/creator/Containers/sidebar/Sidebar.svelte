<script lang="ts">
    import type { Writable } from "svelte/store";
    import CreatorTitle from "../../CreatorTitle.svelte";
    import type { CreatorSection } from "../../creator.types";
    import Sections from "./Sections.svelte";
    import { ButtonComponent } from "obsidian";
    import { createEventDispatcher } from "svelte";

    export let sections: CreatorSection[];
    export let selected: Writable<CreatorSection>;

    const dispatch = createEventDispatcher<{ cancel: null }>();
    const cancel = (node: HTMLDivElement) => {
        new ButtonComponent(node)
            .setButtonText("Cancel")
            .setCta()
            .onClick(() => {
                dispatch("cancel");
            });
    };
</script>

<div class="vertical-tab-header">
    <CreatorTitle />
    <div class="vertical-tab-header-group">
        <Sections {selected} {sections} />
    </div>

    <div class="bottom">
        <div class="cancel" use:cancel />
    </div>
</div>

<style scoped>
    .vertical-tab-header {
        display: flex;
        flex-flow: column nowrap;
    }
    .bottom {
        margin-top: auto;
        justify-content: flex-end;
        display: flex;
    }
</style>
