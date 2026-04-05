import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { PROVINCES } from "../../data/jurisdictions/index.js";

export function ProvIntel({ initialProv = "bc" }) {
  const { B } = useTheme();
  const [prov, setProv] = useState(initialProv);
  const data = PROVINCES.find(p => p.id === prov);
  return (
    <div>
      <div className="prov-btns" style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
        {PROVINCES.map(p => (
          <button key={p.id} onClick={(e) => { setProv(p.id); e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }}
            style={{
              padding: "4px 10px", fontSize: 11, fontWeight: prov === p.id ? 700 : 400,
              fontFamily: B.font, color: prov === p.id ? B.bg : B.textMid,
              background: prov === p.id ? B.priBr : "transparent",
              border: `1px solid ${prov === p.id ? B.priBr : B.border}`,
              borderRadius: 3, cursor: "pointer", whiteSpace: "nowrap"
            }}>
            {p.abbr}
          </button>
        ))}
      </div>
      <h3 style={{ fontFamily: B.font, fontSize: 13, fontWeight: 700, color: B.text, margin: "0 0 10px" }}>{data.name}</h3>
      {data.categories.map(cat => (
        <div key={cat.category} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: B.textDim, fontFamily: B.font, padding: "4px 0", borderBottom: `1px solid ${B.border}`, marginBottom: 4 }}>
            {cat.category.toUpperCase()}
          </div>
          {cat.links.map(l => (
            <a key={l.u} href={l.u} target="_blank" rel="noopener noreferrer" className="lnk"
              style={{ padding: "6px 10px", color: B.text, fontSize: 12 }}>
              <div>
                <span>{l.n}</span>
                {l.paid && <span style={{ fontSize: 9, color: B.gold, marginLeft: 6 }}>{"\uD83D\uDCB2"}</span>}
                {l.d && <div style={{ fontSize: 10, color: B.textDim, marginTop: 1 }}>{l.d}</div>}
              </div>
              <span style={{ color: B.textDim, fontSize: 11 }}>{"\u2192"}</span>
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}
