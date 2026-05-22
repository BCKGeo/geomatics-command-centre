#!/usr/bin/env node
// Pre-fetch GNSS TLE data from Celestrak at build time.
// Runs outside Cloudflare Workers (where celestrak.org rejects egress),
// produces public/tles.json which the dashboard reads directly.
//
// Run via `npm run fetch-tles`, or automatically via prebuild/predev hooks.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "..", "public", "tles.json");

const GROUPS = ["gps-ops", "glo-ops", "galileo", "beidou"];
const UA = "BCKGeo-Dashboard/1.0 (+https://dashboard.bckgeo.ca)";

async function fetchGroup(group) {
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=json`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${group}: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error(`${group}: empty response`);
  return data;
}

async function main() {
  const start = Date.now();
  console.log(`Fetching TLEs for ${GROUPS.join(", ")}...`);

  const results = await Promise.all(GROUPS.map(fetchGroup));
  const merged = results.flat();

  const counts = GROUPS.map((g, i) => `${g}=${results[i].length}`).join(" ");
  console.log(`Got ${merged.length} entries (${counts}) in ${Date.now() - start}ms`);

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(merged));
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("fetch-tles failed:", err.message);
  process.exit(1);
});
