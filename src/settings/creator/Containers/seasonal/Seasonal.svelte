<script>
    import SeasonContainer from "./seasons/SeasonContainer.svelte";
    import SettingItem from "../../Settings/SettingItem.svelte";
    import WeatherContainer from "./weather/WeatherContainer.svelte";
</script>

<SettingItem>
    <div slot="desc">
        <p>
            The Seasonal tab is used to control your calendar's seasons and
            weather patterns.
        </p>
        <p>
            At least one season is required to enable weather. Once weather is
            enabled, you can start fine-tuning the weather generation model
            here.
        </p>
    </div>
</SettingItem>

<SeasonContainer></SeasonContainer>
<WeatherContainer></WeatherContainer>
