import { useTheme } from "../../context/ThemeContext.jsx";

export function Terms() {
  const { B } = useTheme();
  const card = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 20, marginBottom: 12 };
  const inset = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL, padding: "12px 14px", marginBottom: 10 };
  const h = { fontSize: 12, fontWeight: 700, color: B.priBr, fontFamily: B.font, letterSpacing: ".06em", marginBottom: 6 };
  const p = { fontSize: 11, color: B.textMid, lineHeight: 1.6, margin: "0 0 8px" };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ ...card, borderLeft: `3px solid ${B.priBr}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: B.text, fontFamily: B.display, letterSpacing: ".1em", marginBottom: 4 }}>TERMS OF USE</div>
        <div style={{ fontSize: 11, color: B.textDim }}>BCKGeo Command Centre {"\u2014"} Last updated April 2026</div>
      </div>

      <div style={card}>
        <div style={inset}>
          <div style={h}>1. PURPOSE & SCOPE</div>
          <p style={p}>BCKGeo Command Centre is a reference, estimation, and planning tool designed for geomatics professionals. It aggregates publicly available data from third-party sources and provides calculators for quick field estimates and educational use.</p>
          <p style={p}>This application is <b style={{ color: B.text }}>not a professional survey instrument</b>, licensed processing software, or certified measurement system. It is not intended to replace the tools, methods, or professional judgment required for legal, engineering, or life-safety purposes.</p>
        </div>

        <div style={inset}>
          <div style={h}>2. NO WARRANTY</div>
          <p style={p}>This tool is provided <b style={{ color: B.text }}>"as is" without warranty of any kind</b>, express or implied, including but not limited to warranties of accuracy, completeness, merchantability, or fitness for a particular purpose.</p>
          <p style={p}>Data is sourced from third-party providers (NOAA SWPC, Open-Meteo, Environment Canada, Celestrak, BigDataCloud) and may be delayed, incomplete, or inaccurate. The developer does not guarantee the availability, timeliness, or accuracy of any data displayed.</p>
        </div>

        <div style={inset}>
          <div style={h}>3. LIMITATION OF LIABILITY</div>
          <p style={p}>The developer shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from the use of or inability to use this tool, including but not limited to:</p>
          <ul style={{ fontSize: 11, color: B.textMid, lineHeight: 1.6, margin: "0 0 8px 16px", padding: 0 }}>
            <li>Errors in coordinate transformations or geodetic calculations</li>
            <li>Decisions made based on weather, space weather, or satellite data</li>
            <li>Property boundary disputes or survey errors</li>
            <li>RPAS flight incidents or airspace violations</li>
            <li>Construction, engineering, or navigation errors</li>
          </ul>
          <p style={p}><b style={{ color: B.text }}>Users assume all risk and responsibility</b> for any actions taken based on information provided by this tool.</p>
        </div>

        <div style={inset}>
          <div style={h}>4. CALCULATIONS DISCLAIMER</div>
          <p style={p}>All calculations, conversions, and transformations are <b style={{ color: B.text }}>approximate</b> and intended for quick reference and estimation only. They must not be relied upon for:</p>
          <ul style={{ fontSize: 11, color: B.textMid, lineHeight: 1.6, margin: "0 0 8px 16px", padding: 0 }}>
            <li>Legal survey monuments, property boundaries, or cadastral work</li>
            <li>Construction staking, engineering layout, or machine control</li>
            <li>Air navigation, marine navigation, or life-safety systems</li>
            <li>Regulatory compliance or official reporting</li>
          </ul>
          <p style={p}>Coordinate transformations do not account for local distortions, crustal motion, site-specific calibrations, or survey-grade geoid models. Geodetic calculators use simplified algorithms (Vincenty on GRS80, WMM2025 truncated to degree 3) that may differ from results produced by authoritative tools such as NRCan TRX, CSRS-PPP, or professional GNSS processing software.</p>
        </div>

        <div style={inset}>
          <div style={h}>5. PROFESSIONAL REQUIREMENTS</div>
          <p style={p}>In Canada, legal survey work must be performed under the supervision of a licensed land surveyor (BCLS, CLS, ALS, OLS, or equivalent provincial designation) in accordance with applicable provincial legislation.</p>
          <p style={p}>RPAS operations must comply with Canadian Aviation Regulations Part IX (CARS 901) and any applicable Special Flight Operations Certificates (SFOCs). The pilot-in-command bears sole responsibility for safe flight operations, airspace compliance, and regulatory adherence.</p>
          <p style={p}>This tool does not confer, verify, or replace any professional qualification, certification, or authorization.</p>
        </div>

        <div style={inset}>
          <div style={h}>6. DATA SOURCES & THIRD PARTIES</div>
          <p style={p}>BCKGeo Command Centre is not affiliated with, endorsed by, or sponsored by any of the following organizations whose data or services are referenced:</p>
          <ul style={{ fontSize: 11, color: B.textMid, lineHeight: 1.6, margin: "0 0 8px 16px", padding: 0 }}>
            <li>NOAA Space Weather Prediction Center (Kp index, G/S/R scales, solar wind)</li>
            <li>Open-Meteo (weather forecasts)</li>
            <li>Environment and Climate Change Canada (AQHI)</li>
            <li>CelesTrak / NORAD (satellite TLE data)</li>
            <li>BigDataCloud (reverse geocoding)</li>
            <li>Natural Resources Canada (geodetic references, WMM2025)</li>
            <li>Transport Canada, NAV CANADA (regulatory references)</li>
          </ul>
          <p style={p}>Links to external websites are provided for convenience only. The developer does not control, endorse, or accept responsibility for the content, accuracy, or availability of external sites.</p>
        </div>

        <div style={inset}>
          <div style={h}>7. PRIVACY</div>
          <p style={p}>BCKGeo Command Centre collects <b style={{ color: B.text }}>no personal data</b>. There is no tracking, analytics, cookies, or server-side data collection.</p>
          <p style={p}>Geolocation is opt-in only. Your position is used client-side to fetch local weather, AQHI, and compute location-dependent values (magnetic declination, satellite visibility). It is never transmitted to or stored by BCKGeo servers.</p>
          <p style={p}>Weather and geocoding requests go directly from your browser to third-party APIs (Open-Meteo, BigDataCloud). Refer to their respective privacy policies for data handling practices.</p>
          <p style={p}>A single localStorage flag records whether you have accepted the Survey Tools disclaimer. No other data is persisted.</p>
        </div>

        <div style={inset}>
          <div style={h}>8. GOVERNING LAW</div>
          <p style={p}>These terms are governed by and construed in accordance with the laws of the Province of British Columbia, Canada. Any disputes arising from the use of this tool shall be subject to the exclusive jurisdiction of the courts of British Columbia.</p>
        </div>
      </div>
    </div>
  );
}
