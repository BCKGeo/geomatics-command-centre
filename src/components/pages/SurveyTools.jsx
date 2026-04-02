import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useLocation } from "../../context/LocationContext.jsx";
import { CoordConverter } from "../field/CoordConverter.jsx";
import { ScaleCalc } from "../field/ScaleCalc.jsx";
import { MagPanel } from "../field/MagPanel.jsx";
import { CalcPanel } from "../field/CalcPanel.jsx";
import { InverseCalc } from "../field/InverseCalc.jsx";
import { ForwardCalc } from "../field/ForwardCalc.jsx";
import { AreaCalc } from "../field/AreaCalc.jsx";
import { PhotoScale } from "../field/PhotoScale.jsx";
import { CurveCalc } from "../field/CurveCalc.jsx";
import { IntersectCalc } from "../field/IntersectCalc.jsx";

const TABS = [
  { id: "coords", label: "Coordinates", icon: "\uD83D\uDCE1" },
  { id: "inverse", label: "Inverse", icon: "\uD83D\uDCCD" },
  { id: "forward", label: "Forward", icon: "\u27A1\uFE0F" },
  { id: "scale", label: "Scale Factors", icon: "\uD83D\uDCCF" },
  { id: "area", label: "Area", icon: "\u2B1B" },
  { id: "intersect", label: "Intersections", icon: "\u2716\uFE0F" },
  { id: "curves", label: "Curves", icon: "\u27B0" },
  { id: "photo", label: "Photo Scale", icon: "\uD83D\uDCF7" },
  { id: "mag", label: "Mag Dec", icon: "\uD83E\uDDED" },
  { id: "units", label: "Units", icon: "\u2696\uFE0F" },
];

export function SurveyTools() {
  const { B } = useTheme();
  const { lat, lon } = useLocation();
  const [tab, setTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return TABS.find(t => t.id === hash)?.id || "coords";
  });

  useEffect(() => {
    window.location.hash = tab;
  }, [tab]);

  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };

  const renderTab = () => {
    switch (tab) {
      case "coords": return <CoordConverter initialLat={lat} initialLon={lon} />;
      case "scale": return <ScaleCalc initialLat={lat} initialLon={lon} />;
      case "mag": return <MagPanel initialLat={lat} initialLon={lon} />;
      case "units": return <CalcPanel />;
      case "inverse": return <InverseCalc />;
      case "forward": return <ForwardCalc />;
      case "area": return <AreaCalc />;
      case "photo": return <PhotoScale />;
      case "curves": return <CurveCalc />;
      case "intersect": return <IntersectCalc />;
      default: return null;
    }
  };

  return (
      <div>
        <div className="survey-tabs" role="tablist" style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 12 }}>
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
        <div role="tabpanel" style={cardStyle}>
          {renderTab()}
        </div>
        <div style={{ background: "#3b82f610", border: "1px solid #3b82f620", borderRadius: 5, padding: "6px 8px", fontSize: 10, color: B.textDim, lineHeight: 1.5, marginTop: 12 }}>
          Reference tool only {"\u2014"} not for legal survey or navigation use. For official work, use{" "}
          <a href="https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/trx.php" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>NRCan TRX</a>
          {" "}and{" "}
          <a href="https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/gpsh.php" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>GPS{"\u00B7"}H</a>.
          {" "}Projections computed on NAD83(CSRS), GRS80 ellipsoid. Heights reference CGVD2013.
        </div>
      </div>
  );
}
