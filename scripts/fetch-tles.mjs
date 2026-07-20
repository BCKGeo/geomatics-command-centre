#!/usr/bin/env node
// Pre-fetch GNSS TLE data from Celestrak at build time.
// Runs outside Cloudflare Workers (where celestrak.org rejects egress),
// produces public/tles.json which the dashboard reads directly.
//
// Celestrak fails intermittently, so fetches retry with backoff. If the
// network still fails, the committed snapshot scripts/tles-fallback.json
// ships instead (stale but functional) so the Pages build never dies here.
//
// Run via `npm run fetch-tles`, or automatically via prebuild/predev hooks.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTleFile, DEFAULT_GROUPS } from "./lib/tle-fetch.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "..", "public", "tles.json");
const FALLBACK_PATH = resolve(__dirname, "tles-fallback.json");

async function main() {
  const start = Date.now();
  console.log(`Fetching TLEs for ${DEFAULT_GROUPS.join(", ")}...`);

  const result = await buildTleFile({ outPath: OUT_PATH, fallbackPath: FALLBACK_PATH });

  if (result.source !== "fresh") {
    console.warn(
      `WARNING: Celestrak unreachable for ${result.failedGroups.join(", ")}; ` +
        `stale fallback used for ${result.staleGroups.join(", ") || "none"}. ` +
        "Satellite positions may be degraded until the next successful build."
    );
  }
  console.log(
    `Wrote ${OUT_PATH} (${result.count} entries, source=${result.source}) in ${Date.now() - start}ms`
  );
}

main().catch((err) => {
  console.error("fetch-tles failed:", err.message);
  process.exit(1);
});
