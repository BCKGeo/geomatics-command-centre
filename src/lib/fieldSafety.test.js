import { describe, it, expect } from "vitest";
import {
  uvBand, aqhiBand, pm25Band, humidex, humidexBand, windChill, windChillBand,
  usableHours, fmtHours, workSafeLinks, WORKING_ALONE, SOURCES,
} from "./fieldSafety.js";
import { PROVINCES } from "../data/jurisdictions/index.js";

describe("uvBand (ECCC bands)", () => {
  it("bands at the ECCC boundaries", () => {
    expect(uvBand(0).label).toBe("Low");
    expect(uvBand(2).label).toBe("Low");
    expect(uvBand(3).label).toBe("Moderate");
    expect(uvBand(5).label).toBe("Moderate");
    expect(uvBand(6).label).toBe("High");
    expect(uvBand(7).label).toBe("High");
    expect(uvBand(8).label).toBe("Very High");
    expect(uvBand(10).label).toBe("Very High");
    expect(uvBand(11).label).toBe("Extreme");
    expect(uvBand(14.2).label).toBe("Extreme");
  });
  it("rounds like ECCC before banding", () => {
    expect(uvBand(2.4).label).toBe("Low");
    expect(uvBand(2.5).label).toBe("Moderate");
  });
  it("returns null for missing or bad data", () => {
    expect(uvBand(null)).toBeNull();
    expect(uvBand(undefined)).toBeNull();
    expect(uvBand(NaN)).toBeNull();
    expect(uvBand("3")).toBeNull();
    expect(uvBand(-1)).toBeNull();
  });
});

describe("aqhiBand (ECCC bands)", () => {
  it("bands at the ECCC boundaries", () => {
    expect(aqhiBand(1).label).toBe("Low Risk");
    expect(aqhiBand(3).label).toBe("Low Risk");
    expect(aqhiBand(4).label).toBe("Moderate Risk");
    expect(aqhiBand(6).label).toBe("Moderate Risk");
    expect(aqhiBand(7).label).toBe("High Risk");
    expect(aqhiBand(10).label).toBe("High Risk");
    expect(aqhiBand(11).label).toBe("Very High Risk");
  });
  it("carries both population messages", () => {
    const b = aqhiBand(8);
    expect(b.general).toMatch(/Consider reducing/);
    expect(b.atRisk).toMatch(/Reduce or reschedule/);
  });
  it("returns null for missing data or values below 1", () => {
    expect(aqhiBand(null)).toBeNull();
    expect(aqhiBand(0)).toBeNull();
    expect(aqhiBand(NaN)).toBeNull();
  });
});

describe("pm25Band (CAAQS)", () => {
  it("compares against the annual and 24-hour standards", () => {
    expect(pm25Band(0).label).toBe("Clear");
    expect(pm25Band(8.8).label).toBe("Clear");
    expect(pm25Band(8.9).label).toBe("Within standard");
    expect(pm25Band(27).label).toBe("Within standard");
    expect(pm25Band(27.1).label).toBe("Above standard");
    expect(pm25Band(150).label).toBe("Above standard");
  });
  it("returns null for missing or negative data", () => {
    expect(pm25Band(null)).toBeNull();
    expect(pm25Band(-1)).toBeNull();
    expect(pm25Band(undefined)).toBeNull();
  });
});

describe("humidex", () => {
  it("matches ECCC's worked value: 30 C with dew point 20 C is about 37", () => {
    // ECCC's table gives 38 for 30 C and dew point 20; the formula gives 37.6
    expect(humidex(30, 20)).toBeCloseTo(37.6, 0);
  });
  it("never reports below the air temperature", () => {
    expect(humidex(20, -10)).toBe(20);
  });
  it("returns null for missing data", () => {
    expect(humidex(null, 10)).toBeNull();
    expect(humidex(25, undefined)).toBeNull();
    expect(humidex(NaN, 10)).toBeNull();
  });
});

describe("humidexBand (ECCC bands)", () => {
  it("bands at the ECCC boundaries", () => {
    expect(humidexBand(19).label).toBe("No heat stress");
    expect(humidexBand(20).label).toBe("Little discomfort");
    expect(humidexBand(29).label).toBe("Little discomfort");
    expect(humidexBand(30).label).toBe("Some discomfort");
    expect(humidexBand(39).label).toBe("Some discomfort");
    expect(humidexBand(40).label).toBe("Great discomfort");
    expect(humidexBand(45).label).toBe("Great discomfort");
    expect(humidexBand(46).label).toBe("Dangerous");
    expect(humidexBand(45.5).label).toBe("Dangerous");
  });
  it("returns null for missing data", () => {
    expect(humidexBand(null)).toBeNull();
    expect(humidexBand(NaN)).toBeNull();
  });
});

describe("windChill", () => {
  it("matches the index formula: -10 C at 30 km/h is about -20", () => {
    expect(windChill(-10, 30)).toBeCloseTo(-19.5, 0);
  });
  it("is undefined above 10 C or under 4.8 km/h of wind", () => {
    expect(windChill(12, 30)).toBeNull();
    expect(windChill(-10, 3)).toBeNull();
  });
  it("returns null for missing data", () => {
    expect(windChill(null, 30)).toBeNull();
    expect(windChill(-10, undefined)).toBeNull();
  });
});

describe("windChillBand (ECCC bands)", () => {
  it("bands at the ECCC boundaries", () => {
    expect(windChillBand(0).label).toBe("Low");
    expect(windChillBand(-9).label).toBe("Low");
    expect(windChillBand(-10).label).toBe("Moderate");
    expect(windChillBand(-27).label).toBe("Moderate");
    expect(windChillBand(-28).label).toBe("High");
    expect(windChillBand(-39).label).toBe("High");
    expect(windChillBand(-40).label).toBe("Very High");
    expect(windChillBand(-47).label).toBe("Very High");
    expect(windChillBand(-48).label).toBe("Severe");
    expect(windChillBand(-54).label).toBe("Severe");
    expect(windChillBand(-55).label).toBe("Extreme");
    expect(windChillBand(-70).label).toBe("Extreme");
  });
  it("rounds before banding and has no band above 0", () => {
    expect(windChillBand(-9.4).label).toBe("Low");
    expect(windChillBand(-9.6).label).toBe("Moderate");
    expect(windChillBand(1)).toBeNull();
  });
  it("returns null for missing data", () => {
    expect(windChillBand(null)).toBeNull();
    expect(windChillBand(undefined)).toBeNull();
  });
});

describe("usableHours and fmtHours", () => {
  it("measures civil dawn to civil dusk", () => {
    const a = new Date(2026, 5, 21, 4, 10), b = new Date(2026, 5, 21, 22, 40);
    expect(usableHours(a, b)).toBeCloseTo(18.5, 5);
    expect(fmtHours(18.5)).toBe("18h 30m");
  });
  it("is null without a crossing", () => {
    expect(usableHours(null, new Date())).toBeNull();
    expect(usableHours(new Date(2026, 0, 1, 12), new Date(2026, 0, 1, 8))).toBeNull();
    expect(fmtHours(null)).toBe("--");
  });
  it("formats a rounding carry", () => {
    expect(fmtHours(7.9999)).toBe("8h 00m");
  });
});

describe("static data", () => {
  it("has a regulator for all 13 jurisdictions plus federal", () => {
    const links = workSafeLinks(PROVINCES);
    expect(links).toHaveLength(14);
    const ids = links.map((w) => w.id).sort();
    expect(ids).toEqual(["ab", "bc", "ca", "mb", "nb", "nl", "ns", "nt", "nu", "on", "pe", "qc", "sk", "yt"]);
    for (const w of links) expect(w.u).toMatch(/^https:\/\//);
    expect(workSafeLinks(null)).toEqual([]);
  });
  it("has a dated Tier A source for every scale", () => {
    expect(SOURCES.length).toBeGreaterThanOrEqual(6);
    for (const s of SOURCES) {
      expect(s.u).toMatch(/^https:\/\/(www\.canada\.ca|ccme\.ca|www\.worksafebc\.com|www\.ccohs\.ca)\//);
      expect(s.read).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(WORKING_ALONE.length).toBeGreaterThan(3);
  });
});
