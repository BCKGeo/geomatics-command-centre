// Quick lookup index. Built from the data modules the site already ships
// (nothing is copied), plus the news wire and municipal portals, which the
// Lookup component loads when it opens. Pure functions, tested in search.test.js.
import { NAV, EXTRA_PAGES, FLIGHT_OPS_TABS, JURISDICTION_TABS } from "../data/nav.js";
import { SURVEY_TOOLS } from "../data/surveyTools.js";
import { GIS_TABS, CRS_CHEAT, GDAL_CMDS } from "../data/gis.js";
import { GLOSSARY } from "../data/glossary.js";
import { PROVINCES } from "../data/jurisdictions/index.js";
import { SECTIONS } from "../data/sections.js";

// Display order of groups when scores tie. Lower comes first.
export const KINDS = [
  { id: "page", label: "Pages" },
  { id: "tool", label: "Survey Tools" },
  { id: "jurisdiction", label: "Jurisdictions" },
  { id: "term", label: "Codex" },
  { id: "crs", label: "CRS" },
  { id: "gdal", label: "GDAL" },
  { id: "portal", label: "Municipal portals" },
  { id: "provlink", label: "Provincial resources" },
  { id: "link", label: "Resources" },
  { id: "news", label: "News wire" },
];
const KIND_RANK = Object.fromEntries(KINDS.map((k, i) => [k.id, i]));

// Lowercase, strip accents (Québec matches quebec), collapse whitespace.
export function normalize(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function entry(kind, title, context, target, keywords = "") {
  return {
    kind, title, context,
    ...target, // { to } for a route (with optional hash) or { href } for an external link
    _t: normalize(title),
    _c: normalize(`${context} ${keywords}`),
  };
}

function pageLabel(path) {
  return NAV.find((n) => n.path === path)?.label || path;
}

// Static part of the index: everything that ships in the JS bundle.
export function buildStaticIndex() {
  const out = [];

  for (const n of NAV) out.push(entry("page", n.label, n.d, { to: n.path }, n.k));
  for (const p of EXTRA_PAGES) out.push(entry("page", p.label, p.d, { to: p.path }, p.k));

  const tabs = [
    ...FLIGHT_OPS_TABS.map(([id, label]) => ["/flight-ops", id, label]),
    ...GIS_TABS.map(([id, label]) => ["/gis", id, label]),
    ...JURISDICTION_TABS.map((t) => ["/jurisdictions", t.id, t.label]),
  ];
  for (const [path, id, label] of tabs) {
    out.push(entry("page", `${pageLabel(path)}: ${label}`, `Tab on ${pageLabel(path)}`, { to: `${path}#${id}` }));
  }

  for (const t of SURVEY_TOOLS) out.push(entry("tool", t.label, t.d, { to: `/survey-tools#${t.id}` }, t.k));

  for (const p of PROVINCES) {
    const n = p.categories.reduce((a, c) => a + c.links.length, 0);
    out.push(entry("jurisdiction", p.name, `${p.abbr}: ${n} links in ${p.categories.length} categories`, { to: `/jurisdictions#${p.id}` }, p.abbr));
    for (const c of p.categories) {
      for (const l of c.links) out.push(entry("provlink", l.n, `${p.abbr} ${c.category}: ${l.d || ""}`, { href: l.u }, p.name));
    }
  }

  for (const [section, terms] of Object.entries(GLOSSARY)) {
    for (const t of terms) out.push(entry("term", t.dt, t.dd, { to: `/codex#${encodeURIComponent(t.dt)}` }, section));
  }

  for (const c of CRS_CHEAT) out.push(entry("crs", `EPSG:${c.epsg} ${c.name}`, c.use, { to: "/gis#crs" }, c.epsg));
  for (const g of GDAL_CMDS) out.push(entry("gdal", g.cmd, g.desc, { to: "/gis#gdal" }));

  for (const s of SECTIONS) {
    for (const l of s.links) out.push(entry("link", l.n, `${s.title}: ${l.d}`, { href: l.u }));
  }

  return out;
}

// News wire items, from the feeds.json shape documented in hooks/useFeeds.js.
export function buildNewsIndex(feeds) {
  if (!feeds || !Array.isArray(feeds.sources)) return [];
  const out = [];
  for (const s of feeds.sources) {
    for (const it of s.items || []) {
      if (!it.title || !it.link) continue;
      const when = it.date ? new Date(it.date).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "undated";
      out.push(entry("news", it.title, `${s.short} · ${when}: ${it.summary || ""}`, { href: it.link }, s.name));
    }
  }
  return out;
}

// Municipalities with an open data portal (the map's tier-1 cities and the
// regional districts that publish one). Everything else on the map is not a
// portal and stays out of the lookup.
export function buildPortalIndex(municipalities) {
  if (!Array.isArray(municipalities)) return [];
  const out = [];
  const add = (m, province) => {
    if (!m.portalUrl) return;
    out.push(entry("portal", m.name, `${m.entityType || "Municipality"}, ${province}: open data portal`, { href: m.portalUrl }, province));
  };
  for (const m of municipalities) {
    add(m, m.province);
    for (const r of m.related || []) add(r, m.province);
  }
  return out;
}

// Score one entry against query tokens. Every token must match the title or
// context; title matches outrank context matches and prefixes outrank
// substrings. 0 means no match.
export function scoreEntry(e, tokens) {
  let total = 0;
  for (const tok of tokens) {
    let s = 0;
    if (e._t === tok) s = 100;
    else if (e._t.startsWith(tok)) s = 80;
    else if (e._t.includes(` ${tok}`)) s = 60;
    else if (e._t.includes(tok)) s = 40;
    else if (e._c.startsWith(tok) || e._c.includes(` ${tok}`)) s = 25;
    else if (e._c.includes(tok)) s = 15;
    if (s === 0) return 0;
    total += s;
  }
  return total;
}

export function search(index, query, { perKind = 6, limit = 40 } = {}) {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(" ");
  const hits = [];
  for (const e of index) {
    const score = scoreEntry(e, tokens);
    if (score > 0) hits.push({ ...e, score });
  }
  hits.sort((a, b) => b.score - a.score || KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.title.localeCompare(b.title));
  const perKindCount = {};
  const out = [];
  for (const h of hits) {
    perKindCount[h.kind] = (perKindCount[h.kind] || 0) + 1;
    if (perKindCount[h.kind] > perKind) continue;
    out.push(h);
    if (out.length >= limit) break;
  }
  return out;
}

// Group ranked results by kind. Groups are ordered by their best hit so the
// most relevant kind is on top; within a group, order is by score.
export function groupResults(results) {
  const groups = new Map();
  for (const r of results) {
    if (!groups.has(r.kind)) groups.set(r.kind, { kind: r.kind, label: KINDS.find((k) => k.id === r.kind)?.label || r.kind, best: r.score, items: [] });
    groups.get(r.kind).items.push(r);
  }
  return [...groups.values()].sort((a, b) => b.best - a.best || KIND_RANK[a.kind] - KIND_RANK[b.kind]);
}
