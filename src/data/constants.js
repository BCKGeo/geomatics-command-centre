// API endpoints and defaults
export const NOAA_KP = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
export const NOAA_SCALES = "https://services.swpc.noaa.gov/products/noaa-scales.json";
export const NOAA_WIND_SPEED = "https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json";
export const NOAA_WIND_MAG = "https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json";
export const NOAA_XRAY = "https://services.swpc.noaa.gov/products/summary/10cm-flux.json";
export const NOAA_XRAY_FLUX = "https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json";
export const NOAA_ALERTS = "https://services.swpc.noaa.gov/products/alerts.json";
export const EC_AQHI = "https://api.weather.gc.ca/collections/aqhi-observations-realtime/items";
export const DEFAULT_LAT = 45.4215;
export const DEFAULT_LON = -75.6972;
export const DEFAULT_CITY = "Ottawa, ON (default)";
export const DEFAULT_TZ = "America/Toronto";

export function buildWeatherUrl(lat, lon, tz) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,apparent_temperature,precipitation,cloud_cover,surface_pressure&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset,uv_index_max&timezone=${encodeURIComponent(tz)}&forecast_days=7`;
}

export const WMO = {
  0:{i:"☀️",d:"Clear"},1:{i:"🌤️",d:"Mainly Clear"},2:{i:"⛅",d:"Partly Cloudy"},3:{i:"☁️",d:"Overcast"},
  45:{i:"🌫️",d:"Fog"},48:{i:"🌫️",d:"Rime Fog"},51:{i:"🌦️",d:"Lt Drizzle"},53:{i:"🌦️",d:"Drizzle"},
  55:{i:"🌧️",d:"Hvy Drizzle"},56:{i:"🌨️",d:"Lt Frzg Drizzle"},57:{i:"🌨️",d:"Frzg Drizzle"},
  61:{i:"🌧️",d:"Lt Rain"},63:{i:"🌧️",d:"Rain"},65:{i:"🌧️",d:"Hvy Rain"},
  66:{i:"🌨️",d:"Freezing Rain"},67:{i:"🌨️",d:"Hvy Frzg Rain"},71:{i:"❄️",d:"Lt Snow"},73:{i:"❄️",d:"Snow"},
  75:{i:"❄️",d:"Heavy Snow"},77:{i:"❄️",d:"Snow Grains"},80:{i:"🌦️",d:"Rain Showers"},81:{i:"🌧️",d:"Mod Showers"},
  82:{i:"⛈️",d:"Heavy Showers"},85:{i:"🌨️",d:"Snow Showers"},86:{i:"🌨️",d:"Hvy Snow Shwr"},
  95:{i:"⛈️",d:"Thunderstorm"},96:{i:"⛈️",d:"T-Storm Hail"},99:{i:"⛈️",d:"T-Storm Hvy Hail"},
};
