import { describe, it, expect } from "vitest";
import { identifyConstellation, computePDOP, countByConstellation, pdopLevel, propagateAll } from "./satellites.js";

describe("identifyConstellation", () => {
  it("GPS variants", () => {
    expect(identifyConstellation("GPS BIIR-2 (PRN 13)")).toBe("gps");
    expect(identifyConstellation("GPS BIIF-12 (PRN 08)")).toBe("gps");
    expect(identifyConstellation("GPS BIII-6 (PRN 18)")).toBe("gps");
    expect(identifyConstellation("NAVSTAR 81 (USA 319)")).toBe("gps");
    expect(identifyConstellation("USA 304")).toBe("gps");
  });

  it("GLONASS variants", () => {
    expect(identifyConstellation("GLONASS-M 751")).toBe("glonass");
    expect(identifyConstellation("COSMOS 2564")).toBe("glonass");
  });

  it("Galileo variants", () => {
    expect(identifyConstellation("GALILEO 27 (325)")).toBe("galileo");
    expect(identifyConstellation("GSAT0219")).toBe("galileo");
  });

  it("BeiDou variants", () => {
    expect(identifyConstellation("BEIDOU-3 M23")).toBe("beidou");
  });

  it("unknown fallback", () => {
    expect(identifyConstellation("ISS (ZARYA)")).toBe("unknown");
    expect(identifyConstellation("")).toBe("unknown");
    expect(identifyConstellation(null)).toBe("unknown");
  });
});

describe("computePDOP", () => {
  it("returns null with fewer than 4 satellites", () => {
    expect(computePDOP([])).toBe(null);
    expect(computePDOP([{ az: 0, el: 45 }])).toBe(null);
    expect(computePDOP([{ az: 0, el: 45 }, { az: 90, el: 45 }, { az: 180, el: 45 }])).toBe(null);
  });

  it("computes PDOP for well-distributed geometry", () => {
    // 4 satellites at varied elevations, evenly spaced in azimuth
    const sats = [
      { az: 0, el: 30 },
      { az: 90, el: 60 },
      { az: 180, el: 25 },
      { az: 270, el: 70 },
    ];
    const pdop = computePDOP(sats);
    expect(pdop).not.toBe(null);
    expect(pdop).toBeGreaterThan(0);
    expect(pdop).toBeLessThan(10); // reasonable geometry
  });

  it("excellent geometry with many satellites", () => {
    // 8 well-distributed satellites
    const sats = [];
    for (let i = 0; i < 8; i++) {
      sats.push({ az: i * 45, el: 30 + (i % 2) * 30 });
    }
    const pdop = computePDOP(sats);
    expect(pdop).not.toBe(null);
    expect(pdop).toBeLessThan(4); // should be good/excellent
  });

  it("poor geometry with coplanar satellites", () => {
    // All satellites on same azimuth line, poor geometry
    const sats = [
      { az: 0, el: 10 },
      { az: 0, el: 30 },
      { az: 0, el: 50 },
      { az: 0, el: 70 },
    ];
    const pdop = computePDOP(sats);
    // Coplanar = singular or very high PDOP
    if (pdop !== null) {
      expect(pdop).toBeGreaterThan(5);
    }
  });
});

describe("countByConstellation", () => {
  it("counts correctly", () => {
    const sats = [
      { constellation: "gps" },
      { constellation: "gps" },
      { constellation: "glonass" },
      { constellation: "galileo" },
      { constellation: "beidou" },
      { constellation: "beidou" },
    ];
    const c = countByConstellation(sats);
    expect(c.gps).toBe(2);
    expect(c.glonass).toBe(1);
    expect(c.galileo).toBe(1);
    expect(c.beidou).toBe(2);
    expect(c.total).toBe(6);
  });

  it("handles empty array", () => {
    const c = countByConstellation([]);
    expect(c.total).toBe(0);
  });
});

describe("pdopLevel", () => {
  it("returns correct thresholds", () => {
    expect(pdopLevel(1.5).label).toBe("Excellent");
    expect(pdopLevel(3.0).label).toBe("Good");
    expect(pdopLevel(5.0).label).toBe("Fair");
    expect(pdopLevel(8.0).label).toBe("Poor");
  });
});

describe("propagateAll", () => {
  it("returns empty array for empty TLE list", () => {
    const result = propagateAll([], 45, -75, new Date());
    expect(result).toEqual([]);
  });

  it("filters out malformed TLEs gracefully", () => {
    const bad = [{ OBJECT_NAME: "BAD", TLE_LINE1: "garbage", TLE_LINE2: "garbage" }];
    const result = propagateAll(bad, 45, -75, new Date());
    // Should produce no valid results (NaN positions filtered out)
    expect(result.length).toBe(0);
  });

  it("propagates a real TLE correctly", () => {
    // ISS TLE (epoch ~2024, will still propagate for testing)
    const tles = [{
      OBJECT_NAME: "GPS BIIF-12 (PRN 08)",
      TLE_LINE1: "1 40730U 15033A   24001.50000000  .00000010  00000-0  00000-0 0  9999",
      TLE_LINE2: "2 40730  55.0328 177.8490 0040830 213.7850 146.0200  2.00563172 62001",
    }];
    const result = propagateAll(tles, 45.4215, -75.6972, new Date("2024-01-02T00:00:00Z"));
    // May or may not be visible depending on geometry, but should not throw
    expect(Array.isArray(result)).toBe(true);
    for (const s of result) {
      expect(s.el).toBeGreaterThan(0);
      expect(s.az).toBeGreaterThanOrEqual(0);
      expect(s.az).toBeLessThanOrEqual(360);
      expect(s.constellation).toBe("gps");
    }
  });
});
