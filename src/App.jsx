import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation as useRouterLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "./context/ThemeContext.jsx";
import { LocationProvider } from "./context/LocationContext.jsx";
import { DARK, LIGHT } from "./lib/theme.js";

// Pages — lazy-loaded so each tab is its own chunk
const CommandCentre = lazy(() => import("./components/pages/CommandCentre.jsx").then(m => ({ default: m.CommandCentre })));
const FlightOps = lazy(() => import("./components/pages/FlightOps.jsx").then(m => ({ default: m.FlightOps })));
const Geodesy = lazy(() => import("./components/pages/Geodesy.jsx").then(m => ({ default: m.Geodesy })));
const SpatialOps = lazy(() => import("./components/pages/SpatialOps.jsx").then(m => ({ default: m.SpatialOps })));
const Recon = lazy(() => import("./components/pages/Recon.jsx").then(m => ({ default: m.Recon })));
const Provincial = lazy(() => import("./components/pages/Provincial.jsx").then(m => ({ default: m.Provincial })));
const SurveyTools = lazy(() => import("./components/pages/SurveyTools.jsx").then(m => ({ default: m.SurveyTools })));
const Regs = lazy(() => import("./components/pages/Regs.jsx").then(m => ({ default: m.Regs })));
const Codex = lazy(() => import("./components/pages/Codex.jsx").then(m => ({ default: m.Codex })));
const MissionBrief = lazy(() => import("./components/pages/MissionBrief.jsx").then(m => ({ default: m.MissionBrief })));

const NAV = [
  { path: "/", label: "Command Centre", icon: "\uD83D\uDDA5\uFE0F" },
  { path: "/flight-ops", label: "Flight Ops", icon: "\u2708\uFE0F" },
  { path: "/geodesy", label: "Geodesy", icon: "\uD83C\uDF0D" },
  { path: "/gis", label: "GIS", icon: "\uD83D\uDDFA\uFE0F" },
  { path: "/remote-sensing", label: "Remote Sensing", icon: "\uD83D\uDC41\uFE0F" },
  { path: "/provincial", label: "Provincial Intel", icon: "\uD83C\uDFDB\uFE0F" },
  { path: "/survey-tools", label: "Survey Tools", icon: "\uD83D\uDD27" },
  { path: "/regs", label: "Regs & Standards", icon: "\uD83D\uDCDC" },
  { path: "/codex", label: "Codex", icon: "\uD83D\uDD0E" },
  { path: "/mission-brief", label: "Mission Brief", icon: "\uD83D\uDCDD" },
];

function Layout() {
  const { theme, B, toggleTheme } = useTheme();
  const routerLocation = useRouterLocation();

  // Zulu / Local clock
  const [utc, setUtc] = useState(new Date());
  const [fieldTz, setFieldTz] = useState("");
  const userTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Toronto";

  useEffect(() => {
    const t = setInterval(() => setUtc(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Typewriter
  const [typewriterText, setTypewriterText] = useState("");
  useEffect(() => {
    const words = ["GEOMATICS", "GEODESY", "REMOTE SENSING", "GIS", "SPATIAL AI", "LiDAR", "PHOTOGRAMMETRY", "RPAS"];
    let wi = 0, ci = 0, deleting = false, pause = 0;
    const t = setInterval(() => {
      const word = words[wi];
      if (pause > 0) { pause--; return; }
      if (!deleting) { ci++; setTypewriterText(word.substring(0, ci)); if (ci === word.length) { deleting = true; pause = 28; } }
      else { ci--; setTypewriterText(word.substring(0, ci)); if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; pause = 6; } }
    }, 65);
    return () => clearInterval(t);
  }, []);

  const getFieldTzTime = () => {
    if (!fieldTz) return "--:--:--";
    return utc.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: fieldTz });
  };

  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  return (
    <div style={{ minHeight: "100vh", background: B.bg, color: B.text, fontFamily: B.sans }}>
      <style>{`
        @keyframes spin-north {0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)}}
        @keyframes blink-cursor {0%,100%{opacity:1} 50%{opacity:0}}
        @keyframes pulse-ring {0%,100%{box-shadow:0 0 6px currentColor} 50%{box-shadow:0 0 24px currentColor}}
        .scanlines {pointer-events:none;position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(${theme==="dark"?"0,0,0":"100,100,100"},.03) 2px,rgba(${theme==="dark"?"0,0,0":"100,100,100"},.03) 4px);z-index:9999}
        @media(max-width:768px){.cmd-telemetry{grid-template-columns:1fr !important}}
        .north-arrow-svg {animation:spin-north 12s linear infinite}
        .north-arrow-svg:hover {animation-duration:1.5s}
        .tagline::after {content:'_';animation:blink-cursor .6s step-end infinite;color:${B.priBr}}
        @media(max-width:768px){.cmd-hero{grid-template-columns:1fr !important}.cmd-split{grid-template-columns:1fr !important}}
        @media(max-width:768px){.cmd-kp-telem{grid-template-columns:1fr !important}}
        @media(max-width:768px){.cmd-sw-forecast{grid-template-columns:1fr !important}}
        @media(max-width:768px){.cmd-ref{grid-template-columns:1fr !important}}
        @media(max-width:768px){.geo-ref{grid-template-columns:1fr !important}}
        @media(max-width:768px){.geo-links{grid-template-columns:1fr !important}}
        @media(max-width:768px){.recon-ref{grid-template-columns:1fr !important}}
        @media(max-width:768px){.forecast-days{grid-template-columns:1fr !important}}
        @media(max-width:768px){.calc-results{grid-template-columns:1fr !important}}
        @media(max-width:480px){.header-inner{flex-direction:column;align-items:flex-start}}
        @media(max-width:768px){.cmd-stations{grid-template-columns:1fr 1fr !important;}}
        @media(max-width:480px){.cmd-stations{grid-template-columns:1fr !important;}}
        @media(max-width:768px){.prov-btns{overflow-x:auto;flex-wrap:nowrap !important;-webkit-overflow-scrolling:touch;}}
        @media(max-width:768px){.cmd-telemetry{grid-template-columns:1fr 1fr !important}}
        @media(max-width:480px){.cmd-telemetry{grid-template-columns:1fr !important}}
        .lnk{display:flex;align-items:center;justify-content:space-between;text-decoration:none;background:transparent;transition:all .12s;border:1px solid transparent;border-radius:5px}
        .lnk:hover{background:${B.surface};border-color:${B.borderHi}}
        .lnk-card{display:flex;align-items:center;justify-content:space-between;text-decoration:none;background:transparent;transition:all .12s;border:1px solid transparent;border-radius:5px}
        .lnk-card:hover{background:${B.priBr}10;border-color:${B.priBr}28}
        .station-card{transition:all .15s}
        .station-card:hover{background:${B.surfaceHi} !important;border-color:${B.pri} !important}
        .codex-row{border:1px solid transparent;transition:border-color .12s;border-radius:4px}
        .codex-row:hover{border-color:${B.border}}
        a.nav-active{background:${B.surface};border:2px solid ${B.borderHi};border-top-color:${B.bvL};border-left-color:${B.bvL};border-bottom-color:${B.bvD};border-right-color:${B.bvD};color:${B.text};font-weight:700}
      `}</style>

      <div className="scanlines" />
      <div style={{ height: 3, background: `linear-gradient(90deg,${B.pri},${B.priBr},${B.acc})` }} />

      {/* Header */}
      <div style={{ background: `linear-gradient(180deg,${B.headerGrad},${B.bg})`, borderBottom: `2px solid ${B.border}`, padding: "12px 24px" }}>
        <div className="header-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, background: `linear-gradient(135deg,${theme === "dark" ? "#0a1530" : B.surfaceHi},${B.surface})`, border: `2px solid ${B.borderHi}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="32" height="32" viewBox="0 0 44 44" fill="none" className="north-arrow-svg">
                <polygon points="22,6 28,30 22,25 16,30" fill={B.priBr} opacity="0.9" />
                <polygon points="22,25 28,30 22,38 16,30" fill={B.sec} opacity="0.4" />
                <circle cx="22" cy="22" r="2" fill="#fff" />
              </svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: B.text, letterSpacing: ".15em", fontFamily: B.display, lineHeight: 1 }}>BCK<span style={{ color: B.priBr }}>Geo</span></h1>
              <div style={{ fontSize: 10, color: B.textDim, marginTop: 4, letterSpacing: ".2em", fontFamily: B.font }} className="tagline">{typewriterText}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button onClick={toggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              style={{ background: B.surface, border: `2px solid ${B.borderHi}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, padding: 0, color: B.text, transition: "all .15s" }}>
              {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
            </button>
            <div style={{ ...insetStyle, padding: "4px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: B.textDim, letterSpacing: 2, fontFamily: B.font }}>ZULU</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: B.gold, fontFamily: B.font, letterSpacing: 2, textShadow: `0 0 8px ${B.gold}44` }}>{utc.toISOString().substring(11, 19)}Z</div>
            </div>
            <div style={{ ...insetStyle, padding: "4px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: B.textDim, letterSpacing: 2, fontFamily: B.font }}>LOCAL</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: B.text, fontFamily: B.font, letterSpacing: 2 }}>{utc.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: userTz })}</div>
            </div>
            <div style={{ ...insetStyle, padding: "4px 12px", textAlign: "center", minWidth: 120 }}>
              <select value={fieldTz} onChange={e => setFieldTz(e.target.value)} style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, background: "transparent", border: "none", letterSpacing: 1, cursor: "pointer", textAlign: "center", width: "100%", padding: 0, outline: "none", WebkitAppearance: "none", appearance: "none" }}>
                <option value="">FIELD TZ</option>
                <option value="Pacific/Honolulu">HST (UTC-10)</option>
                <option value="America/Anchorage">AKST (UTC-9)</option>
                <option value="America/Los_Angeles">PST (UTC-8)</option>
                <option value="America/Denver">MST (UTC-7)</option>
                <option value="America/Chicago">CST (UTC-6)</option>
                <option value="America/New_York">EST (UTC-5)</option>
                <option value="America/Halifax">AST (UTC-4)</option>
                <option value="America/St_Johns">NST (UTC-3:30)</option>
                <option value="Europe/London">GMT (UTC+0)</option>
                <option value="Europe/Paris">CET (UTC+1)</option>
                <option value="Europe/Helsinki">EET (UTC+2)</option>
                <option value="Asia/Dubai">GST (UTC+4)</option>
                <option value="Asia/Kolkata">IST (UTC+5:30)</option>
                <option value="Asia/Tokyo">JST (UTC+9)</option>
                <option value="Australia/Sydney">AEST (UTC+10)</option>
                <option value="Pacific/Auckland">NZST (UTC+12)</option>
              </select>
              <div style={{ fontSize: 16, fontWeight: 700, color: B.sec, fontFamily: B.font, letterSpacing: 2 }}>{getFieldTzTime()}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 2, marginTop: 10, flexWrap: "wrap" }}>
          {NAV.map(n => (
            <NavLink key={n.path} to={n.path} end={n.path === "/"}
              className={({ isActive }) => isActive ? "nav-active" : ""}
              style={{
                background: "transparent",
                border: "2px solid transparent",
                padding: "6px 14px",
                color: B.textDim,
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontFamily: B.font,
                letterSpacing: ".08em",
                transition: "all .1s",
                textDecoration: "none",
              }}>
              <span style={{ fontSize: 12 }}>{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: "14px 20px", maxWidth: 1280, margin: "0 auto" }}>
        <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: B.textDim, fontFamily: B.font, fontSize: 12, letterSpacing: 2 }}>LOADING...</div>}>
        <Routes>
          <Route path="/" element={<CommandCentre />} />
          <Route path="/flight-ops" element={<FlightOps />} />
          <Route path="/geodesy" element={<Geodesy />} />
          <Route path="/gis" element={<SpatialOps />} />
          <Route path="/remote-sensing" element={<Recon />} />
          <Route path="/provincial" element={<Provincial />} />
          <Route path="/survey-tools" element={<SurveyTools />} />
          <Route path="/regs" element={<Regs />} />
          <Route path="/codex" element={<Codex />} />
          <Route path="/mission-brief" element={<MissionBrief />} />
        </Routes>
        </Suspense>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `2px solid ${B.border}`, padding: "10px 24px", marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: B.pri, fontFamily: B.display, letterSpacing: ".1em" }}>BCKGeo</span>
          <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font }}>Weather: Open-Meteo {"\u00B7"} Space Wx: NOAA SWPC {"\u00B7"} Mag Dec: WMM2025</div>
        </div>
        <div style={{ height: 3, background: `linear-gradient(90deg,${B.pri},${B.sec},${B.gold},${B.acc},${B.priBr})`, marginTop: 8 }} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/geomatics-command-centre">
      <ThemeProvider>
        <LocationProvider>
          <Layout />
        </LocationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
