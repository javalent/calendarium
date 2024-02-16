<script lang="ts">
    import WeekdayContainer from "./weekday/WeekdayContainer.svelte";
    import MonthContainer from "./months/MonthContainer.svelte";
    import CurrentDate from "./current/CurrentDate.svelte";
    import LeapDayContainer from "./leapdays/LeapDayContainer.svelte";
    import YearContainer from "./years/YearContainer.svelte";
</script>

<CurrentDate />
<WeekdayContainer />
<MonthContainer />
<LeapDayContainer  />
<YearContainer  />
