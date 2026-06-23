import { useCallback } from "react";
import { usePolledFeed } from "./usePolledFeed.js";
import { EC_AQHI } from "../data/constants.js";

const INTERVAL = 18e5; // 30 minutes

export function useAQHI(lat, lon) {
  const enabled = lat != null && lon != null;

  const fetchFn = useCallback(async () => {
    // Clamp to valid WGS84 ranges; an out-of-range bbox (near the poles or the
    // antimeridian) makes the EC OGC API return HTTP 500, which we'd swallow to null.
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const minLon = clamp(lon - 0.5, -180, 180), maxLon = clamp(lon + 0.5, -180, 180);
    const minLat = clamp(lat - 0.5, -90, 90), maxLat = clamp(lat + 0.5, -90, 90);
    const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
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
