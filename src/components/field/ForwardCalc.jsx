import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { vincentyDirect, ddToDms, dmsToDd, geoToUtm, getUtmZone } from "../../geo.js";
import { DEFAULT_LAT, DEFAULT_LON } from "../../data/constants.js";

export function ForwardCalc() {
  const { B } = useTheme();
  const [mode, setMode] = useState("dd");
  const [ddLat, setDdLat] = useState(String(DEFAULT_LAT));
  const [ddLon, setDdLon] = useState(String(DEFAULT_LON));
  const [dLatD, setDLatD] = useState("45"); const [dLatM, setDLatM] = useState("25"); const [dLatS, setDLatS] = useState("17.40"); const [dLatDir, setDLatDir] = useState("N");
  const [dLonD, setDLonD] = useState("75"); const [dLonM, setDLonM] = useState("41"); const [dLonS, setDLonS] = useState("49.92"); const [dLonDir, setDLonDir] = useState("W");
  const [azimuth, setAzimuth] = useState("45");
  const [distance, setDistance] = useState("10000");
  const [copied, setCopied] = useState("");

  let lat1, lon1;
  if (mode === "dd") {
    lat1 = parseFloat(ddLat) || 0; lon1 = parseFloat(ddLon) || 0;
  } else {
    lat1 = dmsToDd(parseInt(dLatD) || 0, parseInt(dLatM) || 0, parseFloat(dLatS) || 0, dLatDir === "N" ? 1 : -1);
    lon1 = dmsToDd(parseInt(dLonD) || 0, parseInt(dLonM) || 0, parseFloat(dLonS) || 0, dLonDir === "E" ? 1 : -1);
  }

  const az = parseFloat(azimuth);
  const dist = parseFloat(distance);
  const valid = lat1 >= -90 && lat1 <= 90 && lon1 >= -180 && lon1 <= 180 && !isNaN(az) && !isNaN(dist) && dist >= 0;
  const result = valid ? vincentyDirect(lat1, lon1, az, dist) : null;
  const utm = result ? geoToUtm(result.lat, result.lon) : null;

  const fmtDms = (dd) => { const d = ddToDms(Math.abs(dd)); return `${d.d}\u00B0 ${d.mAdj}' ${d.s.toFixed(2)}"`; };
  const fmtDist = (m) => m >= 1000 ? `${m.toFixed(3)} m (${(m / 1000).toFixed(3)} km)` : `${m.toFixed(3)} m`;

  const switchMode = (m) => {
    if (m === mode) return;
    if (m === "dms") {
      const la = ddToDms(parseFloat(ddLat) || 0), lo = ddToDms(Math.abs(parseFloat(ddLon) || 0));
      setDLatD(String(la.d)); setDLatM(String(la.mAdj)); setDLatS(String(la.s)); setDLatDir((parseFloat(ddLat) || 0) >= 0 ? "N" : "S");
      setDLonD(String(lo.d)); setDLonM(String(lo.mAdj)); setDLonS(String(lo.s)); setDLonDir((parseFloat(ddLon) || 0) >= 0 ? "E" : "W");
    } else {
      setDdLat(lat1.toFixed(6)); setDdLon(lon1.toFixed(6));
    }
    setMode(m);
  };

  const copyText = (txt, label) => { try { navigator.clipboard.writeText(txt); setCopied(label); setTimeout(() => setCopied(""), 1500); } catch {} };

  const inp = { background: B.bg, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "4px 8px", color: B.text, fontSize: 12, outline: "none", fontFamily: B.font };
  const dmsInp = { ...inp, width: 48, textAlign: "center" };
  const toggleBtn = (active) => ({ padding: "4px 10px", fontSize: 11, fontWeight: active ? 700 : 400, fontFamily: B.font, color: active ? B.bg : B.textMid, background: active ? B.priBr : "transparent", border: `1px solid ${active ? B.priBr : B.border}`, borderRadius: 3, cursor: "pointer" });
  const outRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderRadius: 4, background: B.bg, border: `1px solid ${B.border}`, marginBottom: 4 };
  const copyBtn = (txt, label) => <button onClick={() => copyText(txt, label)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: copied === label ? B.priBr : B.textDim, fontFamily: B.font, padding: "2px 6px" }}>{copied === label ? "\u2713" : "\uD83D\uDCCB"}</button>;

  // SVG
  const renderSvg = () => {
    if (!result || dist === 0) return null;
    const sz = 220, ax = 60, ay = 160;
    const azRad = az * Math.PI / 180;
    const bx = ax + 100 * Math.sin(azRad);
    const by = ay - 100 * Math.cos(azRad);
    // Extension of bearing ray past B
    const ex = ax + 130 * Math.sin(azRad);
    const ey = ay - 130 * Math.cos(azRad);
    // Azimuth arc
    const arcR = 30;
    const northX = ax, northY = ay - arcR;
    const arcEndX = ax + arcR * Math.sin(azRad);
    const arcEndY = ay - arcR * Math.cos(azRad);
    const largeArc = az > 180 ? 1 : 0;

    return (
      <svg viewBox={`0 0 ${sz} ${sz}`} width="100%" style={{ maxWidth: 220 }} preserveAspectRatio="xMidYMid meet">
        <rect width={sz} height={sz} fill="none" />
        {/* North arrow */}
        <line x1={ax} y1={ay} x2={ax} y2={ay - 55} stroke={B.textDim} strokeWidth={1} strokeDasharray="3,3" />
        <polygon points={`${ax},${ay - 60} ${ax - 4},${ay - 50} ${ax + 4},${ay - 50}`} fill={B.textDim} />
        <text x={ax + 6} y={ay - 52} fill={B.textDim} fontSize={9} fontFamily={B.font}>N</text>
        {/* Bearing ray */}
        <line x1={ax} y1={ay} x2={ex} y2={ey} stroke={B.textMid} strokeWidth={1} strokeDasharray="4,3" />
        {/* Main line A to B */}
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke={B.priBr} strokeWidth={1.5} />
        {/* Azimuth arc */}
        <path d={`M ${northX} ${northY} A ${arcR} ${arcR} 0 ${largeArc} 1 ${arcEndX} ${arcEndY}`} fill="none" stroke={B.acc} strokeWidth={1.5} />
        <text x={(northX + arcEndX) / 2 + 10} y={(northY + arcEndY) / 2} fill={B.acc} fontSize={9} fontFamily={B.font}>{az.toFixed(1)}{"\u00B0"}</text>
        {/* Distance label */}
        <text x={(ax + bx) / 2 + 8} y={(ay + by) / 2 - 4} fill={B.text} fontSize={9} fontFamily={B.font}>{dist >= 1000 ? (dist / 1000).toFixed(1) + " km" : dist.toFixed(0) + " m"}</text>
        {/* Points */}
        <circle cx={ax} cy={ay} r={4} fill={B.priBr} />
        <text x={ax - 14} y={ay + 14} fill={B.priBr} fontSize={10} fontWeight="700" fontFamily={B.font}>A</text>
        <circle cx={bx} cy={by} r={4} fill={B.gold} />
        <text x={bx + 6} y={by + 4} fill={B.gold} fontSize={10} fontWeight="700" fontFamily={B.font}>B</text>
      </svg>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: B.textMid, marginBottom: 4 }}>Compute destination from start point, bearing, and distance (Vincenty direct on GRS80).</div>
      <div style={{ fontSize: 10, color: B.textDim, marginBottom: 8 }}>NAD83(CSRS) {"\u00B7"} GRS80</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        <button onClick={() => switchMode("dd")} style={toggleBtn(mode === "dd")}>DD</button>
        <button onClick={() => switchMode("dms")} style={toggleBtn(mode === "dms")}>DMS</button>
      </div>
      <div className="cmd-split" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: B.textDim, marginBottom: 3, fontWeight: 600 }}>Origin Point</div>
          {mode === "dd" ? (
            <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ fontSize: 11, color: B.textMid }}>Lat</label><input value={ddLat} onChange={e => setDdLat(e.target.value)} style={{ ...inp, width: 120 }} />
              <label style={{ fontSize: 11, color: B.textMid }}>Lon</label><input value={ddLon} onChange={e => setDdLon(e.target.value)} style={{ ...inp, width: 120 }} />
            </div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                <label style={{ fontSize: 10, color: B.textDim, width: 24 }}>Lat</label>
                <input value={dLatD} onChange={e => setDLatD(e.target.value)} style={dmsInp} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u00B0"}</span>
                <input value={dLatM} onChange={e => setDLatM(e.target.value)} style={dmsInp} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u2032"}</span>
                <input value={dLatS} onChange={e => setDLatS(e.target.value)} style={{ ...dmsInp, width: 60 }} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u2033"}</span>
                <button onClick={() => setDLatDir(d => d === "N" ? "S" : "N")} style={{ ...inp, width: 28, textAlign: "center", cursor: "pointer", fontWeight: 700, color: B.priBr }}>{dLatDir}</button>
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ fontSize: 10, color: B.textDim, width: 24 }}>Lon</label>
                <input value={dLonD} onChange={e => setDLonD(e.target.value)} style={dmsInp} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u00B0"}</span>
                <input value={dLonM} onChange={e => setDLonM(e.target.value)} style={dmsInp} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u2032"}</span>
                <input value={dLonS} onChange={e => setDLonS(e.target.value)} style={{ ...dmsInp, width: 60 }} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u2033"}</span>
                <button onClick={() => setDLonDir(d => d === "E" ? "W" : "E")} style={{ ...inp, width: 28, textAlign: "center", cursor: "pointer", fontWeight: 700, color: B.priBr }}>{dLonDir}</button>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 11, color: B.textMid }}>Azimuth ({"\u00B0"})</label>
            <input value={azimuth} onChange={e => setAzimuth(e.target.value)} style={{ ...inp, width: 90 }} />
            <label style={{ fontSize: 11, color: B.textMid }}>Distance (m)</label>
            <input value={distance} onChange={e => setDistance(e.target.value)} style={{ ...inp, width: 110 }} />
          </div>
          {result && (
            <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 10 }}>
              <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Destination</div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>DD</span>
                <span style={{ fontFamily: B.font, fontSize: 12, color: B.priBr, flex: 1, fontWeight: 600 }}>{result.lat.toFixed(6)}{"\u00B0"}, {result.lon.toFixed(6)}{"\u00B0"}</span>
                {copyBtn(`${result.lat.toFixed(6)}, ${result.lon.toFixed(6)}`, "dd")}
              </div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>DMS</span>
                <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{fmtDms(result.lat)} {result.lat >= 0 ? "N" : "S"}, {fmtDms(result.lon)} {result.lon >= 0 ? "E" : "W"}</span>
                {copyBtn(`${fmtDms(result.lat)} ${result.lat >= 0 ? "N" : "S"}, ${fmtDms(result.lon)} ${result.lon >= 0 ? "E" : "W"}`, "dms")}
              </div>
              {utm && (
                <div style={outRow}>
                  <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>UTM</span>
                  <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{utm.zone}{utm.hemi} {utm.easting.toFixed(2)} E {utm.northing.toFixed(2)} N</span>
                  {copyBtn(`${utm.zone}${utm.hemi} ${utm.easting.toFixed(2)} E ${utm.northing.toFixed(2)} N`, "utm")}
                </div>
              )}
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>Rev Azimuth</span>
                <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{result.revAzimuth.toFixed(6)}{"\u00B0"} ({fmtDms(result.revAzimuth)})</span>
                {copyBtn(result.revAzimuth.toFixed(6), "rev")}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
          {renderSvg()}
        </div>
      </div>
    </div>
  );
}
