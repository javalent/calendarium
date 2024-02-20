<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import MoonSVG from "src/calendar/ui/Moon.svelte";
    import type { Moon } from "src/schemas/calendar/moons";
    import { EDIT, TRASH, setNodeIcon } from "src/utils/icons";
    import { MOON_CYCLE, MOON_OFFSET } from "src/utils/icons";
    import { createEventDispatcher } from "svelte";

    const trash = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(TRASH).setTooltip("Delete");
    };
    const edit = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(EDIT).setTooltip("Edit");
    };

    export let moon: Moon;

    const dispatch = createEventDispatcher<{ edit: null; delete: null }>();
</script>

<div class="moon">
    <div class="moon-info">
        <span class="setting-item-name">
            <MoonSVG
                moon={{ ...moon, phase: "First Quarter" }}
                label={false}
                size={20}
            />
            {moon.name}
        </span>
        <div class="setting-item-description">
            <div class="date">
                <div class="icons">
                    <span class="icon small" use:setNodeIcon={MOON_CYCLE}
                    ></span>
                    {moon.cycle} days
                </div>
                {#if moon.offset}
                    <div class="icons">
                        <span class="icon small" use:setNodeIcon={MOON_OFFSET}
                        ></span>
                        {moon.offset} days
                    </div>
                {/if}
            </div>
        </div>
    </div>
    <div class="icons">
        <div class="icon" use:edit on:click={() => dispatch("edit")} />
        <div class="icon" use:trash on:click={() => dispatch("delete")} />
    </div>
</div>

<style>
    .moon {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-top: 0.5rem;
    }
    .setting-item-name {
        display: flex;
        align-items: center;
    }
    .icons {
        display: flex;
        align-self: flex-start;
        justify-self: flex-end;
        align-items: center;

        gap: 0.25rem;
    }
    .icon {
        display: flex;
        align-items: center;
    }
    .small {
        --icon-size: var(--icon-xs);
    }
</style>
