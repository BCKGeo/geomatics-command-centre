import { useState, lazy, Suspense } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { ProvIntel } from "../resources/ProvIntel.jsx";

const MunicipalMap = lazy(() => import("../ui/MunicipalMap.jsx").then(m => ({ default: m.MunicipalMap })));

const TABS = [
  { id: "prov", label: "Provincial Intel", icon: "\uD83C\uDFDB\uFE0F" },
  { id: "muni", label: "Municipal Map", icon: "\uD83D\uDDFA\uFE0F" },
];

export function Provincial() {
  const { B } = useTheme();
  const [tab, setTab] = useState("prov");
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  return (
    <div>
      <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? B.surface : "transparent",
              border: tab === t.id ? `2px solid ${B.borderHi}` : "2px solid transparent",
              borderTopColor: tab === t.id ? B.bvL : "transparent",
              borderLeftColor: tab === t.id ? B.bvL : "transparent",
              borderBottomColor: tab === t.id ? B.bvD : "transparent",
              borderRightColor: tab === t.id ? B.bvD : "transparent",
              padding: "8px 14px", color: tab === t.id ? B.text : B.textDim,
              fontSize: 11, fontWeight: tab === t.id ? 700 : 500, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, fontFamily: B.font,
              letterSpacing: ".06em", transition: "all .1s", whiteSpace: "nowrap",
            }}>
            <span style={{ fontSize: 11 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      <div style={{ ...cardStyle, maxWidth: tab === "muni" ? "none" : 720 }}>
        {tab === "prov" && <ProvIntel initialProv="bc" />}
        {tab === "muni" && (
          <Suspense fallback={<div style={{ color: B.textDim, fontSize: 12, padding: 16 }}>Loading map...</div>}>
            <MunicipalMap />
          </Suspense>
        )}
      </div>
    </div>
  );
}
