// Core TLE fetch logic for scripts/fetch-tles.mjs.
// Network access is injectable (fetchImpl) so tests run offline.
//
// Celestrak drops connections and rate-limits intermittently, which used to
// kill the daily Cloudflare Pages build. Strategy: retry each group with
// backoff and a per-request timeout; if a group still fails, fall back to the
// committed snapshot (scripts/tles-fallback.json) so the build always ships.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const UA = "BCKGeo-Dashboard/1.0 (+https://dashboard.bckgeo.ca)";

export const DEFAULT_GROUPS = ["gps-ops", "glo-ops", "galileo", "beidou"];

const sleep = (ms) =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

export async function fetchGroup(
  group,
  {
    fetchImpl = fetch,
    attempts = 3,
    backoffMs = 2000,
    timeoutMs = 30000,
    log = console.log,
  } = {}
) {
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=json`;
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetchImpl(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`${group}: HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`${group}: empty response`);
      }
      return data;
    } catch (err) {
      lastErr = err;
      if (attempt < attempts) {
        log(`${group}: attempt ${attempt}/${attempts} failed (${err.message}), retrying...`);
        await sleep(backoffMs * attempt);
      }
    }
  }
  throw lastErr;
}

export async function buildTleFile({
  groups = DEFAULT_GROUPS,
  outPath,
  fallbackPath,
  fetchImpl = fetch,
  attempts = 3,
  backoffMs = 2000,
  timeoutMs = 30000,
  log = console.log,
  warn = console.warn,
} = {}) {
  await mkdir(dirname(outPath), { recursive: true });

  try {
    const results = await Promise.all(
      groups.map((g) => fetchGroup(g, { fetchImpl, attempts, backoffMs, timeoutMs, log }))
    );
    const merged = results.flat();
    const counts = groups.map((g, i) => `${g}=${results[i].length}`).join(" ");
    log(`Got ${merged.length} entries (${counts})`);
    await writeFile(outPath, JSON.stringify(merged));
    return { source: "fresh", count: merged.length };
  } catch (err) {
    warn(`TLE fetch failed (${err.message}); trying fallback snapshot`);
    let raw;
    try {
      raw = await readFile(fallbackPath, "utf8");
    } catch {
      throw new Error(
        `TLE fetch failed (${err.message}) and no fallback snapshot at ${fallbackPath}`
      );
    }
    const fallback = JSON.parse(raw);
    if (!Array.isArray(fallback) || fallback.length === 0) {
      throw new Error(`fallback snapshot at ${fallbackPath} is empty or invalid`);
    }
    await writeFile(outPath, JSON.stringify(fallback));
    return { source: "fallback", count: fallback.length };
  }
}
