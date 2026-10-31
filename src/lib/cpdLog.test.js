import { describe, it, expect } from "vitest";
import {
  CATEGORIES, STORAGE_KEY, CSV_HEADER,
  validateEntry, addEntry, removeEntry, sortLog, totalHours, totalsByCategory, totalsByYear, hoursBetween,
  csvField, toCSV, loadLog, saveLog, todayISO,
} from "./cpdLog.js";

const draft = (over = {}) => ({ date: "2026-03-14", activity: "GNSS workshop", category: "Course or workshop", hours: 3, note: "", ...over });

// Minimal in-memory Storage for loadLog and saveLog
function memStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}

describe("validateEntry", () => {
  it("accepts a complete entry", () => {
    expect(validateEntry(draft())).toEqual([]);
  });
  it("rejects bad dates, blank activity, unknown category and bad hours", () => {
    expect(validateEntry(draft({ date: "14/03/2026" }))).toContain("Date must be YYYY-MM-DD");
    expect(validateEntry(draft({ date: "2026-13-45" }))).toContain("Date must be YYYY-MM-DD");
    expect(validateEntry(draft({ activity: "   " }))).toContain("Activity is required");
    expect(validateEntry(draft({ category: "Lunch" }))).toContain("Pick a category");
    expect(validateEntry(draft({ hours: 0 }))).toContain("Hours must be between 0 and 24");
    expect(validateEntry(draft({ hours: 25 }))).toContain("Hours must be between 0 and 24");
    expect(validateEntry(draft({ hours: "abc" }))).toContain("Hours must be between 0 and 24");
    expect(validateEntry(null)).toEqual(["No entry"]);
  });
  it("every category passes", () => {
    for (const c of CATEGORIES) expect(validateEntry(draft({ category: c }))).toEqual([]);
  });
});

describe("addEntry", () => {
  it("adds to an empty log without mutating the input", () => {
    const empty = [];
    const log = addEntry(empty, draft(), 1000);
    expect(empty).toEqual([]);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ date: "2026-03-14", activity: "GNSS workshop", category: "Course or workshop", hours: 3, note: "" });
    expect(log[0].id).toMatch(/^rs-/); // 1000 in base 36
  });
  it("accepts a null log as empty", () => {
    expect(addEntry(null, draft())).toHaveLength(1);
  });
  it("keeps newest date first and rounds hours to the quarter", () => {
    let log = addEntry([], draft({ date: "2026-01-10", hours: 1.3 }));
    log = addEntry(log, draft({ date: "2026-05-02", hours: 2.88 }));
    log = addEntry(log, draft({ date: "2025-12-31", hours: 0.1 }));
    expect(log.map((e) => e.date)).toEqual(["2026-05-02", "2026-01-10", "2025-12-31"]);
    expect(log.map((e) => e.hours)).toEqual([3, 1.25, 0]);
  });
  it("trims text and accepts a string hours value from an input", () => {
    const log = addEntry([], draft({ activity: "  Levelling refresher ", hours: "1.5", note: " site notes " }));
    expect(log[0].activity).toBe("Levelling refresher");
    expect(log[0].hours).toBe(1.5);
    expect(log[0].note).toBe("site notes");
  });
  it("throws on an invalid draft", () => {
    expect(() => addEntry([], draft({ activity: "" }))).toThrow(/Activity is required/);
  });
});

describe("removeEntry and sortLog", () => {
  it("removes by id and leaves the rest", () => {
    const log = addEntry(addEntry([], draft(), 1), draft({ date: "2026-04-01" }), 2);
    const out = removeEntry(log, log[0].id);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(log[1].id);
    expect(removeEntry(null, "x")).toEqual([]);
  });
  it("sorts a stored log newest first", () => {
    const s = sortLog([{ date: "2024-01-01" }, { date: "2026-01-01" }, { date: "2025-06-30" }]);
    expect(s.map((e) => e.date)).toEqual(["2026-01-01", "2025-06-30", "2024-01-01"]);
  });
});

describe("totals", () => {
  const log = [
    { id: "a", date: "2026-02-01", category: "Course or workshop", hours: 3 },
    { id: "b", date: "2026-07-15", category: "Self-directed study", hours: 1.5 },
    { id: "c", date: "2025-11-20", category: "Course or workshop", hours: 2.25 },
    { id: "d", date: "2025-03-03", category: "Volunteering or committee", hours: 4 },
  ];
  it("total hours", () => {
    expect(totalHours(log)).toBe(10.75);
    expect(totalHours([])).toBe(0);
    expect(totalHours(null)).toBe(0);
  });
  it("per category in CATEGORIES order, empty categories left out", () => {
    expect(totalsByCategory(log)).toEqual([
      { category: "Course or workshop", hours: 5.25 },
      { category: "Self-directed study", hours: 1.5 },
      { category: "Volunteering or committee", hours: 4 },
    ]);
    expect(totalsByCategory([])).toEqual([]);
  });
  it("per year, newest first, bad dates skipped", () => {
    expect(totalsByYear(log)).toEqual([{ year: "2026", hours: 4.5 }, { year: "2025", hours: 6.25 }]);
    expect(totalsByYear([{ date: "junk", hours: 9 }])).toEqual([]);
    expect(totalsByYear([])).toEqual([]);
  });
  it("hours in a reporting cycle, inclusive bounds (ASTTBC 1 June to 31 May)", () => {
    expect(hoursBetween(log, "2025-06-01", "2026-05-31")).toBe(5.25);
    expect(hoursBetween(log, "2026-07-15", "2026-07-15")).toBe(1.5);
    expect(hoursBetween(log, "2030-01-01", "2030-12-31")).toBe(0);
  });
  it("avoids float drift", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: String(i), date: "2026-01-01", category: "Other", hours: 0.1 }));
    expect(totalHours(many)).toBe(1);
    expect(totalsByYear(many)[0].hours).toBe(1);
  });
});

describe("CSV", () => {
  it("escapes commas, quotes and newlines", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField("a, b")).toBe('"a, b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField("line1\nline2")).toBe('"line1\nline2"');
    expect(csvField(null)).toBe("");
    expect(csvField(2.5)).toBe("2.5");
  });
  it("writes a header and one row per entry, newest first, CRLF ends", () => {
    const log = [
      { id: "1", date: "2025-01-01", activity: "Old", category: "Other", hours: 1, note: "" },
      { id: "2", date: "2026-02-02", activity: "Talk, with comma", category: "Teaching or presenting", hours: 2, note: 'He said "go"' },
    ];
    const csv = toCSV(log);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(CSV_HEADER.join(","));
    expect(lines[1]).toBe('2026-02-02,"Talk, with comma",Teaching or presenting,2,"He said ""go"""');
    expect(lines[2]).toBe("2025-01-01,Old,Other,1,");
    expect(csv.endsWith("\r\n")).toBe(true);
  });
  it("empty log gives header only", () => {
    expect(toCSV([])).toBe("date,activity,category,hours,note\r\n");
  });
});

describe("storage", () => {
  it("round-trips through a Storage object and clears when empty", () => {
    const s = memStorage();
    const log = addEntry([], draft());
    expect(saveLog(log, s)).toBe(true);
    expect(s._m.has(STORAGE_KEY)).toBe(true);
    expect(loadLog(s)).toEqual(log);
    expect(saveLog([], s)).toBe(true);
    expect(s._m.has(STORAGE_KEY)).toBe(false);
    expect(loadLog(s)).toEqual([]);
  });
  it("returns an empty log on missing, corrupt or wrong-shaped data", () => {
    expect(loadLog(memStorage())).toEqual([]);
    expect(loadLog(memStorage({ [STORAGE_KEY]: "{not json" }))).toEqual([]);
    expect(loadLog(memStorage({ [STORAGE_KEY]: '{"a":1}' }))).toEqual([]);
    expect(loadLog(memStorage({ [STORAGE_KEY]: '[{"id":"x","date":"2026-01-01","hours":1},{"date":"nope"},null]' }))).toHaveLength(1);
    expect(loadLog(undefined)).toEqual([]);
  });
  it("saveLog reports false when storage throws", () => {
    const bad = { setItem: () => { throw new Error("quota"); }, removeItem: () => {} };
    expect(saveLog([{ id: "x" }], bad)).toBe(false);
  });
});

describe("todayISO", () => {
  it("formats local date as YYYY-MM-DD", () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(todayISO(new Date(2026, 10, 30))).toBe("2026-11-30");
  });
});
