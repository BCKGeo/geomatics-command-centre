import { useTheme } from "../../context/ThemeContext.jsx";
import { GLOSSARY } from "../../data/glossary.js";

export function Codex() {
  const { B } = useTheme();
  return (
    <div>
      {Object.entries(GLOSSARY).map(([section, terms]) => (
        <div key={section} style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: B.font, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", padding: "6px 12px", marginBottom: 8, borderBottom: `2px solid ${B.border}` }}>{section}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "4px 16px" }}>
            {terms.map(t => (
              <dl key={t.dt} className="codex-row" style={{ display: "flex", gap: 10, padding: "6px 12px", fontSize: 11 }}>
                <dt style={{ fontFamily: B.font, fontWeight: 700, color: B.text, whiteSpace: "nowrap", minWidth: 110, flexShrink: 0 }}>{t.dt}</dt>
                <dd style={{ color: B.textMid, lineHeight: 1.4, margin: 0 }}>{t.dd}</dd>
              </dl>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
