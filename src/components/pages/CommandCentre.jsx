import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useLocation } from "../../context/LocationContext.jsx";
import { useSpaceWeather } from "../../hooks/useSpaceWeather.js";
import { useWeather } from "../../hooks/useWeather.js";
import { useAQHI } from "../../hooks/useAQHI.js";
import { useSatellites } from "../../hooks/useSatellites.js";
import { GaugeRing } from "../ui/GaugeRing.jsx";
import { KpCell } from "../ui/KpCell.jsx";
import { FreshBadge } from "../ui/FreshBadge.jsx";
import { ForecastRow } from "../ui/ForecastRow.jsx";
import { Skyplot, SkyplotFallback } from "../ui/Skyplot.jsx";
import { calcSun, getMoon, calcMagDec, xrayClass } from "../../lib/astronomy.js";
import { WMO, DEFAULT_TZ } from "../../data/constants.js";

const stations = [
  { i: "\u2708\uFE0F", t: "Flight Ops", d: "RPAS regs, NOTAMs, airspace", to: "/flight-ops" },
  { i: "\uD83C\uDF0D", t: "Geodesy", d: "NRCan, CSRS-PPP, GNSS", to: "/geodesy" },
  { i: "\uD83D\uDDFA\uFE0F", t: "GIS", d: "GIS tools, databases, CRS", to: "/gis" },
  { i: "\uD83D\uDC41\uFE0F", t: "Remote Sensing", d: "Imagery, LiDAR, photogrammetry", to: "/remote-sensing" },
  { i: "\uD83C\uDFDB\uFE0F", t: "Provincial Intel", d: "Open data by province", to: "/provincial" },
  { i: "\uD83D\uDD27", t: "Survey Tools", d: "Coordinates, scale, calcs, COGO", to: "/survey-tools" },
  { i: "\uD83D\uDCDC", t: "Regs & Standards", d: "Professional orgs, regulations", to: "/regs" },
  { i: "\uD83D\uDD0E", t: "Codex", d: "Terms & acronyms by domain", to: "/codex" },
];

export function CommandCentre() {
  const { theme, B } = useTheme();
  const { lat, lon, cityName, locSource, locLoading, requestLocation, resetLocation } = useLocation();
  const navigate = useNavigate();

  const userTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : DEFAULT_TZ;
  const DEFAULT_CITY = "Ottawa, ON (default)";

  const { data: sw, error: sErr, lastUpdated: swUpdated } = useSpaceWeather();
  const { data: wx, error: wErr, lastUpdated: wxUpdated } = useWeather(lat, lon, userTz);
  const { data: aqhi, lastUpdated: aqhiUpdated } = useAQHI(lat, lon);
  const { satellites: sat, tleLastUpdated: satUpdated, proxyAvailable: satProxy } = useSatellites(lat, lon);
  const [utc, setUtc] = useState(new Date());
  const [sun, setSun] = useState({ altitude: 0, azimuth: 0 });
  const [fieldTz, setFieldTz] = useState("");
  const [typewriterText, setTypewriterText] = useState("");

  // ── Clock & Typewriter ──
  useEffect(() => {
    const t = setInterval(() => { const n = new Date(); setUtc(n); setSun(calcSun(n, lat, lon)); }, 1000);
    return () => clearInterval(t);
  }, [lat, lon]);

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

  // ── Extract Data ──
  const kp = sw?.kp?.slice(-9) || [], sc = sw?.scales || {}, gS = sc["0"]?.G?.Scale || "0", sS = sc["0"]?.S?.Scale || "0", rS = sc["0"]?.R?.Scale || "0";
  // NOAA summary endpoints return arrays: [{proton_speed,time_tag}], [{bt,bz_gsm,time_tag}], [{flux,time_tag}]
  const swWind = Array.isArray(sw?.wind) ? sw.wind[0] : sw?.wind;
  const swMag = Array.isArray(sw?.mag) ? sw.mag[0] : sw?.mag;
  const swFlux = Array.isArray(sw?.flux) ? sw.flux[0] : sw?.flux;
  const windSpeed = swWind?.WindSpeed || swWind?.proton_speed || "--";
  const magBt = swMag?.Bt || swMag?.bt || "--";
  const magBz = swMag?.Bz || swMag?.bz_gsm || "--";
  const fluxVal = swFlux?.Flux || swFlux?.flux || "--";
  const cur = wx?.current || {}, dy = wx?.daily || {}, wc = cur.weather_code ?? 0, wi = WMO[wc] || { i: "\u2753", d: "Unknown" };
  const moon = getMoon(new Date());

  const getFieldTzTime = () => { if (!fieldTz) return "--:--:--"; return utc.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: fieldTz }); };

  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  return (
    <div>
      {/* Active NOAA Alerts */}
      {sw?.alerts?.length > 0 && sw.alerts.slice(0, 3).map((a, i) => {
        const msg = a.message || "";
        const isWarning = /WARNING/i.test(msg);
        const isAlert = /ALERT/i.test(msg);
        const borderColor = isAlert ? "#ef4444" : isWarning ? "#f97316" : B.acc;
        const firstLine = msg.split("\r\n").find(l => l.trim() && !/^Space Weather|^Serial|^Issue/.test(l.trim())) || "Space Weather Alert";
        return (
          <div key={i} style={{ background: `linear-gradient(135deg,${B.surface},${theme === "dark" ? "#1a0a0a" : "#fef2f2"})`, border: `2px solid ${B.border}`, borderLeft: `3px solid ${borderColor}`, padding: "8px 12px", marginBottom: 4, display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>{isAlert ? "\uD83D\uDEA8" : isWarning ? "\u26A0\uFE0F" : "\u2139\uFE0F"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: borderColor, fontFamily: B.font }}>{isAlert ? "ALERT" : isWarning ? "WARNING" : "WATCH"}</div>
              <div style={{ fontSize: 10, color: B.textMid, marginTop: 2, whiteSpace: "pre-wrap", lineHeight: 1.4, maxHeight: 40, overflow: "hidden" }}>{firstLine.trim()}</div>
            </div>
            <span style={{ fontSize: 9, color: B.textDim, whiteSpace: "nowrap" }}>{a.issue_datetime?.substring(0, 16)}</span>
          </div>
        );
      })}
      {sw?.alerts?.length > 0 && <div style={{ marginBottom: 8 }} />}

      {/* Advisory Banner */}
      <div style={{ background: `linear-gradient(135deg,${B.surface},${theme === "dark" ? "#0a1530" : "#eef1f5"})`, border: `2px solid ${B.border}`, borderLeft: `3px solid ${B.acc}`, padding: 12, marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 17, lineHeight: 1 }}>{"\u26A0\uFE0F"}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: B.gold, marginBottom: 3, fontFamily: B.font, letterSpacing: ".04em" }}>GNSS & GEOMAGNETIC ADVISORY</div>
          <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>Kp 5+ degrades GNSS accuracy, increases cycle slips, and extends PPP convergence. During G2+ events, extend observation sessions, use multi-constellation (GPS+GLONASS+Galileo), and verify ionospheric conditions. CSRS-PPP v5 with Galileo PPP-AR helps mitigate. Sustained southward Bz (&lt; -10 nT) drives the strongest geomagnetic responses.</div>
        </div>
      </div>

      {/* ═══ ROW 1: Weather + GNSS Skyplot ═══ */}
      <div className="cmd-hero" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 12, marginBottom: 12, alignItems: "stretch" }}>
        {/* Weather */}
        <div style={{ ...cardStyle, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span>{"\uD83C\uDF24\uFE0F"}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: B.text }}>{locSource === "gps" ? "\uD83D\uDCCD " : ""}{cityName}</span>
              <button onClick={requestLocation} style={{ background: "none", border: `1px solid ${B.border}`, borderRadius: 3, padding: "2px 6px", fontSize: 10, color: B.textMid, cursor: "pointer", fontFamily: B.font }} title="Use my location">{locLoading ? "\u23F3" : "\uD83D\uDCCD"}</button>
              {cityName !== DEFAULT_CITY && <button onClick={resetLocation} style={{ background: "none", border: "none", padding: 0, fontSize: 9, color: B.textDim, cursor: "pointer", fontFamily: B.font, textDecoration: "underline" }} title="Reset to default">reset</button>}
            </div>
            <span style={{ fontSize: 10, color: B.textDim, marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>Open-Meteo <FreshBadge lastUpdated={wxUpdated} interval={6e5} /></span>
          </div>
          {wErr ? <div style={{ color: "#ef4444", fontSize: 12 }}>Unable to load</div>
            : !wx ? <div style={{ color: B.textMid, fontSize: 12 }}>Loading...</div>
            : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{wi.i}</span>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: B.text, lineHeight: 1 }}>{Math.round(cur.temperature_2m)}{"\u00B0"}C</div>
                    <div style={{ fontSize: 10, color: B.textMid }}>{wi.d}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px", marginBottom: 10, fontSize: 10, color: B.textMid }}>
                  <div>Wind <b style={{ color: B.text }}>{Math.round(cur.wind_speed_10m)} km/h</b></div>
                  <div>Humidity <b style={{ color: B.text }}>{cur.relative_humidity_2m}%</b></div>
                  <div>Pressure <b style={{ color: B.text }}>{Math.round(cur.surface_pressure)} hPa</b></div>
                  <div>Precip <b style={{ color: B.text }}>{cur.precipitation} mm</b></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, flex: 1 }}>
                  {(dy.time || []).slice(0, 7).map((d, i) => {
                    const dc = dy.weather_code?.[i] ?? 0, di = WMO[dc] || { i: "\u2753", d: "?" };
                    return (
                      <div key={d} style={{ ...insetStyle, padding: "4px 3px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: B.textDim, textTransform: "uppercase", marginBottom: 1 }}>{i === 0 ? "Today" : new Date(d + "T12:00:00").toLocaleDateString("en-CA", { weekday: "short" })}</div>
                        <div style={{ fontSize: 12, marginBottom: 1 }}>{di.i}</div>
                        <div style={{ fontFamily: B.display, fontSize: 11, color: B.text }}>{Math.round(dy.temperature_2m_max?.[i])}{"\u00B0"}</div>
                        <div style={{ fontSize: 10, color: B.textDim }}>{Math.round(dy.temperature_2m_min?.[i])}{"\u00B0"}</div>
                      </div>
                    );
                  })}
                </div>
                {aqhi && aqhi.aqhi != null && (() => {
                  const v = aqhi.aqhi, color = v <= 3 ? "#22c55e" : v <= 6 ? "#eab308" : v <= 10 ? "#ef4444" : "#dc2626";
                  const risk = v <= 3 ? "Low Risk" : v <= 6 ? "Moderate Risk" : v <= 10 ? "High Risk" : "Very High Risk";
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "6px 8px", background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL }}>
                      <span style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, letterSpacing: 1 }}>AIR QUALITY</span>
                      <span style={{ fontFamily: B.display, fontSize: 16, fontWeight: 800, color }}>{Math.round(v)}</span>
                      <span style={{ fontSize: 10, color, fontWeight: 600 }}>{risk}</span>
                      <span style={{ fontSize: 9, color: B.textDim, marginLeft: "auto" }}>{aqhi.station}</span>
                      <FreshBadge lastUpdated={aqhiUpdated} interval={18e5} />
                    </div>
                  );
                })()}
              </div>
            )}
        </div>

        {/* GNSS Satellite Visibility */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span>{"\uD83D\uDEF0\uFE0F"}</span>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>Satellite Visibility</h2>
            {satProxy && satUpdated && <span style={{ marginLeft: "auto" }}><FreshBadge lastUpdated={satUpdated} interval={216e5} /></span>}
          </div>
          {satProxy && sat ? (
            <Skyplot visible={sat.visible} count={sat.count} pdop={sat.pdop} />
          ) : (
            <SkyplotFallback />
          )}
        </div>
      </div>

      {/* ═══ ROW 2: Kp Index + Telemetry ═══ */}
      <div className="cmd-kp-telem" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12, alignItems: "stretch" }}>
        {/* Kp Index */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span>{"\uD83D\uDCCA"}</span>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>Kp Index</h2>
            <span style={{ fontSize: 10, color: B.textDim, marginLeft: "auto" }}>24h</span>
          </div>
          {(!sw || kp.length === 0) ? <div style={{ color: B.textMid, fontSize: 12 }}>Loading...</div> : (
            <div>
              <div style={{ display: "flex", gap: 2 }}>
                {kp.map((r, i) => {
                  if (i === 0 || !Array.isArray(r)) return null;
                  const v = parseFloat(r[1]) || 0;
                  return <KpCell key={i} val={v} time={r[0]?.substring(11, 16) || ""} />;
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim }}>Kp 5+ degrades GNSS {"\u00B7"} Kp 7+ disrupts RTK</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {[{ c: "#22c55e", l: "0-3" }, { c: "#84cc16", l: "4" }, { c: "#d4a017", l: "5-6" }, { c: "#ef4444", l: "7+" }].map(x => (
                    <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <div style={{ width: 10, height: 4, background: x.c, borderRadius: 1 }} />
                      <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim }}>{x.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Telemetry */}
        {sw && !sErr ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, letterSpacing: 2, marginBottom: 4 }}>FLUX (F10.7)</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: B.pri, fontFamily: B.display }}>{fluxVal}</div>
              <div style={{ fontSize: 10, color: B.textMid }}>sfu</div>
              <div style={{ height: 4, background: B.border, borderRadius: 2, marginTop: 6 }}>
                <div style={{ height: 4, borderRadius: 2, background: B.pri, width: `${Math.min(100, Math.max(2, ((parseFloat(fluxVal) || 70) - 60) / 1.4))}%`, transition: "width .3s" }} />
              </div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, letterSpacing: 2, marginBottom: 4 }}>X-RAY</div>
              {(() => {
                const entries = (sw.xray || []).filter(e => e.energy === "0.1-0.8nm");
                const last = entries[entries.length - 1];
                const xr = xrayClass(last?.flux);
                return (<>
                  <div style={{ fontSize: 28, fontWeight: 800, color: xr.color, fontFamily: B.display }}>{xr.cls}</div>
                  <div style={{ fontSize: 10, color: B.textMid }}>GOES 1-8 {"\u212B"}</div>
                  {(xr.cls.startsWith("M") || xr.cls.startsWith("X")) && <div style={{ width: 8, height: 8, borderRadius: "50%", background: xr.color, display: "inline-block", marginTop: 4, animation: "pulse-ring 1.5s ease-in-out infinite" }} />}
                </>);
              })()}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, letterSpacing: 2, marginBottom: 4 }}>SOLAR WIND</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: B.priBr, fontFamily: B.display }}>{windSpeed}</div>
              <div style={{ fontSize: 10, color: B.textMid }}>km/s</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 10 }}>
                <span style={{ color: B.textMid }}>Bt <b style={{ color: B.text }}>{magBt}</b></span>
                <span style={{ color: B.textMid }}>Bz <b style={{ color: parseFloat(magBz) < 0 ? B.acc : B.priBr }}>{magBz}</b></span>
              </div>
            </div>
          </div>
        ) : (
          <div style={cardStyle}><div style={{ color: B.textMid, fontSize: 12 }}>Loading telemetry...</div></div>
        )}
      </div>

      {/* ═══ ROW 3: Space Weather Gauges + 3-Day Forecast ═══ */}
      <div className="cmd-sw-forecast" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12, alignItems: "stretch" }}>
        {/* Current G/S/R Scales */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span>{"\u2600\uFE0F"}</span>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>Space Weather</h2>
            <span style={{ marginLeft: "auto" }}><FreshBadge lastUpdated={swUpdated} interval={12e4} /></span>
          </div>
          {sErr ? <div style={{ color: "#ef4444", fontSize: 12 }}>Unable to load</div>
            : !sw ? <div style={{ color: B.textMid, fontSize: 12 }}>Loading...</div>
            : (
              <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
                <GaugeRing level={`G${gS}`} label="Geomag" />
                <GaugeRing level={`S${sS}`} label="Solar Rad" />
                <GaugeRing level={`R${rS}`} label="Radio" />
              </div>
            )}
        </div>

        {/* 3-Day Forecast */}
        <div style={cardStyle}>
          {sw && !sErr ? (
            <ForecastRow scales={sw.scales} />
          ) : (
            <div style={{ color: B.textMid, fontSize: 12 }}>Loading forecast...</div>
          )}
        </div>
      </div>

      {/* ═══ ROW 4: Mag Dec + AQHI/Sun/Moon ═══ */}
      <div className="cmd-ref" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12, alignItems: "start" }}>
        {/* Magnetic Declination */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span>{"\uD83E\uDDED"}</span>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>Magnetic Declination</h2>
          </div>
          {(() => {
            const m = calcMagDec(lat, lon), da = Math.abs(m.declination), dd = Math.floor(da), dm = Math.round((da - dd) * 60);
            return (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b", fontFamily: B.font }}>{dd}{"\u00B0"} {dm}{"\u2032"} {m.declination > 0 ? "E" : "W"}</div>
                <div style={{ fontSize: 11, color: B.textMid, marginTop: 3 }}>{cityName} ({Math.abs(lat).toFixed(2)}{"\u00B0"}{lat >= 0 ? "N" : "S"}, {Math.abs(lon).toFixed(2)}{"\u00B0"}{lon >= 0 ? "E" : "W"})</div>
                <div style={{ fontSize: 10, color: B.textDim, marginTop: 2 }}>WMM2025 {"\u00B7"} {new Date().toLocaleDateString("en-CA")}</div>
              </div>
            );
          })()}
        </div>

        {/* Sun & Moon */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span>{sun.altitude > 0 ? "\u2600\uFE0F" : "\uD83C\uDF19"}</span>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>Sun & Moon</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ ...insetStyle, padding: 8, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, letterSpacing: 1, marginBottom: 4 }}>SUN ALT</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: sun.altitude > 0 ? B.gold : B.textDim, fontFamily: B.display }}>{sun.altitude.toFixed(1)}{"\u00B0"}</div>
              <div style={{ fontSize: 10, color: B.textMid }}>Az {sun.azimuth.toFixed(1)}{"\u00B0"}</div>
            </div>
            <div style={{ ...insetStyle, padding: 8, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, letterSpacing: 1, marginBottom: 4 }}>MOON</div>
              <div style={{ fontSize: 20, marginBottom: 2 }}>{moon.icon}</div>
              <div style={{ fontSize: 10, color: B.textMid }}>{moon.name} {moon.illum}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ROW 5: Stations ═══ */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 2, marginBottom: 8 }}>STATIONS</div>
        <div className="cmd-stations" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {stations.map(s => (
            <div key={s.t} onClick={() => navigate(s.to)} className="station-card"
              style={{ background: B.surface, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 22, width: 36, textAlign: "center" }}>{s.i}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontFamily: B.font, fontSize: 12, fontWeight: 700, letterSpacing: ".06em", margin: 0, color: B.priBr }}>{s.t}</h3>
                <p style={{ fontSize: 10, color: B.textDim, lineHeight: 1.4, margin: "2px 0 0" }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
