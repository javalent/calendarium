<script lang="ts">
    import copy from "fast-copy";
    import { Setting } from "obsidian";
    import type { CalDate } from "src/schemas";
    import { CalendarPresetModal } from "src/settings/modals/preset";
    import { nanoid } from "src/utils/functions";
    import type Calendarium from "src/main";
    import { getContext } from "svelte";
    import { getPresetCalendar } from "src/settings/preset";

    const calendar = getContext("store");
    const plugin = getContext<Calendarium>("plugin");

    const preset = (node: HTMLElement) => {
        const presetEl = node.createDiv("calendarium-apply-preset");
        new Setting(presetEl)
            .setName("Apply preset")
            .setDesc("Apply a common Calendarium as a preset.")
            .addButton((b) => {
                b.setCta()
                    .setButtonText("Choose preset")
                    .onClick(async () => {
                        const preset = await getPresetCalendar(
                            plugin,
                            $calendar.name,
                        );
                        if (!preset) return;

                        $calendar = preset;
                    });
            });
    };
</script>

<div use:preset />
