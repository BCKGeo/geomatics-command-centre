import { useMemo } from "react";
import { FreshBadge } from "./FreshBadge.jsx";
import { sunEvents } from "../../lib/astronomy.js";
import {
  SOURCES, WORKING_ALONE, workSafeLinks,
  uvBand, aqhiBand, pm25Band, humidex, humidexBand, windChill, windChillBand, usableHours, fmtHours,
} from "../../lib/fieldSafety.js";
import { PROVINCES } from "../../data/jurisdictions/index.js";

const WORKSAFE = workSafeLinks(PROVINCES);

const TZ_SHORT = (() => { try { return new Date().toLocaleTimeString("en-CA", { timeZoneName: "short" }).split(" ").pop(); } catch { return ""; } })();

function fmtTime(d) {
  return d instanceof Date ? d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--";
}

// One band readout: big value, band label in its colour, one line of advice.
function Band({ B, value, unit, band, sub }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: B.display, fontSize: 26, fontWeight: 800, color: band?.color || B.textDim, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 10, color: B.textDim }}>{unit}</span>}
        <span style={{ fontSize: 11, fontWeight: 700, color: band?.color || B.textDim }}>{band?.label || "No data"}</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: B.textMid, marginTop: 4, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  );
}

function Card({ B, cardStyle, icon, title, right, children }) {
  return (
    <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>{title}</h2>
        {right && <span style={{ fontSize: 10, color: B.textDim, marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>{right}</span>}
      </div>
      {children}
    </div>
  );
}

// Field Safety card group on the Command Centre (direction record item 2).
// Reads the weather, AQHI and air quality feeds the page already polls; the
// bands and their Tier A sources live in lib/fieldSafety.js. Nothing is
// stored and nothing is timed.
export function FieldSafety({ B, cardStyle, insetStyle, lat, lon, wx, wxUpdated, wErr, aqhi, aqhiUpdated, aq, aqUpdated }) {
  const cur = wx?.current || {}, dy = wx?.daily || {};

  const uvNow = cur.uv_index, uvMax = dy.uv_index_max?.[0];
  const uvB = uvBand(uvNow), uvMaxB = uvBand(uvMax);

  const aqB = aqhiBand(aqhi?.aqhi);
  const pmB = pm25Band(aq?.pm25);

  const hx = humidex(cur.temperature_2m, cur.dew_point_2m);
  // ECCC reports humidex only from 25 and when it exceeds the air temperature
  const hxShown = hx != null && hx >= 25 && hx > cur.temperature_2m;
  const hxB = hxShown ? humidexBand(hx) : null;
  const wc = windChill(cur.temperature_2m, cur.wind_speed_10m);
  const wcB = windChillBand(wc);

  const dayKey = new Date().toDateString();
  const sun = useMemo(() => sunEvents(new Date(), lat, lon), [lat, lon, dayKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const usable = usableHours(sun.civilDawn, sun.civilDusk);
  const dayLen = usableHours(sun.sunrise, sun.sunset);

  const wxState = wErr ? "Unable to load" : !wx ? "Loading..." : null;
  const openMeteo = <>Open-Meteo <FreshBadge lastUpdated={wxUpdated} interval={6e5} /></>;

  return (
    <div id="safety" style={{ marginBottom: 12, scrollMarginTop: 80 }}>
      <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 2, marginBottom: 8 }}>FIELD SAFETY</div>
      <div className="cmd-safety" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, alignItems: "stretch" }}>

        {/* UV */}
        <Card B={B} cardStyle={cardStyle} icon={"☀️"} title="UV Index" right={openMeteo}>
          {wxState ? <div style={{ color: wErr ? "#ef4444" : B.textMid, fontSize: 12 }}>{wxState}</div> : (<>
            <Band B={B} value={uvNow != null ? Math.round(uvNow) : "--"} unit="now" band={uvB} sub={uvB?.advice} />
            <div style={{ ...insetStyle, padding: "6px 8px", display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: B.textMid }}>
              <span style={{ fontFamily: B.font, letterSpacing: 1, color: B.textDim }}>TODAY PEAK</span>
              <span style={{ fontFamily: B.display, fontSize: 16, fontWeight: 800, color: uvMaxB?.color || B.textDim }}>{uvMax != null ? Math.round(uvMax) : "--"}</span>
              <span style={{ color: uvMaxB?.color || B.textDim, fontWeight: 600 }}>{uvMaxB?.label || ""}</span>
            </div>
            <div style={{ fontSize: 9, color: B.textDim }}>ECCC bands: 0 to 2 low, 3 to 5 moderate, 6 to 7 high, 8 to 10 very high, 11+ extreme. Snow and water reflect UV.</div>
          </>)}
        </Card>

        {/* Air quality and smoke */}
        <Card B={B} cardStyle={cardStyle} icon={"🌫️"} title="Air Quality & Smoke" right={aqhi ? <>ECCC {aqhi.station} <FreshBadge lastUpdated={aqhiUpdated} interval={18e5} /></> : "ECCC AQHI"}>
          <Band B={B} value={aqB ? Math.round(aqhi.aqhi) : "--"} unit="AQHI" band={aqB} sub={aqB ? aqB.general : "No AQHI station within about 50 km. Use the PM2.5 line."} />
          {aqB && <div style={{ fontSize: 10, color: B.textMid, lineHeight: 1.45 }}><b style={{ color: B.text }}>At risk:</b> {aqB.atRisk}</div>}
          <div style={{ ...insetStyle, padding: "6px 8px", fontSize: 10, color: B.textMid }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: B.font, letterSpacing: 1, color: B.textDim }}>PM2.5</span>
              <span style={{ fontFamily: B.display, fontSize: 16, fontWeight: 800, color: pmB?.color || B.textDim }}>{aq?.pm25 != null ? aq.pm25.toFixed(0) : "--"}</span>
              <span style={{ color: B.textDim }}>{"µg/m³"}</span>
              <span style={{ color: pmB?.color || B.textDim, fontWeight: 600 }}>{pmB?.label || (aq === null ? "No data" : "Loading")}</span>
              <span style={{ marginLeft: "auto" }}><FreshBadge lastUpdated={aqUpdated} interval={18e5} /></span>
            </div>
            {pmB && <div style={{ marginTop: 3 }}>{pmB.note}</div>}
          </div>
          <div style={{ fontSize: 9, color: B.textDim }}>AQHI 1 to 3 low, 4 to 6 moderate, 7 to 10 high, 10+ very high. PM2.5 is the Open-Meteo CAMS model hour, compared to the CAAQS 24-hour standard, so it is a smoke indicator, not a measurement.</div>
        </Card>

        {/* Heat and cold */}
        <Card B={B} cardStyle={cardStyle} icon={"🌡️"} title="Heat & Cold Stress" right={openMeteo}>
          {wxState ? <div style={{ color: wErr ? "#ef4444" : B.textMid, fontSize: 12 }}>{wxState}</div> : (<>
            {hxB ? <Band B={B} value={Math.round(hx)} unit="humidex" band={hxB} sub={hxB.advice} />
              : wcB ? <Band B={B} value={Math.round(wc)} unit="wind chill" band={wcB} sub={wcB.advice} />
              : <Band B={B} value={cur.temperature_2m != null ? `${Math.round(cur.temperature_2m)}°` : "--"} unit="C" band={{ label: "No stress index", color: "#22c55e" }} sub="Humidex (25 and up) and wind chill (10 C or colder with wind of 4.8 km/h or more) do not apply to these conditions." />}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px", fontSize: 10, color: B.textMid }}>
              <div>Air <b style={{ color: B.text }}>{cur.temperature_2m != null ? `${Math.round(cur.temperature_2m)}°C` : "--"}</b></div>
              <div>Dew point <b style={{ color: B.text }}>{cur.dew_point_2m != null ? `${Math.round(cur.dew_point_2m)}°C` : "--"}</b></div>
              <div>Wind <b style={{ color: B.text }}>{cur.wind_speed_10m != null ? `${Math.round(cur.wind_speed_10m)} km/h` : "--"}</b></div>
              <div>Feels like <b style={{ color: B.text }}>{cur.apparent_temperature != null ? `${Math.round(cur.apparent_temperature)}°C` : "--"}</b></div>
            </div>
            <div style={{ fontSize: 9, color: B.textDim }}>Humidex 30 to 39 some discomfort, 40 to 45 avoid exertion, 46+ dangerous. Wind chill -28 and colder: exposed skin freezes in 10 to 30 min, -40: 5 to 10 min, -48: 2 to 5 min. ECCC bands; formulas are the standard ECCC ones, not shown on the cited pages.</div>
          </>)}
        </Card>

        {/* Daylight */}
        <Card B={B} cardStyle={cardStyle} icon={"🌅"} title="Daylight" right={`device time zone ${TZ_SHORT}`}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: B.display, fontSize: 26, fontWeight: 800, color: B.gold, lineHeight: 1 }}>{sun.polarDay ? "24h" : fmtHours(usable)}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: B.textMid }}>{sun.polarDay ? "polar day" : sun.polarNight ? "polar night" : "usable field light"}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[["CIVIL DAWN", sun.civilDawn], ["SUNRISE", sun.sunrise], ["SUNSET", sun.sunset], ["CIVIL DUSK", sun.civilDusk]].map(([l, d]) => (
              <div key={l} style={{ ...insetStyle, padding: "4px 6px" }}>
                <div style={{ fontSize: 9, color: B.textDim, fontFamily: B.font, letterSpacing: 1 }}>{l}</div>
                <div style={{ fontFamily: B.display, fontSize: 14, fontWeight: 700, color: B.text }}>{fmtTime(d)}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: B.textDim }}>Sunrise to sunset {sun.polarDay ? "all day" : fmtHours(dayLen)}. Civil twilight is the sun 6{"°"} below the horizon, the usual limit for work without lights. Computed on the device for {Math.abs(lat).toFixed(2)}{"°"}{lat >= 0 ? "N" : "S"}, {Math.abs(lon).toFixed(2)}{"°"}{lon >= 0 ? "E" : "W"}.</div>
        </Card>

        {/* Working alone */}
        <Card B={B} cardStyle={cardStyle} icon={"📞"} title="Working Alone" right="WorkSafeBC OHSR 4.21, CCOHS">
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: B.textMid, lineHeight: 1.45, display: "flex", flexDirection: "column", gap: 3 }}>
            {WORKING_ALONE.map((w) => <li key={w.t}><b style={{ color: B.text }}>{w.t}.</b> {w.d}</li>)}
          </ul>
          <div style={{ fontSize: 9, color: B.textDim, fontFamily: B.font, letterSpacing: 1, marginTop: 2 }}>REGULATOR BY JURISDICTION</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {WORKSAFE.map((w) => (
              <a key={w.id} href={w.u} target="_blank" rel="noopener noreferrer" title={`${w.n}: ${w.d}`}
                style={{ ...insetStyle, padding: "3px 7px", fontSize: 10, fontFamily: B.font, fontWeight: 700, color: B.priBr, textDecoration: "none" }}>{w.abbr}</a>
            ))}
          </div>
        </Card>
      </div>

      {/* Source line, the same way the page credits NOAA and Open-Meteo */}
      <div style={{ fontSize: 9, color: B.textDim, marginTop: 8, lineHeight: 1.6 }}>
        Bands and duties from: {SOURCES.map((s, i) => (
          <span key={s.u}>{i > 0 && " · "}<a href={s.u} target="_blank" rel="noopener noreferrer" style={{ color: B.textMid }}>{s.n}</a> (read {s.read})</span>
        ))}. Live data: Open-Meteo (UV, dew point, wind, PM2.5 from CAMS), ECCC AQHI observations. Nothing on this card is stored.
      </div>
    </div>
  );
}
