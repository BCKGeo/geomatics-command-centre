import { useTheme } from "../../context/ThemeContext.jsx";

export function MissionBrief() {
  const { B } = useTheme();
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const sectionTitle = { margin: "0 0 8px 0", fontSize: 13, fontWeight: 700, color: B.sec };
  const bodyText = { fontSize: 12, color: B.text, lineHeight: 1.7 };
  const itemLabel = { fontWeight: 600, color: B.text };
  const itemDesc = { color: B.textMid };

  const tabs = [
    { label: "Command Centre", desc: "Real-time weather, space weather, Kp index, satellite tracking." },
    { label: "Flight Ops", desc: "Transport Canada RPAS regulations, NOTAMs, airspace tools." },
    { label: "Geodesy", desc: "NRCan CSRS-PPP, datum references, GNSS planning." },
    { label: "GIS", desc: "CRS reference, format guides, web map tools." },
    { label: "Remote Sensing", desc: "Sensor types, point cloud formats, processing pipeline." },
    { label: "Jurisdictions", desc: "Professional bodies, data portals, and legislation for all Canadian jurisdictions." },
    { label: "Survey Tools", desc: "Coordinate conversion, inverse/forward, scale factors, COGO utilities." },
    { label: "Codex", desc: "116 domain-specific terms organized by discipline." },
    { label: "Mission Brief", desc: "You are here." },
  ];

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* What This Is */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span>{"\u24D8"}</span>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: B.priBr }}>What This Is</h2>
        </div>
        <div style={{ ...bodyText, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: 0 }}>A geomatics operations dashboard built by a working professional, for working professionals.</p>
          <p style={{ margin: 0 }}>Consolidates the tools, feeds, and references that field geomatics technologists actually need — instead of 47 browser tabs.</p>
          <p style={{ margin: 0 }}>Built from 18+ years of survey, mapping, and remote sensing experience across western Canada.</p>
        </div>
      </div>

      {/* Why It Exists */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Why It Exists</h3>
        <div style={{ ...bodyText, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ margin: 0 }}><span style={itemDesc}>Real-time space weather affects GNSS accuracy and PPP convergence.</span></p>
          <p style={{ margin: 0 }}><span style={itemDesc}>Weather affects field schedules.</span></p>
          <p style={{ margin: 0 }}><span style={itemDesc}>Magnetic declination matters for every compass-referenced survey.</span></p>
          <p style={{ margin: 0 }}><span style={itemDesc}>Data portals are scattered across 13 jurisdictions plus federal.</span></p>
          <p style={{ margin: 0 }}><span style={itemDesc}>RPAS regulations change constantly.</span></p>
          <p style={{ margin: 0, marginTop: 4 }}>This puts it all in one place with no tracking, no accounts, no cookies.</p>
        </div>
      </div>

      {/* What It Covers */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>What It Covers</h3>
        <div style={{ ...bodyText, display: "flex", flexDirection: "column", gap: 6 }}>
          {tabs.map(o => (
            <p key={o.label} style={{ margin: 0 }}><b style={itemLabel}>{o.label}:</b> <span style={itemDesc}>{o.desc}</span></p>
          ))}
        </div>
      </div>

      {/* Data Sources */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span>{"\uD83D\uDCE1"}</span>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.sec }}>Data Sources</h3>
        </div>
        <div style={{ display: "grid", gap: 2 }}>
          {[
            { n: "NOAA Space Weather Prediction Center", u: "https://www.swpc.noaa.gov/", d: "Kp index, solar wind, X-ray flux" },
            { n: "Open-Meteo", u: "https://open-meteo.com/", d: "Local weather forecasts and conditions" },
            { n: "WMM2025", u: "https://www.ncei.noaa.gov/products/world-magnetic-model", d: "World Magnetic Model (2025\u20132030 validity)" },
            { n: "BigDataCloud", u: "https://www.bigdatacloud.com/", d: "Reverse geocoding (browser-side only)" },
          ].map(l => (
            <a key={l.u} href={l.u} target="_blank" rel="noopener noreferrer" className="lnk"
              style={{ padding: "8px 12px", color: B.text, fontSize: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{l.n}</div>
                <div style={{ fontSize: 10, color: B.textMid, marginTop: 1 }}>{l.d}</div>
              </div>
              <span style={{ color: B.textDim, fontSize: 11 }}>{"\u2192"}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Privacy</h3>
        <div style={{ ...bodyText, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ margin: 0 }}>Zero tracking. No cookies, no analytics, no accounts, no data collection.</p>
          <p style={{ margin: 0 }}>Location is opt-in and never stored server-side.</p>
          <p style={{ margin: 0 }}>All API requests go directly from browser to source.</p>
        </div>
      </div>

      {/* Built With */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Built With</h3>
        <div style={{ ...bodyText, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ margin: 0 }}>React, Vite, Cloudflare Pages.</p>
          <p style={{ margin: 0 }}>Open APIs, no backend, no database.</p>
          <p style={{ margin: 0 }}>Client-side only — everything runs in the browser.</p>
        </div>
      </div>
    </div>
  );
}
