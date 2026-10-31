import { describe, it, expect } from "vitest";
import { SOURCES, PATHWAYS, READING, surveyorBodies, surveyActs } from "./career.js";
import { PROVINCES } from "./jurisdictions/index.js";

const DASHES = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]"); // em and en dash, built so the file never contains one

describe("certification pathways", () => {
  it("has the four pathways the direction record names", () => {
    expect(PATHWAYS.map((p) => p.id)).toEqual(["asct", "bcls", "cls", "rpas"]);
  });
  it("every step is cited to a known source or marked unverified, never both", () => {
    for (const p of PATHWAYS) {
      expect(p.steps.length).toBeGreaterThan(2);
      for (const s of p.steps) {
        const cited = Boolean(s.cite), unverified = s.unverified === true;
        expect(cited !== unverified, `${p.id}: ${s.t}`).toBe(true);
        if (cited) expect(SOURCES[s.cite], `${p.id}: ${s.t} cites ${s.cite}`).toBeDefined();
      }
    }
  });
  it("every source has a URL on the body's own domain and a date read", () => {
    const own = /asttbc\.org|abcls\.ca|cbeps-cceag\.ca|acls-aatc\.ca|tc\.canada\.ca/;
    for (const s of Object.values(SOURCES)) {
      expect(s.u).toMatch(own);
      expect(s.read).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("no em or en dashes anywhere in the copy", () => {
    const text = JSON.stringify({ SOURCES, PATHWAYS, READING });
    expect(DASHES.test(text)).toBe(false);
  });
});

describe("reading list", () => {
  it("is primary sources only, each with a reason and a date read", () => {
    const primary = /canada\.ca|gc\.ca|asprs\.org|cbeps-cceag\.ca/;
    for (const r of READING) {
      expect(r.u).toMatch(primary);
      expect(r.d.length).toBeGreaterThan(20);
      expect(r.read).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("surveyorBodies", () => {
  it("finds one land surveyor regulator for every province, ACLS for the territories", () => {
    const bodies = surveyorBodies(PROVINCES);
    const byAbbr = (a) => bodies.find((b) => b.abbrs.includes(a));
    expect(byAbbr("BC").n).toBe("ABCLS");
    expect(byAbbr("AB").n).toBe("ALSA");
    expect(byAbbr("ON").n).toBe("AOLS");
    expect(byAbbr("QC").n).toBe("OAGQ");
    // ACLS once, covering federal and the three territories
    const acls = bodies.filter((b) => b.n === "ACLS");
    expect(acls).toHaveLength(1);
    expect(acls[0].abbrs).toEqual(expect.arrayContaining(["CA", "YT", "NT", "NU"]));
    // Every province and territory is covered by exactly one body
    for (const p of PROVINCES) {
      expect(bodies.filter((b) => b.abbrs.includes(p.abbr)), p.id).toHaveLength(1);
    }
  });
  it("skips engineering and technologist bodies", () => {
    const names = surveyorBodies(PROVINCES).map((b) => b.n);
    expect(names).not.toContain("EGBC");
    expect(names).not.toContain("ASTTBC");
    expect(names).not.toContain("APEGA");
  });
  it("handles empty input", () => {
    expect(surveyorBodies([])).toEqual([]);
    expect(surveyorBodies(null)).toEqual([]);
  });
});

describe("surveyActs", () => {
  it("finds a survey act for every jurisdiction", () => {
    const acts = surveyActs(PROVINCES);
    for (const p of PROVINCES) expect(acts.some((a) => a.id === p.id), p.id).toBe(true);
    expect(acts.find((a) => a.id === "bc").n).toBe("Land Surveyors Act");
  });
});
