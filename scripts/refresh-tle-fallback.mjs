#!/usr/bin/env node
// Refresh the committed TLE fallback snapshot (scripts/tles-fallback.json).
// Run occasionally so the safety net stays reasonably current, then commit
// the result. The snapshot is keyed by Celestrak group so the build can
// substitute individual constellations when only some fetches fail.

import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchGroup, DEFAULT_GROUPS } from "./lib/tle-fetch.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "tles-fallback.json");

async function main() {
  const byGroup = {};
  for (const group of DEFAULT_GROUPS) {
    byGroup[group] = await fetchGroup(group);
    console.log(`${group}: ${byGroup[group].length} entries`);
  }
  await writeFile(OUT_PATH, JSON.stringify(byGroup));
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("refresh-tle-fallback failed:", err.message);
  process.exit(1);
});
