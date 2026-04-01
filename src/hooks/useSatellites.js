import { useState, useEffect, useCallback, useRef } from "react";
import { usePolledFeed } from "./usePolledFeed.js";
import { propagateAll, countByConstellation, computePDOP } from "../lib/satellites.js";
import { CELESTRAK_PROXY } from "../data/constants.js";

const TLE_INTERVAL = 216e5; // 6 hours
const PROP_INTERVAL = 30000; // 30 seconds

export function useSatellites(lat, lon) {
  const enabled = lat != null && lon != null;
  const [proxyAvailable, setProxyAvailable] = useState(true);
  const [satellites, setSatellites] = useState(null);
  const tleRef = useRef(null);

  const fetchTLEs = useCallback(async () => {
    const url = `${CELESTRAK_PROXY}?groups=gps-ops,glo-ops,galileo,beidou`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Filter to entries with orbital data (OMM JSON from Celestrak GP API)
    return data.filter((d) => d.MEAN_MOTION && d.OBJECT_NAME);
  }, []);

  const {
    data: tles,
    error: tleError,
    loading: tleLoading,
    lastUpdated: tleLastUpdated,
    stale: tleStale,
  } = usePolledFeed({ fetchFn: fetchTLEs, interval: TLE_INTERVAL, enabled });

  // Detect proxy unavailability
  useEffect(() => {
    if (tleError) setProxyAvailable(false);
    if (tles && tles.length > 0) setProxyAvailable(true);
  }, [tles, tleError]);

  // Store TLEs in ref for propagation interval
  useEffect(() => {
    tleRef.current = tles;
  }, [tles]);

  // Propagate positions every 30s — also re-run when tles arrive
  useEffect(() => {
    if (!enabled || !proxyAvailable || !tles || tles.length === 0) return;

    const doProp = () => {
      const visible = propagateAll(tles, lat, lon, new Date());
      const count = countByConstellation(visible);
      const pdop = computePDOP(visible);
      setSatellites({ visible, count, pdop });
    };

    doProp(); // immediate on TLE arrival
    const id = setInterval(() => {
      const cur = tleRef.current;
      if (!cur || cur.length === 0) return;
      const visible = propagateAll(cur, lat, lon, new Date());
      const count = countByConstellation(visible);
      const pdop = computePDOP(visible);
      setSatellites({ visible, count, pdop });
    }, PROP_INTERVAL);
    return () => clearInterval(id);
  }, [enabled, proxyAvailable, tles, lat, lon]);

  return {
    satellites,
    tleError,
    tleLoading,
    tleLastUpdated,
    tleStale,
    proxyAvailable,
  };
}
