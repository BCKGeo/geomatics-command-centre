import { useState, useRef } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { GLOSSARY } from "../../data/glossary.js";

const SECTIONS = Object.keys(GLOSSARY);
const ALL_TERMS = SECTIONS.flatMap(s => GLOSSARY[s].map(t => ({ ...t, section: s })));
const LETTERS = [...new Set(ALL_TERMS.map(t => t.dt[0].toUpperCase()))].sort();

export function Codex() {
  const { B } = useTheme();
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const scrollRef = useRef(null);

  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  const filtered = ALL_TERMS.filter(t => {
    if (catFilter !== "All" && t.section !== catFilter) return false;
    if (query && !`${t.dt} ${t.dd}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const scrollToLetter = (letter) => {
    const el = document.getElementById(`codex-${letter}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Group filtered terms by first letter for display
  const grouped = {};
  filtered.forEach(t => {
    const letter = t.dt[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(t);
  });

  const btnBase = { background: "none", border: `1px solid ${B.border}`, padding: "4px 10px", fontSize: 10, fontFamily: B.font, cursor: "pointer", color: B.textDim, transition: "all .1s" };
  const btnActive = { ...btnBase, background: B.pri, color: "#fff", borderColor: B.pri, fontWeight: 700 };

  return (
    <div>
      {/* Domain Context */}
      <div style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid ${B.gold}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: B.gold, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 4 }}>CODEX {"\u2014"} GEOMATICS GLOSSARY</div>
        <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>
          Terminology reference for surveying, GNSS, remote sensing, GIS, and RPAS operations. {ALL_TERMS.length} terms across {SECTIONS.length} disciplines.
        </div>
      </div>

      {/* Search */}
      <div style={{ ...cardStyle, marginBottom: 12, padding: 12 }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search terms and definitions..."
          style={{ width: "100%", background: B.bg, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "8px 12px", color: B.text, fontSize: 12, fontFamily: B.font, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Category Filter */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        {["All", ...SECTIONS].map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)} style={catFilter === cat ? btnActive : btnBase}>{cat}</button>
        ))}
      </div>

      {/* Alphabet Nav */}
      {!query && (
        <div className="codex-alpha" style={{ display: "flex", gap: 2, marginBottom: 12, flexWrap: "wrap" }}>
          {LETTERS.map(letter => {
            const hasMatch = grouped[letter]?.length > 0;
            return (
              <button key={letter} onClick={() => hasMatch && scrollToLetter(letter)}
                style={{ ...btnBase, padding: "4px 7px", minWidth: 26, textAlign: "center", opacity: hasMatch ? 1 : 0.3, cursor: hasMatch ? "pointer" : "default", fontWeight: 700, fontSize: 11 }}>
                {letter}
              </button>
            );
          })}
        </div>
      )}

      {/* Terms */}
      <div ref={scrollRef}>
        {filtered.length === 0 && (
          <div style={{ ...cardStyle, textAlign: "center", color: B.textDim, fontSize: 11, padding: 24 }}>No matching terms found</div>
        )}
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([letter, terms]) => (
          <div key={letter} id={`codex-${letter}`} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: B.display, fontSize: 16, fontWeight: 900, color: B.pri, padding: "4px 0", marginBottom: 6, borderBottom: `2px solid ${B.border}` }}>{letter}</div>
            <div className="codex-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 4 }}>
              {terms.map(t => (
                <div key={t.dt} style={{ ...insetStyle, padding: "8px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: B.text, fontFamily: B.font }}>{t.dt}</span>
                    <span style={{ fontSize: 8, color: B.textDim, background: B.surface, padding: "1px 6px", borderRadius: 2, fontFamily: B.font, letterSpacing: ".04em" }}>{t.section}</span>
                  </div>
                  <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>{t.dd}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
