import { useCallback, useMemo } from "react";
import { usePolledFeed } from "./usePolledFeed.js";
import { buildWeatherUrl } from "../data/constants.js";

const INTERVAL = 6e5; // 10 minutes

export function useWeather(lat, lon, tz) {
  const enabled = lat != null && lon != null;

  const fetchFn = useCallback(async () => {
    return fetch(buildWeatherUrl(lat, lon, tz)).then(r => r.json());
  }, [lat, lon, tz]);

  return usePolledFeed({ fetchFn, interval: INTERVAL, enabled });
}
