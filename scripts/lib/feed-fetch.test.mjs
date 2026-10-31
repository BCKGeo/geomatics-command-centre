// Tests for the feed fetch core used by scripts/fetch-feeds.mjs.
// All network access is injected via fetchImpl; no real requests.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  cleanText,
  summarize,
  toIsoDate,
  parseRss,
  parseCanadaJson,
  fetchSource,
  buildFeedFile,
  toFallbackSnapshot,
} from "./feed-fetch.mjs";

const noLog = () => {};
const rssSource = { id: "ltsa", name: "LTSA", short: "LTSA", kind: "rss", tier: "A", url: "https://x/feed", home: "https://x/" };
const jsonSource = { id: "tc", name: "Transport Canada", short: "TC", kind: "canada-json", tier: "A", url: "https://y/", home: "https://y/" };

const rss = (items) => `<?xml version="1.0"?><rss version="2.0"><channel><title>Chan</title><link>https://x/</link>${items}</channel></rss>`;
const item = (title, link, date, desc = "") =>
  `<item><title>${title}</title><link>${link}</link><pubDate>${date}</pubDate><description>${desc}</description></item>`;

const textResponse = (body) => ({ ok: true, text: async () => body });
const jsonResponse = (data) => ({ ok: true, json: async () => data });

describe("text helpers", () => {
  it("cleanText strips CDATA, tags and entities", () => {
    expect(cleanText("<![CDATA[<p>Hello &amp;amp; <b>world</b>&#8217;s</p>]]>")).toBe("Hello & world’s");
  });
  it("summarize truncates on a word boundary", () => {
    const s = summarize("one two three four five six seven", 14);
    expect(s).toBe("one two three…");
  });
  it("toIsoDate handles RFC 822 and ISO, rejects junk", () => {
    expect(toIsoDate("Thu, 29 Oct 2026 19:35:42 +0000")).toBe("2026-10-29T19:35:42.000Z");
    expect(toIsoDate("2026-10-30T15:49:47-04:00")).toBe("2026-10-30T19:49:47.000Z");
    expect(toIsoDate("Invalid date")).toBeNull();
    expect(toIsoDate("")).toBeNull();
  });
});

describe("parseRss", () => {
  it("reads title, link, date and plain-text summary", () => {
    const xml = rss(
      item("<![CDATA[Form 17 &#8211; v3.18]]>", "https://x/a", "Thu, 29 Oct 2026 19:35:42 +0000", "<![CDATA[<table><tr><td>Big <b>news</b></td></tr></table>]]>")
    );
    const items = parseRss(xml);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      title: "Form 17 – v3.18",
      link: "https://x/a",
      date: "2026-10-29T19:35:42.000Z",
      summary: "Big news",
    });
  });
  it("skips items without an http link and tolerates missing dates", () => {
    const xml = rss(
      "<item><title>No link</title></item>" +
        "<item><title>Guid only</title><guid isPermaLink=\"true\">https://x/g</guid></item>"
    );
    const items = parseRss(xml);
    expect(items).toHaveLength(1);
    expect(items[0].link).toBe("https://x/g");
    expect(items[0].date).toBeNull();
  });
});

describe("parseCanadaJson", () => {
  it("maps entries and drops junk", () => {
    const items = parseCanadaJson({
      feed: { entry: [
        { title: "A &amp; B", link: "https://canada.ca/a", teaser: "Teaser ", publishedDate: "2026-10-30T15:49:47-04:00" },
        { title: "", link: "https://canada.ca/b" },
      ] },
    });
    expect(items).toEqual([
      { title: "A & B", link: "https://canada.ca/a", date: "2026-10-30T19:49:47.000Z", summary: "Teaser" },
    ]);
  });
  it("throws on an unexpected shape", () => {
    expect(() => parseCanadaJson({ nope: 1 })).toThrow(/shape/);
  });
});

describe("fetchSource", () => {
  it("retries transient failures and caps items per source", async () => {
    let calls = 0;
    const many = Array.from({ length: 15 }, (_, i) => item(`T${i}`, `https://x/${i}`, "Mon, 01 Jan 2026 00:00:00 GMT")).join("");
    const fetchImpl = async () => {
      calls++;
      if (calls < 2) throw new Error("fetch failed");
      return textResponse(rss(many));
    };
    const items = await fetchSource(rssSource, { fetchImpl, attempts: 3, backoffMs: 0, log: noLog });
    expect(calls).toBe(2);
    expect(items).toHaveLength(10);
  });
  it("dedupes by link", async () => {
    const fetchImpl = async () => textResponse(rss(item("A", "https://x/a", "") + item("A again", "https://x/a", "")));
    const items = await fetchSource(rssSource, { fetchImpl, backoffMs: 0, log: noLog });
    expect(items).toHaveLength(1);
  });
  it("treats an empty feed as a failure", async () => {
    const fetchImpl = async () => textResponse(rss(""));
    await expect(fetchSource(rssSource, { fetchImpl, attempts: 1, backoffMs: 0, log: noLog })).rejects.toThrow(/no items/);
  });
  it("treats HTTP errors as failures", async () => {
    const fetchImpl = async () => ({ ok: false, status: 503 });
    await expect(fetchSource(jsonSource, { fetchImpl, attempts: 1, backoffMs: 0, log: noLog })).rejects.toThrow(/503/);
  });
});

describe("buildFeedFile", () => {
  let dir, outPath, fallbackPath;
  const now = () => new Date("2026-10-31T12:00:00Z");
  const opts = () => ({ outPath, fallbackPath, attempts: 1, backoffMs: 0, now, log: noLog, warn: noLog });
  const sources = [rssSource, jsonSource];

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "feeds-"));
    outPath = join(dir, "public", "feeds.json");
    fallbackPath = join(dir, "feeds-fallback.json");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const okFetch = async (url) =>
    url === rssSource.url
      ? textResponse(rss(item("R1", "https://x/r1", "Mon, 01 Jan 2026 00:00:00 GMT")))
      : jsonResponse({ feed: { entry: [{ title: "J1", link: "https://y/j1", publishedDate: "2026-01-02T00:00:00Z" }] } });

  it("writes a fresh file with every source", async () => {
    const result = await buildFeedFile({ sources, fetchImpl: okFetch, ...opts() });
    expect(result.source).toBe("fresh");
    expect(result.count).toBe(2);
    const file = JSON.parse(await readFile(outPath, "utf8"));
    expect(file.generatedAt).toBe("2026-10-31T12:00:00.000Z");
    expect(file.sources.map((s) => [s.id, s.status])).toEqual([["ltsa", "fresh"], ["tc", "fresh"]]);
    expect(file.sources[1].items[0].title).toBe("J1");
  });

  it("substitutes a failed source from the fallback snapshot", async () => {
    await writeFile(fallbackPath, JSON.stringify({ tc: { fetchedAt: "2026-10-01T00:00:00.000Z", items: [{ title: "old", link: "https://y/old", date: null, summary: "" }] } }));
    const fetchImpl = async (url) => (url === jsonSource.url ? Promise.reject(new Error("down")) : okFetch(url));
    const result = await buildFeedFile({ sources, fetchImpl, ...opts() });
    expect(result.source).toBe("partial");
    expect(result.staleSources).toEqual(["tc"]);
    const file = JSON.parse(await readFile(outPath, "utf8"));
    const tc = file.sources.find((s) => s.id === "tc");
    expect(tc.status).toBe("stale");
    expect(tc.fetchedAt).toBe("2026-10-01T00:00:00.000Z");
    expect(tc.items[0].title).toBe("old");
  });

  it("marks a failed source unavailable when the snapshot has nothing for it", async () => {
    const fetchImpl = async (url) => (url === jsonSource.url ? Promise.reject(new Error("down")) : okFetch(url));
    const result = await buildFeedFile({ sources, fetchImpl, ...opts() });
    const file = JSON.parse(await readFile(outPath, "utf8"));
    expect(file.sources.find((s) => s.id === "tc")).toMatchObject({ status: "unavailable", items: [] });
    expect(result.count).toBe(1);
  });

  it("throws when everything fails and there is no fallback", async () => {
    const fetchImpl = async () => Promise.reject(new Error("down"));
    await expect(buildFeedFile({ sources, fetchImpl, ...opts() })).rejects.toThrow(/all sources/);
  });

  it("toFallbackSnapshot keeps only fresh sources", async () => {
    const fetchImpl = async (url) => (url === jsonSource.url ? Promise.reject(new Error("down")) : okFetch(url));
    const { file } = await buildFeedFile({ sources, fetchImpl, ...opts() });
    const snap = toFallbackSnapshot(file);
    expect(Object.keys(snap)).toEqual(["ltsa"]);
    expect(snap.ltsa.items[0].link).toBe("https://x/r1");
  });
});
