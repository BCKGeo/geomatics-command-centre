// Core news feed fetch logic for scripts/fetch-feeds.mjs.
// Network access is injectable (fetchImpl) so tests run offline.
//
// None of these sources send CORS headers, so the browser cannot read them
// directly. Like the TLE data, feeds are pulled at build time into
// public/feeds.json and the Mission Brief page reads that static file.
// Each source is fetched with retry and a timeout; a source that still
// fails is substituted from the committed snapshot
// (scripts/feeds-fallback.json, keyed by source id) so one dead site never
// discards fresh items from the others and the build always ships.
//
// Two wire formats: RSS 2.0 (most sites) and the Canada.ca news API JSON
// (its Atom output is broken server-side: empty feed, "Invalid date").
// The RSS reader is a small regex parser, enough for title, link, pubDate
// and description on well-formed feeds, so no XML dependency is needed.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const UA = "BCKGeo-Dashboard/1.0 (+https://dashboard.bckgeo.ca)";
const CANADA_NEWS = "https://api.io.canada.ca/io-server/gc/news/en/v2";
const canadaNews = (dept, pick) =>
  `${CANADA_NEWS}?dept=${dept}&sort=publishedDate&orderBy=desc&pick=${pick}&format=json`;

// id: stable key used by the fallback snapshot and the UI filter.
// kind: "rss" or "canada-json".
// tier: A = government or regulator, B = professional body or trade press.
export const DEFAULT_SOURCES = [
  { id: "tc", name: "Transport Canada", short: "TC", kind: "canada-json", tier: "A",
    url: canadaNews("departmentoftransport", 12), home: "https://tc.canada.ca/en/aviation/drone-safety" },
  { id: "nrcan", name: "Natural Resources Canada", short: "NRCan", kind: "canada-json", tier: "A",
    url: canadaNews("naturalresourcescanada", 12), home: "https://natural-resources.canada.ca/" },
  { id: "bcwlrs", name: "BC Gov News, Water, Land and Resource Stewardship", short: "BC WLRS", kind: "rss", tier: "A",
    url: "https://news.gov.bc.ca/ministries/water-land-and-resource-stewardship/feed", home: "https://news.gov.bc.ca/ministries/water-land-and-resource-stewardship" },
  { id: "ltsa", name: "Land Title and Survey Authority of BC", short: "LTSA", kind: "rss", tier: "A",
    url: "https://ltsa.ca/feed", home: "https://ltsa.ca/" },
  { id: "acls", name: "Association of Canada Lands Surveyors", short: "ACLS", kind: "rss", tier: "B",
    url: "https://www.acls-aatc.ca/global/rss.php", home: "https://www.acls-aatc.ca/" },
  { id: "asttbc", name: "ASTTBC", short: "ASTTBC", kind: "rss", tier: "B",
    url: "https://www.asttbc.org/feed", home: "https://www.asttbc.org/" },
  { id: "gogeo", name: "GoGeomatics", short: "GoGeomatics", kind: "rss", tier: "B",
    url: "https://www.gogeomatics.ca/feed", home: "https://gogeomatics.ca/" },
];

export const MAX_ITEMS_PER_SOURCE = 10;
const SUMMARY_CHARS = 220;

const sleep = (ms) =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();

// ---- text helpers ----------------------------------------------------------

const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“", copy: "©", eacute: "é",
};

export function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED_ENTITIES[n.toLowerCase()] ?? m);
}

// Strip CDATA wrappers, tags and entities down to one line of plain text.
export function cleanText(s) {
  if (s == null) return "";
  let t = String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  t = t.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ");
  // Block-level tags become a space so adjacent cells and paragraphs do not
  // run together; inline tags vanish so "world</b>'s" stays one word.
  t = t.replace(/<\/?(p|div|br|li|ul|ol|tr|td|th|table|tbody|thead|h[1-6]|blockquote|section|article)\b[^>]*>/gi, " ");
  t = t.replace(/<[^>]+>/g, "");
  t = decodeEntities(decodeEntities(t)); // feeds often double-encode
  return t.replace(/\s+/g, " ").trim();
}

export function summarize(s, max = SUMMARY_CHARS) {
  const t = cleanText(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.6 ? cut.slice(0, at) : cut) + "…";
}

export function toIsoDate(s) {
  if (!s) return null;
  const ms = Date.parse(String(s).trim());
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

// ---- parsers ---------------------------------------------------------------

function firstTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1] : null;
}

export function parseRss(xml) {
  const items = [];
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const body = m[1];
    const title = cleanText(firstTag(body, "title"));
    const link = cleanText(firstTag(body, "link")) || cleanText(firstTag(body, "guid"));
    if (!title || !/^https?:\/\//.test(link)) continue;
    const date = toIsoDate(cleanText(firstTag(body, "pubDate") ?? firstTag(body, "dc:date")));
    // Some feeds (LTSA) ship an empty description and the body in content:encoded.
    const summary =
      summarize(firstTag(body, "description") ?? "") || summarize(firstTag(body, "content:encoded") ?? "");
    items.push({ title, link, date, summary });
  }
  return items;
}

export function parseCanadaJson(data) {
  const entries = data?.feed?.entry;
  if (!Array.isArray(entries)) throw new Error("unexpected Canada.ca news JSON shape");
  return entries
    .map((e) => ({
      title: cleanText(e.title),
      link: String(e.link ?? ""),
      date: toIsoDate(e.publishedDate),
      summary: summarize(e.teaser ?? ""),
    }))
    .filter((e) => e.title && /^https?:\/\//.test(e.link));
}

// ---- fetching --------------------------------------------------------------

export async function fetchSource(
  source,
  { fetchImpl = fetch, attempts = 3, backoffMs = 2000, timeoutMs = 30000, log = console.log } = {}
) {
  const accept =
    source.kind === "canada-json" ? "application/json" : "application/rss+xml, application/xml, text/xml";
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetchImpl(source.url, {
        headers: { "User-Agent": UA, Accept: accept },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`${source.id}: HTTP ${res.status}`);
      const items =
        source.kind === "canada-json" ? parseCanadaJson(await res.json()) : parseRss(await res.text());
      if (items.length === 0) throw new Error(`${source.id}: no items parsed`);
      return dedupe(items).slice(0, MAX_ITEMS_PER_SOURCE);
    } catch (err) {
      lastErr = err;
      if (attempt < attempts) {
        log(`${source.id}: attempt ${attempt}/${attempts} failed (${err.message}), retrying...`);
        await sleep(backoffMs * attempt);
      }
    }
  }
  throw lastErr;
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((it) => {
    if (seen.has(it.link)) return false;
    seen.add(it.link);
    return true;
  });
}

// Snapshot keyed by source id, null if absent, throws if unusable.
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
    throw new Error(`fallback snapshot at ${fallbackPath} must be an object keyed by source id`);
  }
  return data;
}

export async function buildFeedFile({
  sources = DEFAULT_SOURCES,
  outPath,
  fallbackPath,
  fetchImpl = fetch,
  attempts = 3,
  backoffMs = 2000,
  timeoutMs = 30000,
  now = () => new Date(),
  log = console.log,
  warn = console.warn,
} = {}) {
  await mkdir(dirname(outPath), { recursive: true });

  const settled = await Promise.allSettled(
    sources.map((s) => fetchSource(s, { fetchImpl, attempts, backoffMs, timeoutMs, log }))
  );
  const failedSources = sources.filter((_, i) => settled[i].status === "rejected").map((s) => s.id);

  let fallback = null;
  if (failedSources.length > 0) {
    const reasons = settled
      .filter((s) => s.status === "rejected")
      .map((s) => s.reason?.message ?? String(s.reason))
      .join("; ");
    warn(`feed fetch failed for ${failedSources.join(", ")} (${reasons}); trying fallback snapshot`);
    fallback = await readFallback(fallbackPath);
  }

  const out = [];
  const staleSources = [];
  let freshCount = 0;
  sources.forEach((s, i) => {
    const base = { id: s.id, name: s.name, short: s.short, tier: s.tier, home: s.home };
    if (settled[i].status === "fulfilled") {
      out.push({ ...base, status: "fresh", fetchedAt: now().toISOString(), items: settled[i].value });
      freshCount++;
    } else if (Array.isArray(fallback?.[s.id]?.items) && fallback[s.id].items.length > 0) {
      out.push({
        ...base,
        status: "stale",
        fetchedAt: fallback[s.id].fetchedAt ?? null,
        items: fallback[s.id].items,
      });
      staleSources.push(s.id);
      warn(`${s.id}: using stale fallback items`);
    } else {
      out.push({ ...base, status: "unavailable", fetchedAt: null, items: [] });
      warn(`${s.id}: no fresh data and no fallback items; source empty`);
    }
  });

  const count = out.reduce((n, s) => n + s.items.length, 0);
  if (count === 0) {
    throw new Error(`feed fetch failed for all sources and no usable fallback at ${fallbackPath}`);
  }

  const file = { generatedAt: now().toISOString(), sources: out };
  await writeFile(outPath, JSON.stringify(file));

  const source = failedSources.length === 0 ? "fresh" : freshCount === 0 ? "fallback" : "partial";
  const counts = out
    .map((s) => `${s.id}=${s.status === "fresh" ? s.items.length : s.status.toUpperCase()}`)
    .join(" ");
  log(`Got ${count} items (${counts})`);

  return { source, count, staleSources, failedSources, file };
}

// Snapshot format: { [id]: { fetchedAt, items } } for every fresh source.
export function toFallbackSnapshot(file) {
  const snap = {};
  for (const s of file.sources) {
    if (s.status === "fresh") snap[s.id] = { fetchedAt: s.fetchedAt, items: s.items };
  }
  return snap;
}
