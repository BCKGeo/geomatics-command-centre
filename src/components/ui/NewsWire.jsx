import { useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useFeeds } from "../../hooks/useFeeds.js";

const DEFAULT_LIMIT = 25;

// Relative age for the item line; absolute date on hover via title=.
function ageLabel(iso, now) {
  if (!iso) return "undated";
  const ms = now - new Date(iso).getTime();
  if (ms < 0) return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export function NewsWire() {
  const { B } = useTheme();
  const { feeds, error } = useFeeds();
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const now = Date.now();

  const items = useMemo(() => {
    if (!feeds) return [];
    const all = [];
    for (const s of feeds.sources) {
      if (filter !== "all" && s.id !== filter) continue;
      for (const it of s.items) all.push({ ...it, source: s });
    }
    // Newest first. Undated items sink to the bottom, and so do items dated in
    // the future (ACLS stamps event listings with the event date, not the
    // publish date), otherwise one conference notice would pin the top for a year.
    const horizon = now + 86400000;
    const t = (x) => {
      if (!x.date) return -Infinity;
      const ms = Date.parse(x.date);
      return ms > horizon ? -Infinity : ms;
    };
    all.sort((a, b) => t(b) - t(a));
    return all;
  }, [feeds, filter, now]);

  const visible = showAll ? items : items.slice(0, DEFAULT_LIMIT);
  const chip = (active) => ({
    padding: "3px 8px", fontSize: 10, fontWeight: active ? 700 : 500, fontFamily: B.font,
    color: active ? B.bg : B.textMid, background: active ? B.priBr : "transparent",
    border: `1px solid ${active ? B.priBr : B.border}`, borderRadius: 3, cursor: "pointer",
  });

  if (error) {
    return <div style={{ fontSize: 11, color: B.acc }}>News wire unavailable ({error}).</div>;
  }
  if (!feeds) {
    return <div style={{ fontSize: 11, color: B.textDim }}>Loading news wire...</div>;
  }

  const stale = feeds.sources.filter((s) => s.status === "stale");
  const down = feeds.sources.filter((s) => s.status === "unavailable");
  const generated = new Date(feeds.generatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        <button onClick={() => setFilter("all")} style={chip(filter === "all")}>All</button>
        {feeds.sources.map((s) => (
          <button key={s.id} onClick={() => setFilter(s.id)} style={chip(filter === s.id)}
            title={s.status === "fresh" ? s.name : `${s.name} (${s.status})`}>
            {s.short}{s.status !== "fresh" ? " \u26A0" : ""}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 2 }}>
        {visible.map((it) => (
          <a key={`${it.source.id}:${it.link}`} href={it.link} target="_blank" rel="noopener noreferrer" className="lnk"
            style={{ padding: "7px 10px", color: B.text, fontSize: 12, alignItems: "flex-start", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, lineHeight: 1.35 }}>{it.title}</div>
              {it.summary && <div style={{ fontSize: 10, color: B.textMid, marginTop: 2, lineHeight: 1.5 }}>{it.summary}</div>}
              <div style={{ fontSize: 10, color: B.textDim, marginTop: 3 }} title={it.date ? new Date(it.date).toLocaleString("en-CA") : undefined}>
                <span style={{ color: it.source.tier === "A" ? B.priBr : B.sec, fontWeight: 700 }}>{it.source.short}</span>
                {" \u00B7 "}{ageLabel(it.date, now)}
              </div>
            </div>
            <span style={{ color: B.textDim, fontSize: 11, flexShrink: 0 }}>{"\u2197"}</span>
          </a>
        ))}
        {visible.length === 0 && <div style={{ fontSize: 11, color: B.textDim, padding: 8 }}>Nothing from this source yet.</div>}
      </div>

      {items.length > DEFAULT_LIMIT && (
        <button onClick={() => setShowAll((v) => !v)}
          style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: B.pri, fontFamily: B.font, padding: 0 }}>
          {showAll ? "Show fewer" : `Show all ${items.length}`}
        </button>
      )}

      <div style={{ fontSize: 10, color: B.textDim, marginTop: 10, lineHeight: 1.6 }}>
        Bundled at build time, {generated}. Rebuilt daily.
        {stale.length > 0 && <> Stale (last fetch failed): {stale.map((s) => s.short).join(", ")}.</>}
        {down.length > 0 && <> Unavailable: {down.map((s) => s.short).join(", ")}.</>}
        {" "}Items link straight to the source. ABCLS, ALSA, NAV CANADA and ASPRS publish no feed.
      </div>
    </div>
  );
}
