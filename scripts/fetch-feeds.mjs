#!/usr/bin/env node
// Pre-fetch geomatics news feeds at build time (Transport Canada, NRCan,
// BC Gov News WLRS, LTSA, ACLS, ASTTBC, GoGeomatics) into public/feeds.json,
// which the Mission Brief page reads directly. The sources send no CORS
// headers, so the browser cannot fetch them itself.
//
// A source that fails after retries is filled from the committed snapshot
// scripts/feeds-fallback.json (stale but functional) so the Pages build
// never dies here. Pass --write-fallback to refresh that snapshot from the
// sources that fetched fresh (commit the result).
//
// Run via `npm run fetch-feeds`, or automatically via prebuild/predev hooks.

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFeedFile, toFallbackSnapshot } from "./lib/feed-fetch.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "..", "public", "feeds.json");
const FALLBACK_PATH = resolve(__dirname, "feeds-fallback.json");

async function main() {
  const start = Date.now();
  const writeFallback = process.argv.includes("--write-fallback");
  console.log("Fetching news feeds...");

  const result = await buildFeedFile({ outPath: OUT_PATH, fallbackPath: FALLBACK_PATH });

  if (result.source !== "fresh") {
    console.warn(
      `WARNING: feed fetch failed for ${result.failedSources.join(", ")}; ` +
        `stale fallback used for ${result.staleSources.join(", ") || "none"}. ` +
        "Those sources will catch up on the next successful build."
    );
  }
  console.log(
    `Wrote ${OUT_PATH} (${result.count} items, source=${result.source}) in ${Date.now() - start}ms`
  );

  if (writeFallback) {
    let existing = {};
    try {
      existing = JSON.parse(await readFile(FALLBACK_PATH, "utf8"));
    } catch {
      // first run, no snapshot yet
    }
    const snap = { ...existing, ...toFallbackSnapshot(result.file) };
    await writeFile(FALLBACK_PATH, JSON.stringify(snap, null, 1) + "\n");
    console.log(`Updated ${FALLBACK_PATH} (${Object.keys(snap).length} sources)`);
  }
}

main().catch((err) => {
  console.error("fetch-feeds failed:", err.message);
  process.exit(1);
});
