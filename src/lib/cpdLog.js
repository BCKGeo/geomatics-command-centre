// CPD hour log. Pure functions, tested in cpdLog.test.js.
//
// The log lives in localStorage under STORAGE_KEY and nowhere else: no
// account, no sync, no analytics. Export is a CSV file built in the browser.
// The page says so in one sentence, and the Mission Brief privacy stance holds.

export const STORAGE_KEY = "bckgeo-cpd-log";

// Activity categories. These follow the activity types the professional bodies
// accept for CPD (courses, conferences, self-study, teaching, volunteering,
// technical training, research and writing); the bodies' own rules on what
// counts, and how many hours, are theirs, not this list's.
export const CATEGORIES = [
  "Course or workshop",
  "Conference or seminar",
  "Self-directed study",
  "Teaching or presenting",
  "Volunteering or committee",
  "Technical training",
  "Research or writing",
  "Other",
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Validate a draft entry. Returns an array of problems; empty means valid.
export function validateEntry(e) {
  const out = [];
  if (!e || typeof e !== "object") return ["No entry"];
  if (!ISO_DATE.test(e.date || "") || Number.isNaN(Date.parse(e.date))) out.push("Date must be YYYY-MM-DD");
  if (!String(e.activity || "").trim()) out.push("Activity is required");
  if (!CATEGORIES.includes(e.category)) out.push("Pick a category");
  const h = Number(e.hours);
  if (!Number.isFinite(h) || h <= 0 || h > 24) out.push("Hours must be between 0 and 24");
  return out;
}

// Add an entry to a log. Returns a new array (the input is not mutated),
// newest date first, ties kept in insertion order (newest added first).
// Throws on an invalid entry so the caller cannot store junk.
export function addEntry(log, draft, now = Date.now()) {
  const problems = validateEntry(draft);
  if (problems.length) throw new Error(problems.join("; "));
  const entry = {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    date: draft.date,
    activity: String(draft.activity).trim(),
    category: draft.category,
    hours: Math.round(Number(draft.hours) * 4) / 4, // quarter hours
    note: String(draft.note || "").trim(),
  };
  return sortLog([entry, ...(log || [])]);
}

export function removeEntry(log, id) {
  return (log || []).filter((e) => e.id !== id);
}

export function sortLog(log) {
  return [...(log || [])].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function sum(entries) {
  return Math.round(entries.reduce((a, e) => a + (Number(e.hours) || 0), 0) * 100) / 100;
}

export function totalHours(log) {
  return sum(log || []);
}

// Hours per category, in CATEGORIES order, categories with no hours left out.
export function totalsByCategory(log) {
  const map = new Map();
  for (const e of log || []) map.set(e.category, (map.get(e.category) || 0) + (Number(e.hours) || 0));
  return CATEGORIES.filter((c) => map.has(c)).map((c) => ({ category: c, hours: Math.round(map.get(c) * 100) / 100 }));
}

// Hours per calendar year, newest year first.
export function totalsByYear(log) {
  const map = new Map();
  for (const e of log || []) {
    const y = String(e.date || "").slice(0, 4);
    if (!/^\d{4}$/.test(y)) continue;
    map.set(y, (map.get(y) || 0) + (Number(e.hours) || 0));
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([year, h]) => ({ year, hours: Math.round(h * 100) / 100 }));
}

// Hours in a reporting cycle, for bodies whose CPD year is not the calendar
// year (ASTTBC runs 1 June to 31 May). start and end are YYYY-MM-DD, inclusive.
export function hoursBetween(log, start, end) {
  return sum((log || []).filter((e) => e.date >= start && e.date <= end));
}

// RFC 4180 style: fields with a comma, quote, CR or LF are quoted, quotes doubled.
export function csvField(v) {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const CSV_HEADER = ["date", "activity", "category", "hours", "note"];

export function toCSV(log) {
  const rows = [CSV_HEADER.join(",")];
  for (const e of sortLog(log)) rows.push([e.date, e.activity, e.category, e.hours, e.note].map(csvField).join(","));
  return rows.join("\r\n") + "\r\n";
}

// Storage. Both swallow errors (private mode, quota, blocked storage) so the
// page still renders; the caller shows an empty log in that case.
export function loadLog(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortLog(parsed.filter((e) => e && typeof e === "object" && e.id && ISO_DATE.test(e.date || "")));
  } catch {
    return [];
  }
}

export function saveLog(log, storage = globalThis.localStorage) {
  try {
    if (!log || log.length === 0) storage?.removeItem(STORAGE_KEY);
    else storage?.setItem(STORAGE_KEY, JSON.stringify(log));
    return true;
  } catch {
    return false;
  }
}

export function todayISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
