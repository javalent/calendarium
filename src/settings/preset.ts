import copy from "fast-copy";
import type { CalDate, Calendar } from "src/schemas";
import { nanoid } from "src/utils/functions";
import { CalendarPresetModal } from "./modals/preset";
import type Calendarium from "src/main";

export function getPresetCalendar(
    plugin: Calendarium,
    name?: string
): Promise<Calendar | void> {
    return new Promise((resolve) => {
        const modal = new CalendarPresetModal(plugin.app);
        modal.onClose = () => {
            if (!modal.saved) resolve();
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
            resolve({
                ...copy(modal.preset),
                id: nanoid(8),
                name: name?.length ? name : modal.preset.name!,
                current: { ...current },
            });
        };
        modal.open();
    });
}
