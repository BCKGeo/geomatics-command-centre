import { useTheme } from "../../context/ThemeContext.jsx";

export function LinkCard({ section }) {
  const { B } = useTheme();
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>{section.icon}</span>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: section.color }}>{section.title}</h3>
      </div>
      <div style={{ display: "grid", gap: 2 }}>
        {section.links.map(l => (
          <a key={l.u} href={l.u} target="_blank" rel="noopener noreferrer" className="lnk-card"
            style={{ padding: "6px 9px", fontSize: 12, color: B.text }}>
            <div><span>{l.n}</span>{l.d && <div style={{ fontSize: 10, color: B.textDim, marginTop: 1 }}>{l.d}</div>}</div>
            <span style={{ color: B.textDim, fontSize: 11 }}>{"\u2192"}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
