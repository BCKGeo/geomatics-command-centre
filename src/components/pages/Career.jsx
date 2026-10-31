import { useEffect, useMemo, useState } from "react";
import { Link, useLocation as useRouterLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { NewsWire } from "../ui/NewsWire.jsx";
import { CAREER_SECTIONS } from "../../data/nav.js";
import { SOURCES, PATHWAYS, READING, surveyorBodies, surveyActs } from "../../data/career.js";
import { PROVINCES } from "../../data/jurisdictions/index.js";
import {
  CATEGORIES, validateEntry, addEntry, removeEntry, totalHours, totalsByCategory, totalsByYear,
  toCSV, loadLog, saveLog, todayISO,
} from "../../lib/cpdLog.js";

const BODIES = surveyorBodies(PROVINCES);
const ACTS = surveyActs(PROVINCES);

const fmtH = (h) => (Number.isInteger(h) ? String(h) : h.toFixed(2).replace(/0$/, ""));

function SectionHead({ B, icon, title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span>{icon}</span>
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: B.priBr }}>{title}</h2>
      {right && <span style={{ marginLeft: "auto", fontSize: 10, color: B.textDim }}>{right}</span>}
    </div>
  );
}

// Career area (direction record item 3): CPD hour log kept in the browser,
// certification pathways cited to the certifying bodies, primary reading list,
// and the News Wire (moved here from Mission Brief). Sections are addressed
// as /career#id so the quick lookup can land on each one.
export function Career() {
  const { B } = useTheme();
  const routerLocation = useRouterLocation();

  useEffect(() => {
    const id = routerLocation.hash.replace("#", "");
    if (!id) return;
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    const t1 = setTimeout(go, 50), t2 = setTimeout(go, 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [routerLocation.hash]);

  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };
  const label = { fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 2 };
  const sub = { fontSize: 11, color: B.textMid, lineHeight: 1.6 };
  const chip = { ...insetStyle, padding: "3px 7px", fontSize: 10, fontFamily: B.font, fontWeight: 700, color: B.priBr, textDecoration: "none" };

  return (
    <div style={{ maxWidth: 1100, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Section index */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
        <span style={label}>CAREER</span>
        {CAREER_SECTIONS.map((s) => (
          <Link key={s.id} to={`/career#${s.id}`} style={chip}>{s.label}</Link>
        ))}
      </div>

      <CpdLog B={B} cardStyle={cardStyle} insetStyle={insetStyle} label={label} sub={sub} />

      {/* Certification pathways */}
      <div id="pathways" style={{ ...cardStyle, scrollMarginTop: 80 }}>
        <SectionHead B={B} icon={"\uD83C\uDF93"} title="Certification Pathways" right="each step cited to the certifying body" />
        <div style={{ ...sub, marginBottom: 12 }}>
          The steps as the bodies publish them, read on the date shown. A step marked <b style={{ color: B.gold }}>unverified</b> is one the body&apos;s page did not state. Rules change: confirm with the body before you apply.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          {PATHWAYS.map((p) => (
            <div key={p.id} id={p.id} style={{ ...insetStyle, padding: 12, scrollMarginTop: 80 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: B.display, fontSize: 18, fontWeight: 800, color: B.text }}>{p.title}</span>
                <span style={{ fontSize: 11, color: B.textMid }}>{p.full}</span>
              </div>
              <div style={{ fontSize: 10, color: B.textDim, marginBottom: 8 }}>
                <a href={p.home} target="_blank" rel="noopener noreferrer" style={{ color: B.pri, textDecoration: "none", fontWeight: 600 }}>{p.body}</a>
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                {p.steps.map((s) => {
                  const src = s.cite ? SOURCES[s.cite] : null;
                  return (
                    <li key={s.t} style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>
                      <b style={{ color: B.text }}>{s.t}.</b> {s.d}{" "}
                      {src
                        ? <a href={src.u} target="_blank" rel="noopener noreferrer" title={`${src.n}, read ${src.read}`} style={{ color: B.textDim, fontSize: 10, textDecoration: "none", whiteSpace: "nowrap" }}>[source, read {src.read}]</a>
                        : <span style={{ color: B.gold, fontSize: 10, fontWeight: 700 }}>[unverified]</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>

        <div style={{ ...label, marginTop: 14, marginBottom: 6 }}>LAND SURVEYOR REGULATOR BY JURISDICTION</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {BODIES.map((b) => (
            <a key={b.u} href={b.u} target="_blank" rel="noopener noreferrer" title={`${b.provinces.join(", ")}: ${b.d}`} style={chip}>{b.abbrs.join(" ")} {b.n}</a>
          ))}
        </div>
        <div style={{ fontSize: 10, color: B.textDim, marginTop: 6, lineHeight: 1.5 }}>
          Links only. Each body sets its own articling, exam and CPD rules; the Jurisdictions page has the rest of each province&apos;s links.
        </div>

        <div style={{ fontSize: 9, color: B.textDim, marginTop: 10, lineHeight: 1.6 }}>
          Sources: {Object.values(SOURCES).map((s, i) => (
            <span key={s.u}>{i > 0 && " \u00B7 "}<a href={s.u} target="_blank" rel="noopener noreferrer" style={{ color: B.textMid }}>{s.n}</a> (read {s.read})</span>
          ))}.
        </div>
      </div>

      {/* Reading list */}
      <div id="reading" style={{ ...cardStyle, scrollMarginTop: 80 }}>
        <SectionHead B={B} icon={"\uD83D\uDCDA"} title="Reading List" right="primary references only" />
        <div style={{ ...sub, marginBottom: 8 }}>The standards, regulations and statutes themselves. No summaries, no blogs.</div>
        <div style={{ display: "grid", gap: 2 }}>
          {READING.map((r) => (
            <a key={r.u} href={r.u} target="_blank" rel="noopener noreferrer" className="lnk" style={{ padding: "8px 12px", color: B.text, fontSize: 12, alignItems: "flex-start", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{r.n}</div>
                <div style={{ fontSize: 10, color: B.textMid, marginTop: 2, lineHeight: 1.5 }}>{r.d}</div>
                <div style={{ fontSize: 10, color: B.textDim, marginTop: 2 }}><span style={{ color: B.priBr, fontWeight: 700 }}>{r.by}</span> {"\u00B7"} read {r.read}</div>
              </div>
              <span style={{ color: B.textDim, fontSize: 11, flexShrink: 0 }}>{"\u2197"}</span>
            </a>
          ))}
        </div>
        <div style={{ ...label, marginTop: 12, marginBottom: 6 }}>SURVEY ACTS BY JURISDICTION</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {ACTS.map((a) => (
            <a key={`${a.id}:${a.u}`} href={a.u} target="_blank" rel="noopener noreferrer" title={`${a.province}: ${a.n} (${a.d})`} style={chip}>{a.abbr} {a.n}</a>
          ))}
        </div>
      </div>

      {/* News wire */}
      <div id="news" style={{ ...cardStyle, scrollMarginTop: 80 }}>
        <SectionHead B={B} icon={"\uD83D\uDCF0"} title="News Wire" />
        <div style={{ ...sub, marginBottom: 10 }}>
          Transport Canada, NRCan, BC Water, Land and Resource Stewardship, LTSA, ACLS, ASTTBC and GoGeomatics. Newest first.
        </div>
        <NewsWire />
      </div>
    </div>
  );
}

// The CPD log. State is the array from lib/cpdLog.js; every change is saved
// back to localStorage and nowhere else.
function CpdLog({ B, cardStyle, insetStyle, label, sub }) {
  const [log, setLog] = useState(() => loadLog());
  const [draft, setDraft] = useState(() => ({ date: todayISO(), activity: "", category: CATEGORIES[0], hours: "1", note: "" }));
  const [problems, setProblems] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [storageWarn, setStorageWarn] = useState(false);

  const persist = (next) => {
    setLog(next);
    if (!saveLog(next)) setStorageWarn(true);
  };

  const byCat = useMemo(() => totalsByCategory(log), [log]);
  const byYear = useMemo(() => totalsByYear(log), [log]);
  const total = totalHours(log);

  const onAdd = (e) => {
    e.preventDefault();
    const p = validateEntry(draft);
    setProblems(p);
    if (p.length) return;
    persist(addEntry(log, draft));
    setDraft((d) => ({ ...d, activity: "", hours: "1", note: "" }));
  };

  const onExport = () => {
    const blob = new Blob([toCSV(log)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cpd-log-${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const field = { ...insetStyle, padding: "6px 8px", fontSize: 12, fontFamily: B.sans, color: B.text, background: B.inset, outline: "none", width: "100%", boxSizing: "border-box", minHeight: 34 };
  const btn = (primary) => ({
    padding: "7px 12px", fontSize: 11, fontFamily: B.font, fontWeight: 700, cursor: "pointer", minHeight: 34,
    background: primary ? B.pri : "transparent", color: primary ? "#fff" : B.textMid,
    border: `2px solid ${primary ? B.pri : B.border}`, borderRadius: 0,
  });
  const disabled = (on) => ({ ...btn(false), opacity: on ? 0.5 : 1, cursor: on ? "default" : "pointer" });
  const fieldLabel = { ...label, letterSpacing: 1, fontSize: 9, marginBottom: 3, display: "block" };
  const empty = log.length === 0;

  return (
    <div id="cpd" style={{ ...cardStyle, scrollMarginTop: 80 }}>
      <SectionHead B={B} icon={"\uD83D\uDD52"} title="CPD Hour Log" right={empty ? null : `${log.length} ${log.length === 1 ? "entry" : "entries"}`} />
      <div style={{ ...sub, marginBottom: 12 }}>
        Kept only in this browser&apos;s local storage: it never leaves your device, and clearing site data or using another browser starts an empty log, so export the CSV before you report.
      </div>

      <div className="cmd-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", gap: 12, alignItems: "start" }}>
        {/* Entry form */}
        <form onSubmit={onAdd} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
          <div>
            <label htmlFor="cpd-date" style={fieldLabel}>DATE</label>
            <input id="cpd-date" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} style={field} required />
          </div>
          <div>
            <label htmlFor="cpd-hours" style={fieldLabel}>HOURS</label>
            <input id="cpd-hours" type="number" inputMode="decimal" min="0.25" max="24" step="0.25" value={draft.hours} onChange={(e) => setDraft({ ...draft, hours: e.target.value })} style={field} required />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="cpd-activity" style={fieldLabel}>ACTIVITY</label>
            <input id="cpd-activity" type="text" value={draft.activity} onChange={(e) => setDraft({ ...draft, activity: e.target.value })} placeholder="GNSS workshop, ASTTBC webinar, reading Part IX" style={field} maxLength={200} required />
          </div>
          <div>
            <label htmlFor="cpd-category" style={fieldLabel}>CATEGORY</label>
            <select id="cpd-category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} style={field}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cpd-note" style={fieldLabel}>NOTE</label>
            <input id="cpd-note" type="text" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="provider, certificate number" style={field} maxLength={300} />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button type="submit" style={btn(true)}>Add entry</button>
            <button type="button" onClick={onExport} disabled={empty} style={disabled(empty)}>Export CSV</button>
            {!confirmClear
              ? <button type="button" onClick={() => setConfirmClear(true)} disabled={empty} style={disabled(empty)}>Clear all</button>
              : <span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", fontSize: 11, color: B.acc }}>
                  Delete all {log.length} entries? Export first if you need them.
                  <button type="button" onClick={() => { persist([]); setConfirmClear(false); }} style={{ ...btn(false), color: B.acc, borderColor: B.acc }}>Yes, clear</button>
                  <button type="button" onClick={() => setConfirmClear(false)} style={btn(false)}>Keep</button>
                </span>}
            {problems.length > 0 && <span style={{ fontSize: 11, color: B.acc }}>{problems.join(". ")}.</span>}
            {storageWarn && <span style={{ fontSize: 11, color: B.gold }}>This browser refused to store the log (private window or storage blocked). Entries last until you leave the page.</span>}
          </div>
        </form>

        {/* Totals */}
        <div style={{ ...insetStyle, padding: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: B.display, fontSize: 26, fontWeight: 800, color: B.gold, lineHeight: 1 }}>{fmtH(total)}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: B.textMid }}>hours logged</span>
          </div>
          {empty ? (
            <div style={{ fontSize: 11, color: B.textDim, marginTop: 8, lineHeight: 1.5 }}>No entries yet. Add one with the form; totals per year and category appear here.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
              <div>
                <div style={{ ...label, letterSpacing: 1, fontSize: 9, marginBottom: 4 }}>BY YEAR</div>
                {byYear.map((y) => (
                  <div key={y.year} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: B.textMid, padding: "2px 0" }}>
                    <span>{y.year}</span><b style={{ color: B.text, fontVariantNumeric: "tabular-nums" }}>{fmtH(y.hours)}</b>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ ...label, letterSpacing: 1, fontSize: 9, marginBottom: 4 }}>BY CATEGORY</div>
                {byCat.map((c) => (
                  <div key={c.category} style={{ display: "flex", justifyContent: "space-between", gap: 6, fontSize: 11, color: B.textMid, padding: "2px 0" }}>
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.category}</span><b style={{ color: B.text, fontVariantNumeric: "tabular-nums" }}>{fmtH(c.hours)}</b>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: 9, color: B.textDim, marginTop: 8, lineHeight: 1.5 }}>
            Years are calendar years. ASTTBC&apos;s CPD cycle runs 1 June to 31 May, 12 hours per cycle (ASTTBC CPD page, read 2026-10-31); other bodies set their own.
          </div>
        </div>
      </div>

      {/* Entries */}
      {!empty && (
        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, color: B.textMid, minWidth: 520 }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                {["Date", "Activity", "Category", "Hours", "Note", ""].map((h, i) => (
                  <th key={i} style={{ ...label, letterSpacing: 1, fontSize: 9, fontWeight: 400, padding: "4px 6px", borderBottom: `1px solid ${B.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map((e) => (
                <tr key={e.id} className="codex-row">
                  <td style={{ padding: "5px 6px", whiteSpace: "nowrap", fontFamily: B.font, color: B.text }}>{e.date}</td>
                  <td style={{ padding: "5px 6px", color: B.text, fontWeight: 600 }}>{e.activity}</td>
                  <td style={{ padding: "5px 6px" }}>{e.category}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: B.text }}>{fmtH(e.hours)}</td>
                  <td style={{ padding: "5px 6px" }}>{e.note}</td>
                  <td style={{ padding: "5px 6px", textAlign: "right" }}>
                    <button type="button" onClick={() => persist(removeEntry(log, e.id))} title="Delete this entry" aria-label={`Delete ${e.activity} on ${e.date}`}
                      style={{ background: "none", border: "none", cursor: "pointer", color: B.textDim, fontSize: 12, padding: "2px 4px" }}>{"\u2715"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
