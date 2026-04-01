import { useTheme } from "../../context/ThemeContext.jsx";
import { useLocation } from "../../context/LocationContext.jsx";
import { LinkCard } from "../ui/LinkCard.jsx";
import { SECTIONS } from "../../data/sections.js";
import { calcMagDec } from "../../lib/astronomy.js";

const DATUMS = [
  { name: "NAD83(CSRS)", frame: "ITRF2020 @ epoch", use: "Canada official", status: "current" },
  { name: "NAD83 (original)", frame: "Fixed North America", use: "Legacy GIS", status: "deprecated" },
  { name: "ITRF2020", frame: "Global realization", use: "GNSS / CSRS-PPP", status: "current" },
  { name: "WGS84 (G2296)", frame: "GPS broadcast", use: "Navigation", status: "current" },
];

const GEOID_MODELS = [
  { name: "CGG2013a", use: "CGVD2013 heights", note: "Standard in BC/AB" },
  { name: "CGG2023", use: "CGVD2013 (updated)", note: "CSRS-PPP v5 default" },
  { name: "HT2_2010v70", use: "CGVD28 \u2194 CGVD2013", note: "Legacy conversion" },
];

const PPP_TIPS = [
  "Submit dual-frequency RINEX for best results",
  "Min 1 hour static for sub-cm horizontal",
  "CSRS-PPP v5 supports Galileo PPP-AR",
  "Use NAD83(CSRS) epoch 2010.0 for consistency with provincial networks",
  "Kinematic mode needs \u22655 min initialization",
];

export function Geodesy() {
  const { B } = useTheme();
  const { lat, lon, cityName } = useLocation();
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  const mag = calcMagDec(lat, lon);

  return (
    <div>
      {/* Domain Context */}
      <div style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid ${B.priBr}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: B.priBr, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 4 }}>GEODESY &mdash; CANADIAN SPATIAL REFERENCE SYSTEM</div>
        <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>
          Canada's official geodetic framework is NAD83(CSRS) tied to ITRF via NRCan's CSRS-PPP service. Vertical datum is CGVD2013 (geoid-based). Magnetic declination computed from WMM2025. For GNSS surveys, always specify datum realization + epoch.
        </div>
      </div>

      {/* Quick Reference Row */}
      <div className="geo-ref" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Datum Table */}
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Datum Reference</h3>
          <div style={{ display: "grid", gap: 3 }}>
            {DATUMS.map(d => (
              <div key={d.name} style={{ ...insetStyle, padding: "5px 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: d.status === "current" ? B.priBr : B.textDim, fontFamily: B.font }}>{d.name}</span>
                  <span style={{ fontSize: 9, color: d.status === "current" ? "#22c55e" : "#ef4444", fontFamily: B.font }}>{d.status.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 10, color: B.textMid, marginTop: 1 }}>{d.frame} &mdash; {d.use}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Geoid Models */}
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Geoid Models</h3>
          <div style={{ display: "grid", gap: 3 }}>
            {GEOID_MODELS.map(g => (
              <div key={g.name} style={{ ...insetStyle, padding: "6px 8px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: B.pri, fontFamily: B.font }}>{g.name}</div>
                <div style={{ fontSize: 10, color: B.textMid }}>{g.use}</div>
                <div style={{ fontSize: 9, color: B.textDim, marginTop: 1 }}>{g.note}</div>
              </div>
            ))}
          </div>
          {/* Quick Mag Dec */}
          <div style={{ ...insetStyle, padding: "8px", marginTop: 8, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, letterSpacing: 1 }}>MAG DEC @ {cityName.split("(")[0].trim()}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b", fontFamily: B.font, marginTop: 2 }}>
              {Math.abs(mag.declination).toFixed(1)}{"\u00B0"} {mag.declination > 0 ? "E" : "W"}
            </div>
          </div>
        </div>

        {/* PPP Tips */}
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>CSRS-PPP Tips</h3>
          <div style={{ display: "grid", gap: 4 }}>
            {PPP_TIPS.map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 10, color: B.pri, fontWeight: 700, flexShrink: 0 }}>{"\u25B8"}</span>
                <span style={{ fontSize: 10, color: B.textMid, lineHeight: 1.4 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Link Sections */}
      <div className="geo-links" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {SECTIONS.filter(s => s.title.includes("NRCan") || s.title.includes("GNSS")).map(s => (
          <LinkCard key={s.title} section={s} />
        ))}
      </div>
    </div>
  );
}
