<script lang="ts">
    import WeekdayContainer from "./weekday/WeekdayContainer.svelte";
    import MonthContainer from "./months/MonthContainer.svelte";
    import CurrentDate from "./current/CurrentDate.svelte";
    import LeapDayContainer from "./leapdays/LeapDayContainer.svelte";
    import YearContainer from "./years/YearContainer.svelte";
    import DayCallback from "./day-callback/DayCallback.svelte";
</script>

<CurrentDate />
<WeekdayContainer />
<MonthContainer />
<LeapDayContainer />
<YearContainer />
<DayCallback />
