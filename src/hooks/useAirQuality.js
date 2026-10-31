import { useCallback } from "react";
import { usePolledFeed } from "./usePolledFeed.js";
import { buildAirQualityUrl } from "../data/constants.js";

const INTERVAL = 18e5; // 30 minutes, Open-Meteo air quality is hourly

// Open-Meteo's air quality model (CAMS) for PM2.5, the smoke signal the
// AQHI stations do not cover between cities. Separate endpoint from the
// forecast API, so it is its own poll.
export function useAirQuality(lat, lon, tz) {
  const enabled = lat != null && lon != null;

  const fetchFn = useCallback(async () => {
    const r = await fetch(buildAirQualityUrl(lat, lon, tz));
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const c = data?.current;
    if (!c) return null;
    return { pm25: c.pm2_5 ?? null, pm10: c.pm10 ?? null, time: c.time || "" };
  }, [lat, lon, tz]);

  return usePolledFeed({ fetchFn, interval: INTERVAL, enabled });
}
