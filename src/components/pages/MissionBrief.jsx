import { useTheme } from "../../context/ThemeContext.jsx";

export function MissionBrief() {
  const { B } = useTheme();
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span>{"\u24D8"}</span>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: B.priBr }}>Mission Brief</h2>
        </div>
        <div style={{ fontSize: 12, color: B.text, lineHeight: 1.7 }}>
          <p style={{ marginBottom: 12 }}><b style={{ color: B.text }}>BCKGeo</b> is a geomatics operations dashboard built for Canadian survey, mapping, and remote sensing professionals. It consolidates the tools, data feeds, and reference material that a working geomatics technologist needs into a single command centre {"\u2014"} covering all 13 provinces and territories.</p>
          <p style={{ marginBottom: 12 }}>The Command Centre aggregates real-time space weather data from <b style={{ color: B.text }}>NOAA SWPC</b> (G/S/R scales, Kp index, solar wind) because geomagnetic conditions directly affect GNSS accuracy, RTK reliability, and PPP convergence times. Local weather is pulled from <b style={{ color: B.text }}>Open-Meteo</b>. Magnetic declination is computed from the <b style={{ color: B.text }}>World Magnetic Model 2025</b> (WMM2025), valid 2025{"\u2013"}2030.</p>
          <p style={{ marginBottom: 12 }}>Tabs are organized by operational domain: <b style={{ color: B.text }}>Flight Ops</b> (Transport Canada RPAS regulations, NOTAMs, airspace), <b style={{ color: B.text }}>Geodesy</b> (NRCan CSRS-PPP, TRX, GNSS tools), <b style={{ color: B.text }}>GIS</b> (GIS platforms, CRS tools, open data), <b style={{ color: B.text }}>Remote Sensing</b> (satellite imagery, LiDAR, photogrammetry), <b style={{ color: B.text }}>Provincial Intel</b> (geospatial data portals for every Canadian jurisdiction), <b style={{ color: B.text }}>Survey Tools</b> (coordinate converter, scale calculator, magnetic declination, unit conversions, COGO). The <b style={{ color: B.text }}>Codex</b> provides definitions for 60+ domain-specific terms organized by discipline.</p>
          <p style={{ marginBottom: 0, color: B.textMid }}>Privacy: no tracking, no analytics, no cookies. Geolocation is opt-in only {"\u2014"} your position is never stored server-side. Weather and reverse geocoding requests go directly to Open-Meteo and BigDataCloud from your browser.</p>
        </div>
      </div>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span>{"\uD83D\uDCE1"}</span>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.sec }}>Data Sources</h3>
        </div>
        <div style={{ display: "grid", gap: 2 }}>
          {[{ n: "NOAA SWPC", u: "https://www.swpc.noaa.gov/", d: "Space weather scales, Kp index, solar wind" }, { n: "Open-Meteo", u: "https://open-meteo.com/", d: "Local weather forecasts & conditions" }, { n: "WMM2025", u: "https://www.ncei.noaa.gov/products/world-magnetic-model", d: "Magnetic declination model (2025\u20132030)" }, { n: "BigDataCloud", u: "https://www.bigdatacloud.com/", d: "Reverse geocoding (browser-side only)" }].map(l => (
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
