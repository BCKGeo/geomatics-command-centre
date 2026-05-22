import { useState, useEffect, useRef } from "react";
import { propagateAll, countByConstellation, computePDOP } from "../lib/satellites.js";

const TLES_URL = `${import.meta.env.BASE_URL}tles.json`;
const PROP_INTERVAL = 30000; // 30 seconds

export function useSatellites(lat, lon) {
  const enabled = lat != null && lon != null;
  const [tles, setTles] = useState(null);
  const [tleError, setTleError] = useState(null);
  const [tleLastUpdated, setTleLastUpdated] = useState(null);
  const [satellites, setSatellites] = useState(null);
  const tleRef = useRef(null);

  // TLEs are pre-fetched at build time by scripts/fetch-tles.mjs and served
  // as a static asset, so this is a one-shot fetch on mount.
  useEffect(() => {
    let cancelled = false;
    fetch(TLES_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const filtered = data.filter((d) => d.MEAN_MOTION && d.OBJECT_NAME);
        setTles(filtered);
        setTleError(null);
        setTleLastUpdated(new Date());
      })
      .catch((e) => {
        if (!cancelled) setTleError(e.message || "Fetch failed");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { tleRef.current = tles; }, [tles]);

  useEffect(() => {
    if (!enabled || !tles || tles.length === 0) return;

    const doProp = () => {
      const cur = tleRef.current;
      if (!cur || cur.length === 0) return;
      const visible = propagateAll(cur, lat, lon, new Date());
      const count = countByConstellation(visible);
      const pdop = computePDOP(visible);
      setSatellites({ visible, count, pdop });
    };

    doProp();
    const id = setInterval(doProp, PROP_INTERVAL);
    return () => clearInterval(id);
  }, [enabled, tles, lat, lon]);

  return {
    satellites,
    tleError,
    tleLastUpdated,
    tleAvailable: tles !== null && tleError === null,
  };
}
