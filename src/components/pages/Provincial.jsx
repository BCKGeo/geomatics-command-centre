import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { ProvIntel } from "../resources/ProvIntel.jsx";
import { PROVINCES } from "../../data/jurisdictions/index.js";
import { JURISDICTION_TABS as TABS } from "../../data/nav.js";

const MunicipalMap = lazy(() => import("../ui/MunicipalMap.jsx").then(m => ({ default: m.MunicipalMap })));


export function Provincial() {
  const { B } = useTheme();
  const location = useLocation();
  const [tab, setTab] = useState("prov");
  const [prov, setProv] = useState("bc");
  const [mapLoaded, setMapLoaded] = useState(false);

  // The quick lookup lands on /jurisdictions#muni (the map) or
  // /jurisdictions#<province id>. Follow it on every navigation.
  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (id === "muni") setTab("muni");
    else if (PROVINCES.some(p => p.id === id)) { setProv(id); setTab("prov"); }
  }, [location]);
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };

  // Trigger lazy load on first visit to map tab, then keep it mounted
  if (tab === "muni" && !mapLoaded) setMapLoaded(true);

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
      {/* Provincial Intel */}
      <div style={{ ...cardStyle, maxWidth: 720, display: tab === "prov" ? "block" : "none" }}>
        <ProvIntel key={prov} initialProv={prov} />
      </div>
      {/* Municipal Map -- kept mounted after first load to preserve MapLibre state */}
      {mapLoaded && (
        <div style={{ ...cardStyle, maxWidth: "none", display: tab === "muni" ? "block" : "none" }}>
          <Suspense fallback={<div style={{ color: B.textDim, fontSize: 12, padding: 16 }}>Loading map...</div>}>
            <MunicipalMap />
          </Suspense>
        </div>
      )}
    </div>
  );
}
