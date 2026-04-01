import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { LinkCard } from "../ui/LinkCard.jsx";
import { SECTIONS } from "../../data/sections.js";

const AIRSPACE = [
  { cls: "A", alt: "FL600 \u2192 FL180", rules: "IFR only", color: "#ef4444" },
  { cls: "B", alt: "Varies", rules: "IFR/VFR, ATC clearance", color: "#f97316" },
  { cls: "C", alt: "Terminal areas", rules: "IFR/VFR, ATC clearance", color: "#eab308" },
  { cls: "D", alt: "Control zones", rules: "IFR/VFR, ATC contact", color: "#84cc16" },
  { cls: "E", alt: "Transition/low", rules: "IFR/VFR, no clearance", color: "#22c55e" },
  { cls: "F", alt: "Advisory/restricted", rules: "Check CFS/DAH", color: "#3bbffa" },
  { cls: "G", alt: "Uncontrolled", rules: "VFR/IFR, no ATC", color: "#94a3b8" },
];

const RPAS_RULES = [
  { label: "Basic Ops", detail: "< 25 kg, uncontrolled airspace, > 30 m from bystanders, VLOS only" },
  { label: "Advanced Ops", detail: "Controlled airspace, over people, < 5 m AGL near bystanders" },
  { label: "SFOC Required", detail: "BVLOS, > 25 kg, night ops (unless Advanced + lights), special areas" },
  { label: "Registration", detail: "All drones 250 g \u2013 25 kg must be registered with TC" },
  { label: "Pilot Cert", detail: "Basic or Advanced certificate required (recurrent every 24 months)" },
  { label: "Max Altitude", detail: "122 m (400 ft) AGL unless authorized" },
  { label: "Min Distance", detail: "5.6 km from aerodromes (unless NAV Drone authorization)" },
];

export function FlightOps() {
  const { B } = useTheme();
  const [showRules, setShowRules] = useState(true);
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  return (
    <div>
      {/* Domain Context */}
      <div style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid #3bbffa` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: B.pri, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 4 }}>RPAS OPERATIONS &mdash; CANADA</div>
        <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>
          Canadian RPAS regulations (CARs Part IX) classify operations as Basic or Advanced based on airspace, proximity to people, and operational risk. All pilots need a valid certificate and registered drone. SFOC required for BVLOS, night ops without Advanced cert + lights, or operations outside standard rules.
        </div>
      </div>

      {/* Quick Reference Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* RPAS Rules */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }} onClick={() => setShowRules(!showRules)}>
            <span>{"\u2708\uFE0F"}</span>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>RPAS Quick Reference</h3>
            <span style={{ marginLeft: "auto", fontSize: 10, color: B.textDim }}>{showRules ? "\u25B2" : "\u25BC"}</span>
          </div>
          {showRules && (
            <div style={{ display: "grid", gap: 4 }}>
              {RPAS_RULES.map(r => (
                <div key={r.label} style={{ ...insetStyle, padding: "6px 10px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: B.priBr, fontFamily: B.font }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: B.textMid, marginTop: 1 }}>{r.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Airspace Classes */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span>{"\uD83D\uDEA8"}</span>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>Canadian Airspace Classes</h3>
          </div>
          <div style={{ display: "grid", gap: 3 }}>
            {AIRSPACE.map(a => (
              <div key={a.cls} style={{ ...insetStyle, padding: "5px 10px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: B.display, fontSize: 16, fontWeight: 800, color: a.color, border: `2px solid ${a.color}`, borderRadius: 2 }}>{a.cls}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: B.textDim }}>{a.alt}</div>
                  <div style={{ fontSize: 10, color: B.textMid }}>{a.rules}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Link Sections */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {SECTIONS.filter(s => s.title.includes("Transport Canada") || s.title.includes("NOTAMs")).map(s => (
          <LinkCard key={s.title} section={s} />
        ))}
      </div>
    </div>
  );
}
