export interface ImportedCalendar {
    name: string;
    static_data: {
        year_data: {
            first_day: number;
            overflow: boolean;
            global_week: string[];
            timespans: ImportedMonth[];
            leap_days: ImportedLeapDay[];
        };
        moons: ImportedMoon[];
        clock: Record<any, any>;
        seasons: Seasons;
        eras: any[];
    };
    dynamic_data: {
        year: number;
        timespan: number;
        day: number;
        epoch: number;
        custom_location: boolean;
        location: string;
        current_era: number;
        hour: number;
        minute: number;
    };
    events: ImportedEvent[];
    categories: ImportedCategory[];
}

interface ImportedMonth {
    name: string;
    type: "month" | "intercalary";
    length: number;
    interval: number;
    offset: number;
}

interface ImportedLeapDay {
    name: string;
    intercalary: boolean;
    timespan: number;
    adds_week_day: boolean;
    day: number;
    week_day: string;
    interval: string;
    offset: number;
    not_numbered: boolean;
    show_text: boolean;
}

interface ImportedMoon {
    name: string;
    cycle: number;
    shift: number;
    granularity: number;
    color: string;
    shadow_color?: string;
    hidden: boolean;
}

interface ImportedEvent {
    id: number;
    name: string;
    data: {
        has_duration: boolean;
        duration: number;
        show_first_last: boolean;
        limited_repeat: boolean;
        limited_repeat_num: number;
        conditions: ImportedEventCondition;
        connected_events: [];
        date: number[];
    };
    description: string;
    event_category_id: string;
    calendar_id: string;
    settings: {
        color: string;
        text: string;
        hide: boolean;
        hide_full: boolean;
        print: boolean;
    };
    created_at: string;
    updated_at: string;
    sort_by: number;
    creator_id: number;
}
interface ImportedEventCondition {
    [n: number]: string[] | ImportedEventCondition;
}

interface ImportedCategory {
    id: number;
    name: string;
    calendar_id: string;
    category_settings: {
        hide: boolean;
        player_usable: boolean;
    };
    event_settings: {
        color: string;
        text: string;
        hide: boolean;
        print: boolean;
    };
    created_at: string;
    updated_at: string;
    sort_by: number;
}

interface Seasons {
    data: SeasonData[];
    locations: any[]; // Adjust this based on the specific structure of "locations" if needed
    global_settings: GlobalSettings;
}

interface SeasonData {
    name: string;
    time: {
        sunrise: Time;
        sunset: Time;
    };
    transition_length: number;
    duration: number;
    color: [string, string];
    gradient: Gradient;
    length: number;
    duration?: number;
    start: number;
    end: number;
    timespan: number;
    day: number;
}

interface Time {
    hour: number;
    minute: number;
}

interface Gradient {
    start: [number, number, number];
    end: [number, number, number];
}

interface GlobalSettings {
    season_offset: number;
    weather_offset: number;
    seed: number;
    temp_sys: "metric" | "imperial";
    wind_sys: "metric" | "imperial";
    cinematic: boolean;
    enable_weather: boolean;
    periodic_seasons: boolean;
    color_enabled: boolean;
    preset_order?: number[];
}
