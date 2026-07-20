// Tests for the TLE fetch core used by scripts/fetch-tles.mjs.
// All network access is injected via fetchImpl; no real requests.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fetchGroup, buildTleFile } from "./tle-fetch.mjs";

const sat = (name) => ({ OBJECT_NAME: name, TLE_LINE1: "1 0", TLE_LINE2: "2 0" });
const okResponse = (data) => ({ ok: true, json: async () => data });
const noLog = () => {};

describe("fetchGroup", () => {
  it("returns parsed entries on success", async () => {
    const fetchImpl = async () => okResponse([sat("GPS-1"), sat("GPS-2")]);
    const data = await fetchGroup("gps-ops", { fetchImpl, log: noLog });
    expect(data).toHaveLength(2);
    expect(data[0].OBJECT_NAME).toBe("GPS-1");
  });

  it("retries transient network failures and succeeds", async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls++;
      if (calls < 3) throw new Error("fetch failed");
      return okResponse([sat("GPS-1")]);
    };
    const data = await fetchGroup("gps-ops", {
      fetchImpl,
      attempts: 3,
      backoffMs: 0,
      log: noLog,
    });
    expect(data).toHaveLength(1);
    expect(calls).toBe(3);
  });

  it("retries HTTP error statuses", async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls++;
      if (calls === 1) return { ok: false, status: 403 };
      return okResponse([sat("GPS-1")]);
    };
    const data = await fetchGroup("gps-ops", {
      fetchImpl,
      attempts: 2,
      backoffMs: 0,
      log: noLog,
    });
    expect(data).toHaveLength(1);
    expect(calls).toBe(2);
  });

  it("treats an empty response body as a failure", async () => {
    const fetchImpl = async () => okResponse([]);
    await expect(
      fetchGroup("gps-ops", { fetchImpl, attempts: 2, backoffMs: 0, log: noLog })
    ).rejects.toThrow(/empty/);
  });

  it("throws after exhausting all attempts", async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls++;
      throw new Error("fetch failed");
    };
    await expect(
      fetchGroup("gps-ops", { fetchImpl, attempts: 3, backoffMs: 0, log: noLog })
    ).rejects.toThrow("fetch failed");
    expect(calls).toBe(3);
  });
});

describe("buildTleFile", () => {
  let dir;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "tle-test-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  // Fallback snapshots are keyed by group so failed groups can be
  // substituted individually.
  const writeFallback = async (byGroup) => {
    const p = join(dir, "tles-fallback.json");
    await writeFile(p, JSON.stringify(byGroup));
    return p;
  };

  it("writes merged groups and reports source fresh", async () => {
    const fetchImpl = async (url) => {
      if (url.includes("gps-ops")) return okResponse([sat("GPS-1")]);
      return okResponse([sat("GLONASS-1"), sat("GLONASS-2")]);
    };
    const outPath = join(dir, "tles.json");
    const result = await buildTleFile({
      groups: ["gps-ops", "glo-ops"],
      outPath,
      fallbackPath: join(dir, "missing-fallback.json"),
      fetchImpl,
      backoffMs: 0,
      log: noLog,
      warn: noLog,
    });
    expect(result.source).toBe("fresh");
    expect(result.count).toBe(3);
    const written = JSON.parse(await readFile(outPath, "utf8"));
    expect(written).toHaveLength(3);
  });

  it("substitutes fallback entries only for the groups that keep failing", async () => {
    const fallbackPath = await writeFallback({
      "gps-ops": [sat("STALE-GPS")],
      beidou: [sat("STALE-BDS-1"), sat("STALE-BDS-2")],
    });
    const fetchImpl = async (url) => {
      if (url.includes("beidou")) throw new Error("fetch failed");
      return okResponse([sat("FRESH-GPS")]);
    };
    const outPath = join(dir, "tles.json");
    const result = await buildTleFile({
      groups: ["gps-ops", "beidou"],
      outPath,
      fallbackPath,
      fetchImpl,
      attempts: 2,
      backoffMs: 0,
      log: noLog,
      warn: noLog,
    });
    expect(result.source).toBe("partial");
    expect(result.count).toBe(3);
    const names = JSON.parse(await readFile(outPath, "utf8")).map((s) => s.OBJECT_NAME);
    expect(names).toContain("FRESH-GPS");
    expect(names).toContain("STALE-BDS-1");
    expect(names).toContain("STALE-BDS-2");
    expect(names).not.toContain("STALE-GPS");
  });

  it("uses the full fallback when every group fails", async () => {
    const fallbackPath = await writeFallback({
      "gps-ops": [sat("STALE-GPS")],
      "glo-ops": [sat("STALE-GLO")],
    });
    const fetchImpl = async () => {
      throw new Error("fetch failed");
    };
    const outPath = join(dir, "tles.json");
    const result = await buildTleFile({
      groups: ["gps-ops", "glo-ops"],
      outPath,
      fallbackPath,
      fetchImpl,
      attempts: 2,
      backoffMs: 0,
      log: noLog,
      warn: noLog,
    });
    expect(result.source).toBe("fallback");
    expect(result.count).toBe(2);
  });

  it("ships fresh groups and skips failed ones when no fallback exists", async () => {
    const fetchImpl = async (url) => {
      if (url.includes("beidou")) throw new Error("fetch failed");
      return okResponse([sat("FRESH-GPS")]);
    };
    const outPath = join(dir, "tles.json");
    const result = await buildTleFile({
      groups: ["gps-ops", "beidou"],
      outPath,
      fallbackPath: join(dir, "missing-fallback.json"),
      fetchImpl,
      attempts: 2,
      backoffMs: 0,
      log: noLog,
      warn: noLog,
    });
    expect(result.source).toBe("partial");
    expect(result.count).toBe(1);
    const names = JSON.parse(await readFile(outPath, "utf8")).map((s) => s.OBJECT_NAME);
    expect(names).toEqual(["FRESH-GPS"]);
  });

  it("throws when every group fails and no fallback snapshot exists", async () => {
    const fetchImpl = async () => {
      throw new Error("fetch failed");
    };
    await expect(
      buildTleFile({
        groups: ["gps-ops"],
        outPath: join(dir, "tles.json"),
        fallbackPath: join(dir, "missing-fallback.json"),
        fetchImpl,
        attempts: 2,
        backoffMs: 0,
        log: noLog,
        warn: noLog,
      })
    ).rejects.toThrow();
  });

  it("throws a descriptive error when the fallback snapshot is corrupt", async () => {
    const fallbackPath = join(dir, "tles-fallback.json");
    await writeFile(fallbackPath, '{"gps-ops": [truncated');
    const fetchImpl = async () => {
      throw new Error("fetch failed");
    };
    await expect(
      buildTleFile({
        groups: ["gps-ops"],
        outPath: join(dir, "tles.json"),
        fallbackPath,
        fetchImpl,
        attempts: 2,
        backoffMs: 0,
        log: noLog,
        warn: noLog,
      })
    ).rejects.toThrow(/fallback/i);
  });
});
