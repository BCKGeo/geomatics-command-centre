import { useTheme } from "../../context/ThemeContext.jsx";

export function MissionBrief() {
  const { B } = useTheme();
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const sectionTitle = { margin: "0 0 8px 0", fontSize: 13, fontWeight: 700, color: B.sec };
  const bodyText = { fontSize: 12, color: B.text, lineHeight: 1.7 };
  const itemLabel = { fontWeight: 600, color: B.text };
  const itemDesc = { color: B.textMid };

  const ops = [
    { label: "Flight Ops", desc: "Transport Canada RPAS regulations, NOTAMs, and airspace tools." },
    { label: "Geodesy", desc: "NRCan CSRS-PPP, TRX, and GNSS network links." },
    { label: "GIS", desc: "Web platforms, CRS utilities, and open data hubs." },
    { label: "Remote Sensing", desc: "Satellite imagery, LiDAR, and photogrammetry reference data." },
    { label: "Provincial Intel", desc: "Dedicated geospatial portals for every Canadian jurisdiction." },
    { label: "Survey Tools", desc: "Coordinate conversion, scale calculation, magnetic declination, unit conversion, and COGO utilities." },
    { label: "The Codex", desc: "A glossary of over 60 domain-specific terms categorized by discipline." },
  ];

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Mission Brief */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span>{"\u24D8"}</span>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: B.priBr }}>Mission Brief</h2>
        </div>
        <div style={bodyText}>
          <p style={{ marginBottom: 0 }}><b style={itemLabel}>BCKGeo</b> is a geomatics operations dashboard built for Canadian survey, mapping, and remote sensing professionals. It consolidates the tools, data feeds, and reference materials required by a working geomatics technologist into a single command centre covering all 13 provinces and territories.</p>
        </div>
      </div>

      {/* Core Integrations */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Core Integrations</h3>
        <div style={{ ...bodyText, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: 0 }}><b style={itemLabel}>Space Weather:</b> <span style={itemDesc}>Aggregates real-time NOAA SWPC data (G/S/R scales, Kp index, solar wind) to track conditions impacting GNSS accuracy, RTK reliability, and PPP convergence times.</span></p>
          <p style={{ margin: 0 }}><b style={itemLabel}>Environment:</b> <span style={itemDesc}>Local weather pulled directly via Open-Meteo.</span></p>
          <p style={{ margin: 0 }}><b style={itemLabel}>Magnetic Declination:</b> <span style={itemDesc}>Computed using the World Magnetic Model 2025 (WMM2025), valid 2025 to 2030.</span></p>
        </div>
      </div>

      {/* Operational Domains */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Operational Domains</h3>
        <div style={{ ...bodyText, display: "flex", flexDirection: "column", gap: 6 }}>
          {ops.map(o => (
            <p key={o.label} style={{ margin: 0 }}><b style={itemLabel}>{o.label}:</b> <span style={itemDesc}>{o.desc}</span></p>
          ))}
        </div>
      </div>

      {/* Privacy & Architecture */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Privacy & Architecture</h3>
        <div style={bodyText}>
          <p style={{ margin: 0, color: B.textMid }}>Zero tracking, no analytics, and no cookies. Geolocation is strictly opt-in, and your position is never stored server-side. All weather and reverse geocoding requests route directly from your browser to Open-Meteo and BigDataCloud.</p>
        </div>
      </div>

      {/* Data Sources */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span>{"\uD83D\uDCE1"}</span>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.sec }}>Data Sources</h3>
        </div>
        <div style={{ display: "grid", gap: 2 }}>
          {[{ n: "NOAA SWPC", u: "https://www.swpc.noaa.gov/", d: "Space weather scales, Kp index, solar wind" }, { n: "Open-Meteo", u: "https://open-meteo.com/", d: "Local weather forecasts & conditions" }, { n: "WMM2025", u: "https://www.ncei.noaa.gov/products/world-magnetic-model", d: "Magnetic declination model (2025-2030)" }, { n: "BigDataCloud", u: "https://www.bigdatacloud.com/", d: "Reverse geocoding (browser-side only)" }].map(l => (
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
    </div>
  );
}
