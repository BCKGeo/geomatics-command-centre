import { describe, it, expect } from "vitest";
import { buildStaticIndex, buildNewsIndex, buildPortalIndex, search, groupResults, normalize } from "./search.js";
import { NAV, COMMAND_CENTRE_SECTIONS, CAREER_SECTIONS, FLIGHT_OPS_TABS, JURISDICTION_TABS } from "../data/nav.js";
import { PATHWAYS } from "../data/career.js";
import { SURVEY_TOOLS } from "../data/surveyTools.js";
import { GIS_TABS, CRS_CHEAT, GDAL_CMDS } from "../data/gis.js";
import { GLOSSARY } from "../data/glossary.js";
import { PROVINCES } from "../data/jurisdictions/index.js";

const INDEX = buildStaticIndex();
const count = (kind) => INDEX.filter((e) => e.kind === kind).length;
const termCount = Object.values(GLOSSARY).reduce((n, t) => n + t.length, 0);

describe("what is indexed", () => {
  it("every nav page, the terms page, and every tab on the tabbed pages", () => {
    expect(count("page")).toBe(NAV.length + 1 + COMMAND_CENTRE_SECTIONS.length + CAREER_SECTIONS.length + PATHWAYS.length + FLIGHT_OPS_TABS.length + GIS_TABS.length + JURISDICTION_TABS.length);
    expect(INDEX.find((e) => e.title === "Terms of Use").to).toBe("/terms");
    expect(INDEX.find((e) => e.title === "GIS: UTM Zones").to).toBe("/gis#utm");
  });

  it("the Career sections and pathways, each landing on its anchor", () => {
    expect(INDEX.find((e) => e.title === "Career: CPD Hour Log").to).toBe("/career#cpd");
    expect(INDEX.find((e) => e.title === "Career: News Wire").to).toBe("/career#news");
    expect(INDEX.find((e) => e.title === "Career: BCLS pathway").to).toBe("/career#bcls");
    for (const q of ["CPD", "AScT", "BCLS", "CLS", "RPAS Advanced", "reading", "news"]) {
      const hits = search(INDEX, q);
      expect(hits.some((h) => String(h.to || "").startsWith("/career")), q).toBe(true);
    }
    // "CLS" must put the CLS pathway above the BCLS one (exact word beats substring)
    const cls = search(INDEX, "CLS").filter((h) => String(h.to || "").startsWith("/career#"));
    expect(cls[0].to).toBe("/career#cls");
  });

  it("the 12 survey tools, each landing on its tab", () => {
    expect(SURVEY_TOOLS).toHaveLength(12);
    expect(count("tool")).toBe(12);
    expect(INDEX.find((e) => e.title === "Mag Dec").to).toBe("/survey-tools#mag");
  });

  it("13 jurisdictions plus federal, each landing on its province", () => {
    expect(PROVINCES).toHaveLength(14);
    expect(count("jurisdiction")).toBe(14);
    expect(INDEX.find((e) => e.title === "British Columbia").to).toBe("/jurisdictions#bc");
  });

  it("every glossary term, landing on the Codex with the term as the query", () => {
    expect(count("term")).toBe(termCount);
    expect(INDEX.find((e) => e.kind === "term" && e.title === "RTK").to).toBe("/codex#RTK");
    expect(INDEX.find((e) => e.kind === "term" && e.title === "WFS / WMS").to).toBe(`/codex#${encodeURIComponent("WFS / WMS")}`);
  });

  it("the CRS and GDAL reference entries", () => {
    expect(count("crs")).toBe(CRS_CHEAT.length);
    expect(count("gdal")).toBe(GDAL_CMDS.length);
    expect(INDEX.find((e) => e.kind === "crs" && e.title.startsWith("EPSG:3005")).to).toBe("/gis#crs");
    expect(INDEX.find((e) => e.kind === "gdal" && e.title.startsWith("gdalwarp")).to).toBe("/gis#gdal");
  });

  it("every entry has a title, a one-line context, and exactly one target", () => {
    for (const e of INDEX) {
      expect(e.title.length).toBeGreaterThan(0);
      expect(typeof e.context).toBe("string");
      expect(Boolean(e.to) !== Boolean(e.href)).toBe(true);
    }
  });
});

describe("news wire and portals", () => {
  const feeds = { sources: [
    { id: "tc", short: "TC", name: "Transport Canada", items: [
      { title: "Drone rules updated", link: "https://tc.example/1", date: "2026-10-30T12:00:00Z", summary: "New categories." },
      { title: "No link item", date: "2026-10-30T12:00:00Z" },
    ] },
    { id: "nrcan", short: "NRCan", name: "NRCan", items: [{ title: "CSRS-PPP v5 released", link: "https://nrcan.example/2" }] },
  ] };

  it("indexes every dated or undated item that has a title and a link", () => {
    const news = buildNewsIndex(feeds);
    expect(news).toHaveLength(2);
    expect(news[0].href).toBe("https://tc.example/1");
    expect(news[0].context).toMatch(/^TC/);
    expect(news[1].context).toMatch(/undated/);
  });

  it("tolerates a missing or malformed feeds file", () => {
    expect(buildNewsIndex(null)).toEqual([]);
    expect(buildNewsIndex({})).toEqual([]);
  });

  it("indexes only municipalities (and related entities) that have a portal", () => {
    const munis = [
      { name: "Prince George", province: "BC", entityType: "City", portalUrl: "https://data.pg.example", related: [
        { name: "Fraser-Fort George Regional District", entityType: "Regional District" },
      ] },
      { name: "No Portal Town", province: "BC", entityType: "Town", portalUrl: null },
      { name: "Capital Regional District", province: "BC", entityType: "Regional District", portalUrl: null, related: [
        { name: "Esquimalt", entityType: "District Municipality", portalUrl: "https://opendata.esquimalt.example" },
      ] },
    ];
    const portals = buildPortalIndex(munis);
    expect(portals.map((p) => p.title)).toEqual(["Prince George", "Esquimalt"]);
    expect(portals[0].context).toBe("City, BC: open data portal");
  });
});

describe("ranking", () => {
  it("exact title beats substring in title beats a context-only match", () => {
    const titles = search(INDEX, "rtk").map((x) => x.title);
    expect(titles[0]).toBe("RTK");
    expect(titles.indexOf("RTK")).toBeLessThan(titles.indexOf("NRTK"));
    // Geodesy matches rtk only through its page keywords.
    expect(titles.indexOf("NRTK")).toBeLessThan(titles.indexOf("Geodesy"));
  });

  it("title prefix outranks the same text deeper in a title", () => {
    const r = search(INDEX, "nad83");
    expect(r[0].title).toMatch(/^NAD83/);
    const deeper = r.findIndex((x) => x.title.includes("/ NAD83"));
    if (deeper !== -1) expect(r.findIndex((x) => x.title.startsWith("NAD83"))).toBeLessThan(deeper);
  });

  it("matches every token of a multi-word query, in any order, ignoring accents and case", () => {
    expect(search(INDEX, "columbia british")[0].title).toBe("British Columbia");
    expect(search(INDEX, "QUÉBEC")[0].title).toBe("Quebec");
    expect(normalize("  Québec  City ")).toBe("quebec city");
  });

  it("finds an EPSG code by number and a GDAL command by verb", () => {
    expect(search(INDEX, "3005")[0].title).toBe("EPSG:3005 NAD83 / BC Albers");
    expect(search(INDEX, "gdalwarp")[0].kind).toBe("gdal");
  });

  it("returns nothing for an empty, blank or unmatched query", () => {
    expect(search(INDEX, "")).toEqual([]);
    expect(search(INDEX, "   ")).toEqual([]);
    expect(search(INDEX, "zzqxv")).toEqual([]);
    expect(groupResults([])).toEqual([]);
  });

  it("caps hits per kind and in total", () => {
    const r = search(INDEX, "a", { perKind: 3, limit: 10 });
    expect(r.length).toBeLessThanOrEqual(10);
    const perKind = {};
    for (const x of r) perKind[x.kind] = (perKind[x.kind] || 0) + 1;
    expect(Math.max(...Object.values(perKind))).toBeLessThanOrEqual(3);
  });

  it("groups by kind with the best-scoring group first", () => {
    const g = groupResults(search(INDEX, "rtk"));
    expect(g[0].kind).toBe("term");
    expect(g[0].items[0].title).toBe("RTK");
    for (const grp of g) expect(grp.items.every((i) => i.kind === grp.kind)).toBe(true);
  });
});

describe("field safety section", () => {
  const index = buildStaticIndex();
  it.each(["UV", "AQHI", "humidex", "wind chill", "daylight", "working alone"])("'%s' finds the Field Safety card", (q) => {
    const r = search(index, q);
    expect(r.some((e) => e.to === "/#safety")).toBe(true);
  });
  it("finds the provincial WorkSafe links", () => {
    const r = search(index, "worksafe");
    expect(r.some((e) => e.kind === "provlink" && /worksafe/i.test(e.title))).toBe(true);
  });
});
