import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { SECTIONS } from "../../data/sections.js";

const CATEGORIES = [
  { label: "Professional Bodies", filter: ["ASTTBC", "ABCLS", "ACLS", "CIG", "ASPRS"] },
  { label: "Industry & Education", filter: ["GoGeomatics", "ACEC-BC", "TAC"] },
  { label: "Standards & Specifications", filter: ["CSA Group"] },
];

export function Regs() {
  const { B } = useTheme();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState({});
  const allLinks = SECTIONS.find(s => s.title === "Regs & Standards")?.links || [];

  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  const filtered = query
    ? allLinks.filter(l => `${l.n} ${l.d}`.toLowerCase().includes(query.toLowerCase()))
    : null;

  const toggle = (cat) => setExpanded(p => ({ ...p, [cat]: !p[cat] }));

  const renderLink = (l) => (
    <a key={l.u} href={l.u} target="_blank" rel="noopener noreferrer" className="lnk" style={{ padding: "8px 12px", color: B.text, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <span style={{ fontWeight: 600 }}>{l.n}</span>
        {l.d && <div style={{ fontSize: 10, color: B.textDim, marginTop: 2 }}>{l.d}</div>}
      </div>
      <span style={{ color: B.textDim, fontSize: 11, flexShrink: 0, marginLeft: 8 }}>{"\u2192"}</span>
    </a>
  );

  return (
    <div>
      {/* Domain Context */}
      <div style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid ${B.pri}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: B.pri, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 4 }}>REGS & STANDARDS {"\u2014"} PROFESSIONAL PRACTICE</div>
        <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>
          Canadian geomatics regulatory bodies, professional associations, and standards organizations. Provincial survey legislation varies by jurisdiction. Always verify current requirements with the relevant authority.
        </div>
      </div>

      {/* Search */}
      <div style={{ ...cardStyle, marginBottom: 12, padding: 12 }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search organizations and standards..."
          style={{ width: "100%", background: B.bg, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "8px 12px", color: B.text, fontSize: 12, fontFamily: B.font, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Search Results */}
      {filtered ? (
        <div style={cardStyle}>
          <div style={{ fontSize: 10, color: B.textDim, marginBottom: 8, fontFamily: B.font }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>
          <div style={{ display: "grid", gap: 2 }}>{filtered.map(renderLink)}</div>
          {filtered.length === 0 && <div style={{ fontSize: 11, color: B.textDim, padding: 12, textAlign: "center" }}>No matches found</div>}
        </div>
      ) : (
        /* Categorized Sections */
        <div style={{ display: "grid", gap: 12 }}>
          {CATEGORIES.map(cat => {
            const links = allLinks.filter(l => cat.filter.includes(l.n));
            const isOpen = expanded[cat.label] !== false; // default open
            return (
              <div key={cat.label} style={cardStyle}>
                <button onClick={() => toggle(cat.label)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", color: B.text }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: B.sec, fontFamily: B.font, letterSpacing: ".04em" }}>{cat.label.toUpperCase()}</span>
                    <span style={{ fontSize: 10, color: B.textDim }}>({links.length})</span>
                  </div>
                  <span style={{ fontSize: 11, color: B.textDim, transition: "transform .15s", transform: isOpen ? "rotate(90deg)" : "rotate(0)" }}>{"\u25B6"}</span>
                </button>
                {isOpen && (
                  <div style={{ display: "grid", gap: 2, marginTop: 10 }}>{links.map(renderLink)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
