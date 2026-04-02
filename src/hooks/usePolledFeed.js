import { useState, useEffect, useCallback, useRef } from "react";

export function usePolledFeed({ fetchFn, interval, enabled = true }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const doFetch = useCallback(async (initial) => {
    if (initial) setLoading(true);
    try {
      const result = await fetchRef.current();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || "Fetch failed");
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  // Re-run when fetchFn identity changes (e.g. new lat/lon)
  useEffect(() => {
    if (!enabled) return;
    doFetch(true);
    const id = setInterval(() => doFetch(false), interval);
    return () => clearInterval(id);
  }, [enabled, interval, doFetch, fetchFn]);

  const stale = lastUpdated ? Date.now() - lastUpdated.getTime() > interval * 2 : false;

  const refresh = useCallback(() => doFetch(false), [doFetch]);

  return { data, error, loading, lastUpdated, stale, refresh };
}
