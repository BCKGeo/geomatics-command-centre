// Core TLE fetch logic for scripts/fetch-tles.mjs.
// Network access is injectable (fetchImpl) so tests run offline.
//
// Celestrak drops connections and rate-limits intermittently, which used to
// kill the daily Cloudflare Pages build. Strategy: retry each group with
// backoff and a per-request timeout; groups that still fail are substituted
// individually from the committed snapshot (scripts/tles-fallback.json,
// keyed by group) so one flaky constellation never discards fresh data for
// the others and the build always ships.

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

// Returns the snapshot object keyed by group, null if the file is absent,
// and throws (descriptively) if the file exists but is unusable.
async function readFallback(fallbackPath) {
  let raw;
  try {
    raw = await readFile(fallbackPath, "utf8");
  } catch {
    return null;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`fallback snapshot at ${fallbackPath} is not valid JSON: ${err.message}`);
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`fallback snapshot at ${fallbackPath} must be an object keyed by group`);
  }
  return data;
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

  const settled = await Promise.allSettled(
    groups.map((g) => fetchGroup(g, { fetchImpl, attempts, backoffMs, timeoutMs, log }))
  );
  const failedGroups = groups.filter((_, i) => settled[i].status === "rejected");

  let fallback = null;
  if (failedGroups.length > 0) {
    const reasons = settled
      .filter((s) => s.status === "rejected")
      .map((s) => s.reason?.message ?? String(s.reason))
      .join("; ");
    warn(`TLE fetch failed for ${failedGroups.join(", ")} (${reasons}); trying fallback snapshot`);
    fallback = await readFallback(fallbackPath);
  }

  const merged = [];
  const staleGroups = [];
  let freshCount = 0;
  groups.forEach((g, i) => {
    if (settled[i].status === "fulfilled") {
      merged.push(...settled[i].value);
      freshCount++;
    } else if (Array.isArray(fallback?.[g]) && fallback[g].length > 0) {
      merged.push(...fallback[g]);
      staleGroups.push(g);
      warn(`${g}: using stale fallback entries`);
    } else {
      warn(`${g}: no fresh data and no fallback entries; group omitted`);
    }
  });

  if (merged.length === 0) {
    throw new Error(`TLE fetch failed for all groups and no usable fallback at ${fallbackPath}`);
  }

  await writeFile(outPath, JSON.stringify(merged));

  const source =
    failedGroups.length === 0 ? "fresh" : freshCount === 0 ? "fallback" : "partial";
  const counts = groups
    .map((g, i) =>
      settled[i].status === "fulfilled" ? `${g}=${settled[i].value.length}` : `${g}=FAILED`
    )
    .join(" ");
  log(`Got ${merged.length} entries (${counts})`);

  return { source, count: merged.length, staleGroups, failedGroups };
}
