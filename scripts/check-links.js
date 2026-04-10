#!/usr/bin/env node
/**
 * Link checker for municipalities.js.
 * Tests all portalUrl, councilUrl, and surveyStandards links for HTTP status.
 *
 * Usage:
 *   node scripts/check-links.js                # Check all URLs
 *   node scripts/check-links.js --province BC  # Check one province
 *   node scripts/check-links.js --sample 50    # Random sample of N URLs
 *   node scripts/check-links.js --timeout 10   # Custom timeout in seconds
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = process.argv.slice(2);
const provinceFilter = args.includes("--province") ? args[args.indexOf("--province") + 1] : null;
const sampleSize = args.includes("--sample") ? parseInt(args[args.indexOf("--sample") + 1]) : null;
const timeoutSec = args.includes("--timeout") ? parseInt(args[args.indexOf("--timeout") + 1]) : 8;
const CONCURRENCY = 10;
const DELAY_MS = 200;

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-CA,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
};

async function tryFetch(url, method, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout * 1000);
  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      redirect: "follow",
      headers: BROWSER_HEADERS,
    });
    clearTimeout(timer);
    return { status: res.status, ok: res.ok };
  } catch (err) {
    clearTimeout(timer);
    return { status: 0, ok: false, error: err.cause?.code || err.message };
  }
}

async function checkUrl(url, timeout) {
  // Try HEAD first
  let res = await tryFetch(url, "HEAD", timeout);
  // If HEAD fails for any reason (network error, 4xx, 5xx), retry with GET
  // Many servers reject HEAD or return 403/405 on HEAD but 200 on GET
  if (!res.ok) {
    const getRes = await tryFetch(url, "GET", timeout);
    if (getRes.ok) res = getRes;
    else if (getRes.status > 0) res = getRes; // Prefer HTTP status over network error
  }
  return { url, ...res };
}

function extractUrls(src, province) {
  const urls = new Set();
  const lines = src.split("\n");
  const urlPattern = /https?:\/\/[^\s"',)]+/g;

  for (const line of lines) {
    if (province && !line.includes(`province: "${province}"`)) continue;
    let match;
    while ((match = urlPattern.exec(line)) !== null) {
      urls.add(match[0]);
    }
  }
  return [...urls];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function runBatch(urls, concurrency) {
  const results = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((u) => checkUrl(u, timeoutSec)));
    results.push(...batchResults);
    const done = Math.min(i + concurrency, urls.length);
    process.stdout.write(`\r  Checked ${done}/${urls.length}`);
    if (i + concurrency < urls.length) await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  process.stdout.write("\n");
  return results;
}

async function main() {
  console.log("BCKGeo Link Checker");
  console.log("===================\n");

  const src = readFileSync(join(ROOT, "src/data/municipalities.js"), "utf-8");
  let urls = extractUrls(src, provinceFilter);

  console.log(`Found ${urls.length} unique URLs` + (provinceFilter ? ` for ${provinceFilter}` : ""));

  if (sampleSize && sampleSize < urls.length) {
    urls = shuffle([...urls]).slice(0, sampleSize);
    console.log(`Random sample: ${urls.length} URLs`);
  }

  console.log(`Timeout: ${timeoutSec}s | Concurrency: ${CONCURRENCY}\n`);

  const results = await runBatch(urls, CONCURRENCY);

  const broken = results.filter((r) => !r.ok);
  const ok = results.filter((r) => r.ok);

  console.log(`\nResults: ${ok.length} OK, ${broken.length} broken\n`);

  if (broken.length > 0) {
    console.log("BROKEN LINKS:");
    console.log("-".repeat(80));
    for (const r of broken) {
      const reason = r.error || `HTTP ${r.status}`;
      console.log(`  [${reason}] ${r.url}`);
    }
    console.log();

    // Group broken by domain
    const byDomain = {};
    for (const r of broken) {
      try {
        const domain = new URL(r.url).hostname;
        byDomain[domain] = (byDomain[domain] || 0) + 1;
      } catch { /* skip malformed */ }
    }
    const sorted = Object.entries(byDomain).sort((a, b) => b[1] - a[1]);
    console.log("BROKEN BY DOMAIN:");
    console.log("-".repeat(40));
    for (const [domain, count] of sorted) {
      console.log(`  ${count.toString().padStart(4)} ${domain}`);
    }
  }

  process.exit(broken.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(2);
});
