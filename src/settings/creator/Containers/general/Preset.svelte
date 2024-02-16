<script lang="ts">
    import copy from "fast-copy";
    import { Setting } from "obsidian";
    import type { CalDate } from "src/schemas";
    import { CalendarPresetModal } from "src/settings/modals/preset";
    import { nanoid } from "src/utils/functions";
    import type Calendarium from "src/main";
    import { getContext } from "svelte";

    const calendar = getContext("store");
    const plugin = getContext<Calendarium>("plugin");
        
    const preset = (node: HTMLElement) => {
        const presetEl = node.createDiv("calendarium-apply-preset");
        new Setting(presetEl)
            .setName("Apply preset")
            .setDesc("Apply a common Calendarium as a preset.")
            .addButton((b) => {
                b.setCta()
                    .setButtonText("Choose Preset")
                    .onClick(() => {
                        const modal = new CalendarPresetModal(plugin.app);
                        modal.onClose = () => {
                            if (!modal.saved) return;
                            const current: CalDate = {
                                day: modal.preset.current.day!,
                                month: modal.preset.current.month!,
                                year: modal.preset.current.year!,
                            };
                            if (modal.preset?.name == "Gregorian Calendar") {
                                const today = new Date();

                                current.year = today.getFullYear();
                                current.month = today.getMonth();
                                current.day = today.getDate();
                            }
                            $calendar = {
                                ...copy(modal.preset),
                                id: nanoid(8),
                                name: $calendar.name?.length
                                    ? $calendar.name
                                    : modal.preset.name!,
                                current: { ...current },
                            };
                        };
                        modal.open();
                    });
            });
    };
</script>

<div use:preset />
