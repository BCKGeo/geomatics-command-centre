import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useLocation } from "../../context/LocationContext.jsx";
import { GaugeRing } from "../ui/GaugeRing.jsx";
import { KpCell } from "../ui/KpCell.jsx";
import { calcSun, getMoon, calcMagDec, xrayClass } from "../../lib/astronomy.js";
import { WMO, NOAA_KP, NOAA_SCALES, NOAA_WIND_SPEED, NOAA_WIND_MAG, NOAA_XRAY, NOAA_XRAY_FLUX, DEFAULT_TZ, buildWeatherUrl } from "../../data/constants.js";

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

  const [sw, setSw] = useState(null);
  const [wx, setWx] = useState(null);
  const [sErr, setSErr] = useState(false);
  const [wErr, setWErr] = useState(false);
  const [utc, setUtc] = useState(new Date());
  const [sun, setSun] = useState({ altitude: 0, azimuth: 0 });
  const [fieldTz, setFieldTz] = useState("");
  const [typewriterText, setTypewriterText] = useState("");

  const userTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : DEFAULT_TZ;
  const DEFAULT_CITY = "Ottawa, ON (default)";

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

  // ── Fetch Space Weather & Weather ──
  const fS = useCallback(async () => {
    try {
      const [a, b, c, d, e, f] = await Promise.allSettled([
        fetch(NOAA_KP).then(r => r.json()),
        fetch(NOAA_SCALES).then(r => r.json()),
        fetch(NOAA_WIND_SPEED).then(r => r.json()),
        fetch(NOAA_WIND_MAG).then(r => r.json()),
        fetch(NOAA_XRAY).then(r => r.json()),
        fetch(NOAA_XRAY_FLUX).then(r => r.json()),
      ]);
      setSw({
        kp: a.status === "fulfilled" ? a.value : [],
        scales: b.status === "fulfilled" ? b.value : {},
        wind: c.status === "fulfilled" ? c.value : {},
        mag: d.status === "fulfilled" ? d.value : {},
        flux: e.status === "fulfilled" ? e.value : {},
        xray: f.status === "fulfilled" ? f.value : [],
      });
      setSErr(false);
    } catch { setSErr(true); }
  }, []);

  const fW = useCallback(async () => {
    try { setWx(await fetch(buildWeatherUrl(lat, lon, userTz)).then(r => r.json())); setWErr(false); } catch { setWErr(true); }
  }, [lat, lon, userTz]);

  useEffect(() => {
    fS(); fW();
    const a = setInterval(fS, 12e4), b = setInterval(fW, 6e5);
    return () => { clearInterval(a); clearInterval(b); };
  }, [fS, fW]);

  // ── Extract Data ──
  const kp = sw?.kp?.slice(-9) || [], sc = sw?.scales || {}, gS = sc["0"]?.G?.Scale || "0", sS = sc["0"]?.S?.Scale || "0", rS = sc["0"]?.R?.Scale || "0";
  const cur = wx?.current || {}, dy = wx?.daily || {}, wc = cur.weather_code ?? 0, wi = WMO[wc] || { i: "\u2753", d: "Unknown" };
  const moon = getMoon(new Date());

  const getFieldTzTime = () => { if (!fieldTz) return "--:--:--"; return utc.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: fieldTz }); };

  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  const insetStyle = { background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL };

  return (
    <div>
      {/* Advisory Banner */}
      <div style={{ background: `linear-gradient(135deg,${B.surface},${theme === "dark" ? "#0a1530" : "#eef1f5"})`, border: `2px solid ${B.border}`, borderLeft: `3px solid ${B.acc}`, padding: 12, marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 17, lineHeight: 1 }}>{"\u26A0\uFE0F"}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: B.gold, marginBottom: 3, fontFamily: B.font, letterSpacing: ".04em" }}>GNSS & GEOMAGNETIC ADVISORY</div>
          <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5 }}>Kp 5+ degrades GNSS accuracy, increases cycle slips, and extends PPP convergence. During G2+ events, extend observation sessions, use multi-constellation (GPS+GLONASS+Galileo), and verify ionospheric conditions. CSRS-PPP v5 with Galileo PPP-AR helps mitigate. Sustained southward Bz (&lt; -10 nT) drives the strongest geomagnetic responses.</div>
        </div>
      </div>

      {/* Weather + NOAA Hero */}
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
            <span style={{ fontSize: 10, color: B.textDim, marginLeft: "auto" }}>Open-Meteo</span>
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
              </div>
            )}
        </div>

        {/* NOAA Space Weather */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span>{"\u2600\uFE0F"}</span>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>NOAA Space Weather</h2>
          </div>
          {sErr ? <div style={{ color: "#ef4444", fontSize: 12 }}>Unable to load</div>
            : !sw ? <div style={{ color: B.textMid, fontSize: 12 }}>Loading...</div>
            : (
              <div>
                <div style={{ display: "flex", gap: 24, marginBottom: 14, justifyContent: "center" }}>
                  <GaugeRing level={`G${gS}`} label="Geomag" />
                  <GaugeRing level={`S${sS}`} label="Solar Rad" />
                  <GaugeRing level={`R${rS}`} label="Radio" />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ l: "SOLAR WIND", v: sw.wind?.WindSpeed || "--", u: "km/s" }, { l: "MAG BT", v: sw.mag?.Bt || "--", u: "nT" }, { l: "Bz", v: sw.mag?.Bz || "--", u: "nT", c: parseFloat(sw.mag?.Bz || 0) < 0 ? B.acc : B.priBr }, { l: "10.7CM FLUX", v: sw.flux?.Flux || "--", u: "sfu" }].map(x => (
                    <div key={x.l} style={{ flex: 1, ...insetStyle, padding: 6, textAlign: "center" }}>
                      <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 2 }}>{x.l}</div>
                      <div style={{ fontFamily: B.display, fontSize: 18, fontWeight: 800, color: x.c || B.text, margin: "2px 0" }}>{x.v}</div>
                      <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim }}>{x.u}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Telemetry Row */}
      {sw && !sErr && (
        <div className="cmd-telemetry" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, letterSpacing: 2, marginBottom: 4 }}>SOLAR FLUX (F10.7)</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: B.pri, fontFamily: B.display }}>{sw.flux?.Flux || "--"}</div>
            <div style={{ fontSize: 11, color: B.textMid }}>sfu</div>
            <div style={{ height: 4, background: B.border, borderRadius: 2, marginTop: 8 }}>
              <div style={{ height: 4, borderRadius: 2, background: B.pri, width: `${Math.min(100, Math.max(2, ((parseFloat(sw.flux?.Flux) || 70) - 60) / 1.4))}%`, transition: "width .3s" }} />
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, letterSpacing: 2, marginBottom: 4 }}>X-RAY INTENSITY</div>
            {(() => {
              const entries = (sw.xray || []).filter(e => e.energy === "0.1-0.8nm");
              const last = entries[entries.length - 1];
              const xr = xrayClass(last?.flux);
              return (<>
                <div style={{ fontSize: 36, fontWeight: 800, color: xr.color, fontFamily: B.display }}>{xr.cls}</div>
                <div style={{ fontSize: 11, color: B.textMid }}>GOES 1-8 {"\u212B"}</div>
                {(xr.cls.startsWith("M") || xr.cls.startsWith("X")) && <div style={{ width: 8, height: 8, borderRadius: "50%", background: xr.color, display: "inline-block", marginTop: 6, animation: "pulse-ring 1.5s ease-in-out infinite" }} />}
              </>);
            })()}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 10, color: B.textDim, fontFamily: B.font, letterSpacing: 2, marginBottom: 4 }}>SOLAR WIND</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: B.priBr, fontFamily: B.display }}>{sw.wind?.WindSpeed || "--"}</div>
            <div style={{ fontSize: 11, color: B.textMid }}>km/s</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11 }}>
              <span style={{ color: B.textMid }}>Bt <b style={{ color: B.text }}>{sw.mag?.Bt || "--"}</b> nT</span>
              <span style={{ color: B.textMid }}>Bz <b style={{ color: parseFloat(sw.mag?.Bz || 0) < 0 ? B.acc : B.priBr }}>{sw.mag?.Bz || "--"}</b> nT</span>
            </div>
          </div>
        </div>
      )}

      {/* Kp Index */}
      <div style={{ ...cardStyle, marginBottom: 12 }}>
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

      {/* Mag Dec + Stations */}
      <div className="cmd-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12, alignItems: "start" }}>
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
        <div>
          <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 2, marginBottom: 8 }}>STATIONS</div>
          <div className="cmd-stations" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
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
    </div>
  );
}
