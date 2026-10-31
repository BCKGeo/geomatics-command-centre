import { useState, useEffect } from "react";

const FEEDS_URL = `${import.meta.env.BASE_URL}feeds.json`;

// News feeds are pre-fetched at build time by scripts/fetch-feeds.mjs and
// served as a static asset (the sources send no CORS headers), so this is a
// one-shot fetch on mount. Shape: { generatedAt, sources: [{ id, name,
// short, tier, home, status, fetchedAt, items: [{ title, link, date, summary }] }] }.
export function loadFeeds() {
  return fetch(FEEDS_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      if (!data || !Array.isArray(data.sources)) throw new Error("bad feeds.json");
      return data;
    });
}

export function useFeeds() {
  const [feeds, setFeeds] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadFeeds()
      .then((data) => {
        if (cancelled) return;
        setFeeds(data);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Fetch failed");
      });
    return () => { cancelled = true; };
  }, []);

  return { feeds, error };
}
