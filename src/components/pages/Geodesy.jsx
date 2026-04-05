import { useTheme } from "../../context/ThemeContext.jsx";
import { useLocation } from "../../context/LocationContext.jsx";
import { LinkCard } from "../ui/LinkCard.jsx";
import { SECTIONS } from "../../data/sections.js";
import { calcMagDec } from "../../lib/astronomy.js";

const DATUMS = [
  { name: "NAD83(CSRS) v8", frame: "ITRF2020 @ epoch", use: "Canada official (current)", epoch: "2010.0", status: "current" },
  { name: "NAD83(CSRS) v7", frame: "ITRF2014 @ epoch", use: "CSRS-PPP v4 output", epoch: "2010.0", status: "current" },
  { name: "NAD83 (original)", frame: "Fixed North America", use: "Legacy GIS layers", epoch: "N/A", status: "deprecated" },
  { name: "ITRF2020", frame: "Global realization", use: "GNSS / CSRS-PPP raw", epoch: "2015.0", status: "current" },
  { name: "WGS84 (G2296)", frame: "GPS broadcast", use: "Navigation / handheld GPS", epoch: "2024.0", status: "current" },
];

const GEOID_MODELS = [
  { name: "CGG2013a", use: "CGVD2013 heights", note: "Standard in BC/AB, used by most provincial networks" },
  { name: "CGG2023", use: "CGVD2013 (updated)", note: "CSRS-PPP v5 default, improved Arctic coverage" },
  { name: "HT2_2010v70", use: "CGVD28 \u2194 CGVD2013", note: "Legacy height conversion only" },
];

const PPP_TIPS = {
  "Data Preparation": [
    "Submit dual-frequency RINEX for best results",
    "Minimum 1 hour static observation for sub-cm horizontal",
    "Kinematic mode needs \u22655 min initialization before movement",
    "Include antenna type and height in RINEX header",
  ],
  "Processing": [
    "CSRS-PPP v5 supports Galileo PPP-AR for faster convergence",
    "Use NAD83(CSRS) epoch 2010.0 for consistency with provincial networks",
    "Request both NAD83(CSRS) and ITRF output for comparison",
  ],
  "Results": [
    "Check residuals \u2014 outliers indicate multipath or obstruction",
    "Orthometric height (H) = ellipsoidal (h) minus geoid (N)",
    "Repeat observations on different days for reliability",
  ],
};

export function Geodesy() {
  const { B } = useTheme();
  const { lat, lon, cityName } = useLocation();
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  const mag = calcMagDec(lat, lon);

  return (
    <div>
      {/* Domain Context */}
      <div style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid ${B.sec}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: B.sec, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 4 }}>GEODESY {"\u2014"} CANADIAN SPATIAL REFERENCE SYSTEM</div>
        <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>
          Canada's official geodetic framework is NAD83(CSRS) tied to ITRF via NRCan's CSRS-PPP service. Vertical datum is CGVD2013 (geoid-based). Magnetic declination computed from WMM2025. For GNSS surveys, always specify datum realization + epoch.
        </div>
      </div>

      {/* Datum Context Hero */}
      <div style={{ ...cardStyle, marginBottom: 12, background: `linear-gradient(135deg,${B.surface},${B.bg})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 14 }}>{"\uD83C\uDF10"}</span>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>Active Canadian Reference Frame</h2>
        </div>
        <div className="geod-hero" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
          <div style={{ ...insetStyle, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: B.textDim, fontFamily: B.font, letterSpacing: 1, marginBottom: 4 }}>DATUM</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: B.priBr, fontFamily: B.display }}>NAD83(CSRS)</div>
            <div style={{ fontSize: 10, color: B.textMid, marginTop: 2 }}>Realization v8 (ITRF2020)</div>
          </div>
          <div style={{ ...insetStyle, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: B.textDim, fontFamily: B.font, letterSpacing: 1, marginBottom: 4 }}>REFERENCE EPOCH</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: B.gold, fontFamily: B.display }}>2010.0</div>
            <div style={{ fontSize: 10, color: B.textMid, marginTop: 2 }}>Standard for provincial networks</div>
          </div>
          <div style={{ ...insetStyle, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: B.textDim, fontFamily: B.font, letterSpacing: 1, marginBottom: 4 }}>VERTICAL DATUM</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: B.sec, fontFamily: B.display }}>CGVD2013</div>
            <div style={{ fontSize: 10, color: B.textMid, marginTop: 2 }}>Geoid: CGG2023</div>
          </div>
        </div>
      </div>

      {/* Datum Table + Geoid Models */}
      <div className="geo-ref" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginBottom: 12 }}>
        {/* Datum Table */}
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: B.text }}>Datum Reference</h3>
          <div style={{ display: "grid", gap: 3 }}>
            {DATUMS.map(d => (
              <div key={d.name} style={{ ...insetStyle, padding: "5px 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: d.status === "current" ? B.priBr : B.textDim, fontFamily: B.font }}>{d.name}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9, color: B.textDim, fontFamily: B.font }}>epoch {d.epoch}</span>
                    <span style={{ fontSize: 9, color: d.status === "current" ? "#22c55e" : "#ef4444", fontFamily: B.font, fontWeight: 700 }}>{d.status.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: B.textMid, marginTop: 1 }}>{d.frame} {"\u2014"} {d.use}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Geoid Models + Mag Dec */}
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
          {/* Mag Dec */}
          <div style={{ ...insetStyle, padding: "8px", marginTop: 8, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, letterSpacing: 1 }}>MAG DEC @ {cityName.split("(")[0].trim()}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b", fontFamily: B.font, marginTop: 2 }}>
              {Math.abs(mag.declination).toFixed(1)}{"\u00B0"} {mag.declination > 0 ? "E" : "W"}
            </div>
            {mag.declinationRate != null && (
              <div style={{ fontSize: 9, color: B.textDim, marginTop: 2 }}>Annual change: {mag.declinationRate > 0 ? "+" : ""}{mag.declinationRate.toFixed(2)}{"\u00B0"}/yr</div>
            )}
          </div>
        </div>
      </div>

      {/* PPP Tips - Categorized */}
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: B.text }}>CSRS-PPP Best Practices</h3>
        <div className="geo-ref" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
          {Object.entries(PPP_TIPS).map(([category, tips]) => (
            <div key={category}>
              <div style={{ fontSize: 10, fontWeight: 700, color: B.pri, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 6 }}>{category.toUpperCase()}</div>
              <div style={{ display: "grid", gap: 4 }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 10, color: B.pri, fontWeight: 700, flexShrink: 0 }}>{"\u25B8"}</span>
                    <span style={{ fontSize: 10, color: B.textMid, lineHeight: 1.4 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link Sections */}
      <div className="geo-links" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        {SECTIONS.filter(s => s.title.includes("NRCan") || s.title.includes("GNSS")).map(s => (
          <LinkCard key={s.title} section={s} />
        ))}
      </div>
    </div>
  );
}
