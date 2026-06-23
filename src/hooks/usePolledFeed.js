import { useState, useEffect, useRef } from "react";

export function usePolledFeed({ fetchFn, interval, enabled = true }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  // Re-run when fetchFn identity changes (e.g. new lat/lon). A `cancelled` flag
  // scoped to each effect run stops a slow in-flight fetch for the OLD inputs
  // from resolving after a newer one and overwriting state with stale data
  // (last-write-wins race), and avoids state updates after unmount.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const doFetch = async (initial) => {
      if (initial) setLoading(true);
      try {
        const result = await fetchRef.current();
        if (cancelled) return;
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      } catch (e) {
        if (cancelled) return;
        setError(e.message || "Fetch failed");
      } finally {
        if (!cancelled && initial) setLoading(false);
      }
    };

    doFetch(true);
    const id = setInterval(() => doFetch(false), interval);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, interval, fetchFn]);

  return { data, error, loading, lastUpdated };
}
