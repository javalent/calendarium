<script lang="ts">
    import { App, ButtonComponent, ExtraButtonComponent } from "obsidian";
    import type { Calendar } from "src/@types";
    import { getIntervalDescription } from "src/utils/functions";
    import { createEventDispatcher } from "svelte";
    import TextComponent from "../../../../Settings/TextComponent.svelte";
    import ToggleComponent from "../../../../Settings/ToggleComponent.svelte";
    import AddNew from "../../../../Utilities/AddNew.svelte";
    import Details from "../../../../Utilities/Details.svelte";
    import type {
        LeapDay,
        LeapDayCondition,
    } from "src/schemas/calendar/timespans";
    import { EDIT, TRASH } from "src/utils/icons";
    import { IntervalModal } from "./leapday";
    import SettingItem from "src/settings/creator/Settings/SettingItem.svelte";

    const dispatch = createEventDispatcher();

    export let app: App;
    export let leapDay: LeapDay;
    $: ic = leapDay.intercalary;

    export let calendar: Calendar;
    $: months = calendar.static.months;
    $: selected = months[leapDay.timespan];
    $: days = selected.length
        ? [...Array(selected.length).keys()].map((k) => k + 1)
        : [];

    const add = (interval?: LeapDayCondition) => {
        const modal = new IntervalModal(
            app,
            leapDay.interval.length > 0,
            interval,
        );
        modal.onClose = () => {
            if (!modal.saved) return;
            if (!modal.condition.interval) return;
            if (!interval) {
                leapDay.interval.push(modal.condition);
            } else {
                leapDay.interval.splice(
                    leapDay.interval.indexOf(interval),
                    1,
                    modal.condition,
                );
            }
            leapDay.interval = leapDay.interval;
        };
        modal.open();
    };

    $: intervals = leapDay.interval.sort(
        (a, b) =>
            (a.interval ?? Number.MIN_VALUE) - (b.interval ?? Number.MIN_VALUE),
    );
    const getIntervalName = (interval: LeapDayCondition) => {
        const name = [`${interval.interval}`];
        if (interval.exclusive) {
            name.push("(Exclusive)");
        }
        if (interval.ignore) {
            name.push(" - Ignoring offset");
        }
        return name.join(" ");
    };
    const edit = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(EDIT);
    };
    const trash = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon(TRASH);
    };

    const cancel = (node: HTMLElement) => {
        new ButtonComponent(node).setButtonText("Cancel").setCta();
    };
</script>

<div class="calendarium-nested-settings">
    <TextComponent
        name={"Name"}
        desc={""}
        value={leapDay.name ?? ""}
        warn={!leapDay.name}
        on:blur={(evt) => (leapDay.name = evt.detail)}
    />
    <SettingItem>
        <div slot="name">Month</div>
        <div slot="desc">The leap day will be added to this month.</div>
        <div slot="control">
            <select class="dropdown" bind:value={leapDay.timespan}>
                {#each months as month, index}
                    <option value={index} selected={index == leapDay.timespan}>
                        {month.name ?? ""}
                    </option>
                {/each}
            </select>
        </div>
    </SettingItem>

    <ToggleComponent
        name="Intercalary"
        value={leapDay.intercalary}
        desc="Intercalary days interrupt the normal flow of the month."
        on:click={(evt) => (leapDay.intercalary = !leapDay.intercalary)}
    />

    {#if ic}
        <div class="setting-item intercalary-settings">
            <div class="numbered intercalary-field">
                <input
                    id="numbered"
                    type="checkbox"
                    checked={leapDay.numbered}
                    on:change={() => (leapDay.numbered = !leapDay.numbered)}
                />
                <label for="numbered">Numbered</label>
            </div>
            <div class="after intercalary-field">
                <label for="after">After</label>
                <select class="dropdown" bind:value={leapDay.after}>
                    <option selected={leapDay.after == 0} value="0"
                        >Before 1</option
                    >
                    {#each days as day}
                        <option selected={leapDay.after == day}>{day}</option>
                    {/each}
                </select>
            </div>
        </div>
    {/if}
</div>

<Details
    name="Conditions"
    open={true}
    warn={!leapDay.interval.length}
    label={"At least one condition is required"}
>
    <TextComponent
        type="number"
        name="Offset"
        desc="Offset the year the leap day is applied to."
        value={`${leapDay.offset}`}
        on:blur={(evt) => (leapDay.offset = Number(evt.detail))}
    />
    <SettingItem>
        <div slot="desc">
            {getIntervalDescription(leapDay)}
        </div>
    </SettingItem>
    {#each intervals as interval}
        <SettingItem>
            <div slot="name">{getIntervalName(interval)}</div>

            <div slot="control" class="setting-item-control">
                <div use:edit on:click={() => add(interval)} />
                <div
                    use:trash
                    on:click={() =>
                        (leapDay.interval = leapDay.interval.filter(
                            (i) => i != interval,
                        ))}
                />
            </div>
        </SettingItem>
    {/each}

    <AddNew isInput={false} on:add={() => add()} />
</Details>
<div class="buttons">
    <div use:cancel on:click={() => dispatch("cancel")} />
</div>

<style>
    .intercalary-settings {
        display: flex;
        justify-content: space-around;
    }

    .buttons {
        display: flex;
        justify-content: flex-end;
    }
</style>
