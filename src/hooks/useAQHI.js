import { useCallback } from "react";
import { usePolledFeed } from "./usePolledFeed.js";
import { EC_AQHI } from "../data/constants.js";

const INTERVAL = 18e5; // 30 minutes

export function useAQHI(lat, lon) {
  const enabled = lat != null && lon != null;

  const fetchFn = useCallback(async () => {
    const bbox = `${lon - 0.5},${lat - 0.5},${lon + 0.5},${lat + 0.5}`;
    const url = `${EC_AQHI}?f=json&limit=1&sortby=-observation_datetime&bbox=${bbox}`;
    const data = await fetch(url).then(r => r.json());
    const f = data?.features?.[0];
    if (!f) return null;
    return {
      aqhi: f.properties?.aqhi ?? null,
      station: f.properties?.location_name_en || "Unknown",
      datetime: f.properties?.observation_datetime || "",
    };
  }, [lat, lon]);

  return usePolledFeed({ fetchFn, interval: INTERVAL, enabled });
}
