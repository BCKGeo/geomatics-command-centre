import { useCallback } from "react";
import { usePolledFeed } from "./usePolledFeed.js";
import { buildWeatherUrl } from "../data/constants.js";

const INTERVAL = 6e5; // 10 minutes

export function useWeather(lat, lon, tz) {
  const enabled = lat != null && lon != null;

  const fetchFn = useCallback(async () => {
    const r = await fetch(buildWeatherUrl(lat, lon, tz));
    // A JSON error body from a 400/500 would otherwise render as NaN values
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }, [lat, lon, tz]);

  return usePolledFeed({ fetchFn, interval: INTERVAL, enabled });
}
