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

/* Updated to reflect 2025 amendments (phased Nov 4, 2025) */
const OP_CATEGORIES = [
  { cat: "Micro", weight: "< 250 g", cert: "None required", age: "N/A", airspace: "Uncontrolled", vlos: "VLOS", people: "No restrictions", notes: "No registration or pilot cert. SFOC required to fly at advertised events (new Apr 2025)." },
  { cat: "Basic", weight: "250 g - 25 kg", cert: "Pilot Certificate - Basic Operations", age: "14+", airspace: "Uncontrolled only", vlos: "VLOS", people: "> 30 m (100 ft) from any person", notes: "> 5.6 km from certified airports, > 1.9 km from heliports. Certificate does not expire." },
  { cat: "Advanced", weight: "250 g - 150 kg", cert: "Pilot Certificate - Advanced Operations", age: "16+", airspace: "Controlled (w/ ATC permission)", vlos: "VLOS, EVLOS, Sheltered", people: "> 5 m (small), > 30 m (medium), or over people w/ declarations", notes: "Includes EVLOS (w/ Visual Observer, 3.7 km range), sheltered ops near structures, and medium drone VLOS. $25 cert fee." },
  { cat: "Level 1 Complex", weight: "250 g - 150 kg", cert: "Pilot Certificate - Level 1 Complex + RPOC", age: "18+", airspace: "Uncontrolled only", vlos: "BVLOS", people: "> 1 km from populated areas (> 5 ppl/km2)", notes: "Lower-risk BVLOS. 20+ hrs ground school, flight review. > 9.3 km from aerodromes. RPOC required. $125 cert fee." },
  { cat: "Special Operations", weight: "Any", cert: "SFOC-RPAS", age: "Varies", airspace: "As authorized", vlos: "As authorized", people: "As authorized", notes: "Higher-risk BVLOS, heavy-lift, experimental, or operations outside other categories. SFOC fee $20-$2,000." },
];

const WEATHER_MINS = [
  { condition: "Visibility (Basic/Advanced)", min: "3 SM (5.6 km)", notes: "Must maintain VLOS at all times (EVLOS: via Visual Observer)" },
  { condition: "Ceiling", min: "Stay below cloud", notes: "Must remain below 122 m (400 ft) AGL and below cloud base" },
  { condition: "Wind (typical limit)", min: "35-45 km/h", notes: "Manufacturer limit; most multi-rotors unstable > 40 km/h" },
  { condition: "Precipitation", min: "Avoid", notes: "Most consumer/prosumer RPAS are not weather-sealed" },
  { condition: "Temperature", min: "-10 to 40 C", notes: "Battery performance degrades below 0 C; land at 20% remaining" },
  { condition: "Icing", min: "Do not fly", notes: "Ice accumulation on propellers causes loss of thrust and control" },
];

const PREFLIGHT_ITEMS = [
  { id: "notam", label: "NOTAMs checked (CFPS)" },
  { id: "airspace", label: "Airspace confirmed (NAV Drone auth if controlled)" },
  { id: "weather", label: "Weather reviewed (METAR/TAF, wind, ceiling)" },
  { id: "registration", label: "Drone registration current and marked on aircraft" },
  { id: "cert", label: "Pilot certificate valid for operation category" },
  { id: "declarations", label: "Safety assurance declarations filed (if required)" },
  { id: "rpoc", label: "RPOC valid (Level 1 Complex only)" },
  { id: "insurance", label: "Liability insurance confirmed" },
  { id: "battery", label: "Batteries charged, inspected, within cycle limits" },
  { id: "firmware", label: "Firmware and flight app up to date" },
  { id: "props", label: "Propellers inspected, no damage" },
  { id: "compass", label: "Compass calibrated (if new location)" },
  { id: "gcs", label: "GCS / controller charged and linked" },
  { id: "flightplan", label: "Flight plan created and filed" },
  { id: "observer", label: "Visual Observer briefed and certified (EVLOS)" },
  { id: "landowner", label: "Landowner/site permission obtained" },
];

const SFOC_TRIGGERS = [
  { q: "Higher-risk BVLOS not covered by Level 1 Complex?", sfoc: true },
  { q: "RPAS over 150 kg?", sfoc: true },
  { q: "Operations in restricted/prohibited airspace?", sfoc: true },
  { q: "Flying a micro drone at an advertised event? (new Apr 2025)", sfoc: true },
  { q: "Night ops without Advanced cert + anti-collision lights?", sfoc: true },
  { q: "Experimental or novel aircraft/payload?", sfoc: true },
  { q: "Operations outside all standard category rules?", sfoc: true },
];

const NEW_2025 = [
  { change: "Level 1 Complex Operations", detail: "New pilot certificate for lower-risk BVLOS. Requires 20+ hrs ground school, flight review, RPOC. Effective Nov 4, 2025.", color: "#22c55e" },
  { change: "EVLOS for Advanced pilots", detail: "Extended VLOS using a certified Visual Observer within 3.7 km (2 NM). Uncontrolled airspace, > 30 m from persons. Effective Nov 4, 2025.", color: "#22c55e" },
  { change: "Sheltered Operations", detail: "Advanced pilots can fly small drones near structures (30 m above, 61 m horizontal) without VLOS. Controlled airspace with declarations.", color: "#22c55e" },
  { change: "Medium Drones (25-150 kg)", detail: "Now permitted under Advanced and Level 1 Complex without SFOC. Safety assurance declarations required.", color: "#22c55e" },
  { change: "Micro Drones at Events", detail: "SFOC now required to fly micro drones (< 250 g) at advertised events. Effective Apr 1, 2025.", color: "#f97316" },
  { change: "RPOC Requirement", detail: "RPAS Operator Certificate required for Level 1 Complex operations. $125 fee. Effective Apr 1, 2025.", color: "#3bbffa" },
  { change: "New Fee Schedule", detail: "Level 1 Complex cert: $125, RPOC: $125, Pre-validated declarations: $1,200, SFOC: $20-$2,000.", color: "#3bbffa" },
  { change: "Penalty Increases", detail: "Individual fines $1,000-$5,000. Corporate fines $5,000-$25,000. Cumulative for multiple violations.", color: "#ef4444" },
];

const TABS = [
  ["categories", "Operation Categories"],
  ["airspace", "Airspace"],
  ["preflight", "Pre-Flight"],
  ["weather", "Weather Mins"],
  ["sfoc", "SFOC Check"],
  ["changes", "2025 Changes"],
  ["links", "Resources"],
];

export function FlightOps() {
  const { B } = useTheme();
  const [tab, setTab] = useState("categories");
  const [checks, setChecks] = useState({});
  const [sfocAnswers, setSfocAnswers] = useState({});
  const [expandedCat, setExpandedCat] = useState(null);
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  const toggleCheck = (id) => setChecks(p => ({ ...p, [id]: !p[id] }));
  const toggleSfoc = (i) => setSfocAnswers(p => ({ ...p, [i]: !p[i] }));
  const checkedCount = Object.values(checks).filter(Boolean).length;
  const sfocNeeded = Object.entries(sfocAnswers).some(([, v]) => v);

  return (
    <div>
      {/* Domain Context */}
      <div style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid #3bbffa` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: B.pri, fontFamily: B.font, letterSpacing: ".04em", marginBottom: 4 }}>RPAS OPERATIONS {"\u2014"} CANADA (2025 FRAMEWORK)</div>
        <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>
          Canadian RPAS regulations under the Aeronautics Act and CARs Part IX now define five operation categories: Micro, Basic, Advanced, Level 1 Complex, and Special Operations. The 2025 amendments (phased Apr/Nov 2025) introduced BVLOS under Level 1 Complex, EVLOS and sheltered ops under Advanced, and medium drone (25-150 kg) support without SFOC.
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="fops-tabs" style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto" }}>
        {TABS.map(([k, label]) => (
          <button key={k} onClick={(e) => { setTab(k); e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); }} style={{ background: tab === k ? B.pri : "transparent", color: tab === k ? B.bg : B.textMid, border: `1px solid ${tab === k ? B.pri : B.border}`, padding: "6px 14px", fontSize: 11, fontFamily: B.font, cursor: "pointer", fontWeight: tab === k ? 700 : 400, letterSpacing: ".04em", whiteSpace: "nowrap" }}>{label}</button>
        ))}
      </div>

      {/* Operation Categories Tab */}
      {tab === "categories" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: 700, color: B.text }}>RPAS Operation Categories (CARs Part IX, 2025)</h3>
          <div style={{ display: "grid", gap: 6 }}>
            {OP_CATEGORIES.map(c => (
              <div key={c.cat} style={{ ...insetStyle, padding: "10px 12px", cursor: "pointer" }} onClick={() => setExpandedCat(expandedCat === c.cat ? null : c.cat)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: B.priBr, fontFamily: B.font }}>{c.cat}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ fontSize: 10, color: B.accent, fontFamily: B.font }}>{c.weight}</div>
                    <span style={{ fontSize: 9, color: B.textDim }}>{expandedCat === c.cat ? "\u25B2" : "\u25BC"}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 10 }}>
                  <div style={{ color: B.textDim }}><span style={{ color: B.textMid, fontWeight: 600 }}>Certificate:</span> {c.cert}</div>
                  <div style={{ color: B.textDim }}><span style={{ color: B.textMid, fontWeight: 600 }}>Min Age:</span> {c.age}</div>
                </div>
                {expandedCat === c.cat && (
                  <div style={{ marginTop: 8, display: "grid", gap: 4, fontSize: 10, borderTop: `1px solid ${B.border}`, paddingTop: 8 }}>
                    <div style={{ color: B.textDim }}><span style={{ color: B.textMid, fontWeight: 600 }}>Airspace:</span> {c.airspace}</div>
                    <div style={{ color: B.textDim }}><span style={{ color: B.textMid, fontWeight: 600 }}>VLOS:</span> {c.vlos}</div>
                    <div style={{ color: B.textDim }}><span style={{ color: B.textMid, fontWeight: 600 }}>People:</span> {c.people}</div>
                    <div style={{ color: B.textMid, lineHeight: 1.4, marginTop: 2 }}>{c.notes}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 9, color: B.textDim, lineHeight: 1.4 }}>
            All drones 250 g - 150 kg must be registered with Transport Canada. Remote control weight excluded; attached equipment (cameras, cages) included in operating weight. Max altitude 122 m (400 ft) AGL for all categories unless SFOC authorizes otherwise.
          </div>
        </div>
      )}

      {/* Airspace Tab */}
      {tab === "airspace" && (
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
          <div style={{ marginTop: 12, ...insetStyle, padding: "8px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.priBr, fontFamily: B.font, marginBottom: 4 }}>RPAS Aerodrome Distances</div>
            <div style={{ display: "grid", gap: 2, fontSize: 10 }}>
              <div style={{ color: B.textMid }}>Basic: {"> "}5.6 km (3 NM) from certified airports, {"> "}1.9 km (1 NM) from heliports</div>
              <div style={{ color: B.textMid }}>Advanced: May operate near airports/heliports with ATC permission</div>
              <div style={{ color: B.textMid }}>Level 1 Complex: {"> "}9.3 km (5 NM) from any aerodrome</div>
              <div style={{ color: B.textMid }}>Military aerodromes: DND permission required within 5.6 km for all categories</div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Flight Checklist Tab */}
      {tab === "preflight" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>Pre-Flight Checklist</h3>
            <div style={{ fontSize: 10, color: checkedCount === PREFLIGHT_ITEMS.length ? "#22c55e" : B.textDim, fontFamily: B.font }}>
              {checkedCount}/{PREFLIGHT_ITEMS.length} complete
            </div>
          </div>
          <div style={{ display: "grid", gap: 3 }}>
            {PREFLIGHT_ITEMS.map(item => (
              <div key={item.id} onClick={() => toggleCheck(item.id)} style={{ ...insetStyle, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", opacity: checks[item.id] ? 0.6 : 1 }}>
                <div style={{ width: 18, height: 18, border: `2px solid ${checks[item.id] ? "#22c55e" : B.border}`, background: checks[item.id] ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>
                  {checks[item.id] ? "\u2713" : ""}
                </div>
                <div style={{ fontSize: 11, color: checks[item.id] ? B.textDim : B.text, textDecoration: checks[item.id] ? "line-through" : "none" }}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <button onClick={() => setChecks({})} style={{ background: "transparent", color: B.textDim, border: `1px solid ${B.border}`, padding: "4px 12px", fontSize: 10, fontFamily: B.font, cursor: "pointer" }}>Reset All</button>
            <button onClick={() => setChecks(Object.fromEntries(PREFLIGHT_ITEMS.map(i => [i.id, true])))} style={{ background: "transparent", color: B.textDim, border: `1px solid ${B.border}`, padding: "4px 12px", fontSize: 10, fontFamily: B.font, cursor: "pointer" }}>Check All</button>
          </div>
          <div style={{ marginTop: 10, fontSize: 9, color: B.textDim, lineHeight: 1.4 }}>
            Reference checklist only. Always follow your organization's SOPs and manufacturer guidelines.
          </div>
        </div>
      )}

      {/* Weather Minimums Tab */}
      {tab === "weather" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 13, fontWeight: 700, color: B.text }}>Weather Minimums for RPAS Operations</h3>
          <div style={{ display: "grid", gap: 4 }}>
            {WEATHER_MINS.map(w => (
              <div key={w.condition} style={{ ...insetStyle, padding: "8px 12px", display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: B.text }}>{w.condition}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: B.accent, fontFamily: B.font, textAlign: "center" }}>{w.min}</div>
                <div style={{ fontSize: 10, color: B.textDim }}>{w.notes}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 9, color: B.textDim, lineHeight: 1.4 }}>
            Wind and temperature limits are manufacturer-specific. Always check your RPAS flight manual.
          </div>
        </div>
      )}

      {/* SFOC Decision Helper Tab */}
      {tab === "sfoc" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: 700, color: B.text }}>Do You Need an SFOC?</h3>
          <div style={{ fontSize: 11, color: B.textMid, marginBottom: 12, lineHeight: 1.4 }}>
            The 2025 amendments moved many previously SFOC-only operations (BVLOS, medium drones, EVLOS) into standard categories. An SFOC is now only required for operations that fall outside all standard categories.
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            {SFOC_TRIGGERS.map((item, i) => (
              <div key={i} onClick={() => toggleSfoc(i)} style={{ ...insetStyle, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div style={{ width: 18, height: 18, border: `2px solid ${sfocAnswers[i] ? "#ef4444" : B.border}`, background: sfocAnswers[i] ? "#ef4444" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>
                  {sfocAnswers[i] ? "\u2713" : ""}
                </div>
                <div style={{ fontSize: 11, color: B.text }}>{item.q}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", background: sfocNeeded ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", border: `2px solid ${sfocNeeded ? "#ef4444" : "#22c55e"}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 18 }}>{sfocNeeded ? "\u26A0\uFE0F" : "\u2705"}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: sfocNeeded ? "#ef4444" : "#22c55e" }}>
                {sfocNeeded ? "SFOC REQUIRED" : "Standard Category Rules Apply"}
              </div>
              <div style={{ fontSize: 10, color: B.textMid, marginTop: 2 }}>
                {sfocNeeded
                  ? "Apply through the TC Drone Management Portal. Fees: $20-$2,000 depending on complexity."
                  : "Operate under Micro, Basic, Advanced, or Level 1 Complex rules as applicable."}
              </div>
            </div>
          </div>
          <button onClick={() => setSfocAnswers({})} style={{ marginTop: 8, background: "transparent", color: B.textDim, border: `1px solid ${B.border}`, padding: "4px 12px", fontSize: 10, fontFamily: B.font, cursor: "pointer" }}>Reset</button>
        </div>
      )}

      {/* 2025 Changes Tab */}
      {tab === "changes" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: 700, color: B.text }}>2025 Regulation Amendments</h3>
          <div style={{ fontSize: 11, color: B.textMid, marginBottom: 12, lineHeight: 1.4 }}>
            Phased rollout: April 1, 2025 (exams, RPOC, fees, micro event SFOC) and November 4, 2025 (BVLOS, EVLOS, sheltered ops, medium drones).
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {NEW_2025.map(item => (
              <div key={item.change} style={{ ...insetStyle, padding: "10px 12px", borderLeft: `3px solid ${item.color}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: B.font, marginBottom: 2 }}>{item.change}</div>
                <div style={{ fontSize: 10, color: B.textMid, lineHeight: 1.4 }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {tab === "links" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          {SECTIONS.filter(s => s.title.includes("Transport Canada") || s.title.includes("NOTAMs")).map(s => (
            <LinkCard key={s.title} section={s} />
          ))}
        </div>
      )}
    </div>
  );
}
