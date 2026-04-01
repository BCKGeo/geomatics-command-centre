import { useTheme } from "../../context/ThemeContext.jsx";
import { SECTIONS } from "../../data/sections.js";

export function Regs() {
  const { B } = useTheme();
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };

  return (
    <div style={{ ...cardStyle, maxWidth: 580 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span>{"\uD83D\uDCDC"}</span>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.sec }}>Regs & Standards</h3>
      </div>
      <div style={{ display: "grid", gap: 2 }}>
        {(SECTIONS.find(s => s.title === "Regs & Standards")?.links || []).map(l => (
          <a key={l.u} href={l.u} target="_blank" rel="noopener noreferrer" className="lnk"
            style={{ padding: "8px 12px", color: B.text, fontSize: 12 }}>
            <div><span>{l.n}</span>{l.d && <div style={{ fontSize: 10, color: B.textDim, marginTop: 1 }}>{l.d}</div>}</div><span style={{ color: B.textDim, fontSize: 11 }}>{"\u2192"}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
