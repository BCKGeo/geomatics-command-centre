import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { vincentyInverse, ddToDms, dmsToDd } from "../../geo.js";
import { DEFAULT_LAT, DEFAULT_LON } from "../../data/constants.js";

export function InverseCalc() {
  const { B } = useTheme();
  const [mode, setMode] = useState("dd");
  const [aLat, setALat] = useState(String(DEFAULT_LAT));
  const [aLon, setALon] = useState(String(DEFAULT_LON));
  const [bLat, setBLat] = useState("43.6532");
  const [bLon, setBLon] = useState("-79.3832");
  // DMS state for A
  const [aLatD, setALatD] = useState("45"); const [aLatM, setALatM] = useState("25"); const [aLatS, setALatS] = useState("17.40"); const [aLatDir, setALatDir] = useState("N");
  const [aLonD, setALonD] = useState("75"); const [aLonM, setALonM] = useState("41"); const [aLonS, setALonS] = useState("49.92"); const [aLonDir, setALonDir] = useState("W");
  // DMS state for B
  const [bLatD, setBLatD] = useState("43"); const [bLatM, setBLatM] = useState("39"); const [bLatS, setBLatS] = useState("11.52"); const [bLatDir, setBLatDir] = useState("N");
  const [bLonD, setBLonD] = useState("79"); const [bLonM, setBLonM] = useState("22"); const [bLonS, setBLonS] = useState("59.52"); const [bLonDir, setBLonDir] = useState("W");
  const [copied, setCopied] = useState("");

  let latA, lonA, latB, lonB;
  if (mode === "dd") {
    latA = parseFloat(aLat) || 0; lonA = parseFloat(aLon) || 0;
    latB = parseFloat(bLat) || 0; lonB = parseFloat(bLon) || 0;
  } else {
    latA = dmsToDd(parseInt(aLatD) || 0, parseInt(aLatM) || 0, parseFloat(aLatS) || 0, aLatDir === "N" ? 1 : -1);
    lonA = dmsToDd(parseInt(aLonD) || 0, parseInt(aLonM) || 0, parseFloat(aLonS) || 0, aLonDir === "E" ? 1 : -1);
    latB = dmsToDd(parseInt(bLatD) || 0, parseInt(bLatM) || 0, parseFloat(bLatS) || 0, bLatDir === "N" ? 1 : -1);
    lonB = dmsToDd(parseInt(bLonD) || 0, parseInt(bLonM) || 0, parseFloat(bLonS) || 0, bLonDir === "E" ? 1 : -1);
  }

  const valid = latA >= -90 && latA <= 90 && lonA >= -180 && lonA <= 180 && latB >= -90 && latB <= 90 && lonB >= -180 && lonB <= 180;
  const result = valid ? vincentyInverse(latA, lonA, latB, lonB) : null;

  const fmtDms = (dd) => { const d = ddToDms(Math.abs(dd)); return `${d.d}\u00B0 ${d.mAdj}' ${d.s.toFixed(2)}"`; };
  const fmtDist = (m) => m >= 1000 ? `${m.toFixed(3)} m (${(m / 1000).toFixed(3)} km)` : `${m.toFixed(3)} m`;

  const switchMode = (m) => {
    if (m === mode) return;
    if (m === "dms") {
      const la = ddToDms(parseFloat(aLat) || 0), lo = ddToDms(Math.abs(parseFloat(aLon) || 0));
      setALatD(String(la.d)); setALatM(String(la.mAdj)); setALatS(String(la.s)); setALatDir((parseFloat(aLat) || 0) >= 0 ? "N" : "S");
      setALonD(String(lo.d)); setALonM(String(lo.mAdj)); setALonS(String(lo.s)); setALonDir((parseFloat(aLon) || 0) >= 0 ? "E" : "W");
      const lb = ddToDms(parseFloat(bLat) || 0), lob = ddToDms(Math.abs(parseFloat(bLon) || 0));
      setBLatD(String(lb.d)); setBLatM(String(lb.mAdj)); setBLatS(String(lb.s)); setBLatDir((parseFloat(bLat) || 0) >= 0 ? "N" : "S");
      setBLonD(String(lob.d)); setBLonM(String(lob.mAdj)); setBLonS(String(lob.s)); setBLonDir((parseFloat(bLon) || 0) >= 0 ? "E" : "W");
    } else {
      setALat(latA.toFixed(6)); setALon(lonA.toFixed(6));
      setBLat(latB.toFixed(6)); setBLon(lonB.toFixed(6));
    }
    setMode(m);
  };

  const copyText = (txt, label) => { try { navigator.clipboard.writeText(txt); setCopied(label); setTimeout(() => setCopied(""), 1500); } catch {} };

  const inp = { background: B.bg, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "4px 8px", color: B.text, fontSize: 16, outline: "none", fontFamily: B.font, boxSizing: "border-box" };
  const dmsInp = { ...inp, width: "100%", maxWidth: 48, textAlign: "center" };
  const toggleBtn = (active) => ({ padding: "4px 10px", fontSize: 11, fontWeight: active ? 700 : 400, fontFamily: B.font, color: active ? B.bg : B.textMid, background: active ? B.priBr : "transparent", border: `1px solid ${active ? B.priBr : B.border}`, borderRadius: 3, cursor: "pointer" });
  const outRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderRadius: 4, background: B.bg, border: `1px solid ${B.border}`, marginBottom: 4 };
  const copyBtn = (txt, label) => <button onClick={() => copyText(txt, label)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: copied === label ? B.priBr : B.textDim, fontFamily: B.font, padding: "2px 6px" }}>{copied === label ? "\u2713" : "\uD83D\uDCCB"}</button>;

  // SVG visualizer
  const renderSvg = () => {
    if (!result || !result.converged || result.distance === 0) return null;
    const sz = 220, cx = sz / 2, cy = sz / 2, r = 80;
    const fwdRad = (result.fwdAzimuth - 90) * Math.PI / 180;
    const revRad = (result.revAzimuth - 90) * Math.PI / 180;
    // Place A at center-left, B relative to A based on azimuth
    const ax = cx - 40, ay = cy + 20;
    const bx = ax + r * Math.sin(result.fwdAzimuth * Math.PI / 180);
    const by = ay - r * Math.cos(result.fwdAzimuth * Math.PI / 180);
    // Azimuth arc at A (from north)
    const arcR = 28;
    const northAx = ax, northAy = ay - arcR;
    const fwdArcX = ax + arcR * Math.sin(result.fwdAzimuth * Math.PI / 180);
    const fwdArcY = ay - arcR * Math.cos(result.fwdAzimuth * Math.PI / 180);
    const largeArc = result.fwdAzimuth > 180 ? 1 : 0;

    return (
      <svg viewBox={`0 0 ${sz} ${sz}`} width="100%" style={{ maxWidth: 280 }} preserveAspectRatio="xMidYMid meet">
        <rect width={sz} height={sz} fill="none" />
        {/* North arrow at A */}
        <line x1={ax} y1={ay} x2={ax} y2={ay - 50} stroke={B.textDim} strokeWidth={1} strokeDasharray="3,3" />
        <polygon points={`${ax},${ay - 55} ${ax - 4},${ay - 45} ${ax + 4},${ay - 45}`} fill={B.textDim} />
        <text x={ax + 6} y={ay - 48} fill={B.textDim} fontSize={11} fontFamily={B.font}>N</text>
        {/* Azimuth arc */}
        <path d={`M ${northAx} ${northAy} A ${arcR} ${arcR} 0 ${largeArc} 1 ${fwdArcX} ${fwdArcY}`} fill="none" stroke={B.acc} strokeWidth={1.5} />
        <text x={(northAx + fwdArcX) / 2 + 10} y={(northAy + fwdArcY) / 2} fill={B.acc} fontSize={11} fontWeight="600" fontFamily={B.font}>{result.fwdAzimuth.toFixed(1)}{"\u00B0"}</text>
        {/* Connection line */}
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke={B.priBr} strokeWidth={1.5} strokeDasharray="5,3" />
        {/* Distance label */}
        <text x={(ax + bx) / 2 + 8} y={(ay + by) / 2 - 8} fill={B.text} fontSize={11} fontWeight="600" fontFamily={B.font}>{result.distance >= 1000 ? (result.distance / 1000).toFixed(1) + " km" : result.distance.toFixed(1) + " m"}</text>
        {/* Points */}
        <circle cx={ax} cy={ay} r={5} fill={B.priBr} />
        <text x={ax - 14} y={ay + 16} fill={B.priBr} fontSize={12} fontWeight="700" fontFamily={B.font}>A</text>
        <circle cx={bx} cy={by} r={5} fill={B.gold} />
        <text x={bx + 8} y={by + 5} fill={B.gold} fontSize={12} fontWeight="700" fontFamily={B.font}>B</text>
      </svg>
    );
  };

  const dmsPoint = (label, latD, latM, latS, latDir, setLatD, setLatM, setLatS, setLatDir, lonD, lonM, lonS, lonDir, setLonD, setLonM, setLonS, setLonDir) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: B.textDim, marginBottom: 3, fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
        <label style={{ fontSize: 10, color: B.textDim, width: 24 }}>Lat</label>
        <input value={latD} onChange={e => setLatD(e.target.value)} style={dmsInp} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u00B0"}</span>
        <input value={latM} onChange={e => setLatM(e.target.value)} style={dmsInp} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u2032"}</span>
        <input value={latS} onChange={e => setLatS(e.target.value)} inputMode="decimal" style={{ ...dmsInp, maxWidth: 60 }} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u2033"}</span>
        <button onClick={() => setLatDir(d => d === "N" ? "S" : "N")} style={{ ...inp, width: 28, textAlign: "center", cursor: "pointer", fontWeight: 700, color: B.priBr }}>{latDir}</button>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontSize: 10, color: B.textDim, width: 24 }}>Lon</label>
        <input value={lonD} onChange={e => setLonD(e.target.value)} style={dmsInp} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u00B0"}</span>
        <input value={lonM} onChange={e => setLonM(e.target.value)} style={dmsInp} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u2032"}</span>
        <input value={lonS} onChange={e => setLonS(e.target.value)} inputMode="decimal" style={{ ...dmsInp, maxWidth: 60 }} /><span style={{ fontSize: 11, color: B.textDim }}>{"\u2033"}</span>
        <button onClick={() => setLonDir(d => d === "E" ? "W" : "E")} style={{ ...inp, width: 28, textAlign: "center", cursor: "pointer", fontWeight: 700, color: B.priBr }}>{lonDir}</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 11, color: B.textMid, marginBottom: 4 }}>Geodesic distance and bearing between two points (Vincenty inverse on GRS80).</div>
      <div style={{ fontSize: 10, color: B.textDim, marginBottom: 8 }}>NAD83(CSRS) {"\u00B7"} GRS80</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        <button onClick={() => switchMode("dd")} style={toggleBtn(mode === "dd")}>DD</button>
        <button onClick={() => switchMode("dms")} style={toggleBtn(mode === "dms")}>DMS</button>
      </div>
      <div className="cmd-split" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>
        <div>
          {mode === "dd" ? (
            <div>
              <div style={{ fontSize: 10, color: B.textDim, marginBottom: 3, fontWeight: 600 }}>Point A</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ fontSize: 11, color: B.textMid }}>Lat</label><input value={aLat} onChange={e => setALat(e.target.value)} inputMode="decimal" style={{ ...inp, width: "100%", maxWidth: 130, flex: 1, minWidth: 80 }} />
                <label style={{ fontSize: 11, color: B.textMid }}>Lon</label><input value={aLon} onChange={e => setALon(e.target.value)} inputMode="decimal" style={{ ...inp, width: "100%", maxWidth: 130, flex: 1, minWidth: 80 }} />
              </div>
              <div style={{ fontSize: 10, color: B.textDim, marginBottom: 3, fontWeight: 600 }}>Point B</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ fontSize: 11, color: B.textMid }}>Lat</label><input value={bLat} onChange={e => setBLat(e.target.value)} inputMode="decimal" style={{ ...inp, width: "100%", maxWidth: 130, flex: 1, minWidth: 80 }} />
                <label style={{ fontSize: 11, color: B.textMid }}>Lon</label><input value={bLon} onChange={e => setBLon(e.target.value)} inputMode="decimal" style={{ ...inp, width: "100%", maxWidth: 130, flex: 1, minWidth: 80 }} />
              </div>
            </div>
          ) : (
            <div>
              {dmsPoint("Point A", aLatD, aLatM, aLatS, aLatDir, setALatD, setALatM, setALatS, setALatDir, aLonD, aLonM, aLonS, aLonDir, setALonD, setALonM, setALonS, setALonDir)}
              {dmsPoint("Point B", bLatD, bLatM, bLatS, bLatDir, setBLatD, setBLatM, setBLatS, setBLatDir, bLonD, bLonM, bLonS, bLonDir, setBLonD, setBLonM, setBLonS, setBLonDir)}
            </div>
          )}
          {/* Results */}
          {result && result.converged ? (
            <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 10, marginTop: 4 }}>
              <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Results</div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>Distance</span>
                <span style={{ fontFamily: B.font, fontSize: 12, color: B.priBr, flex: 1, fontWeight: 600 }}>{fmtDist(result.distance)}</span>
                {copyBtn(result.distance.toFixed(3), "dist")}
              </div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>Fwd Az A{"\u2192"}B</span>
                <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{result.fwdAzimuth.toFixed(6)}{"\u00B0"} ({fmtDms(result.fwdAzimuth)})</span>
                {copyBtn(result.fwdAzimuth.toFixed(6), "fwd")}
              </div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>Rev Az B{"\u2192"}A</span>
                <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{result.revAzimuth.toFixed(6)}{"\u00B0"} ({fmtDms(result.revAzimuth)})</span>
                {copyBtn(result.revAzimuth.toFixed(6), "rev")}
              </div>
            </div>
          ) : result && !result.converged ? (
            <div style={{ marginTop: 10, padding: 8, background: "#ef444420", border: "1px solid #ef444440", borderRadius: 4, fontSize: 11, color: B.text }}>
              Points are nearly antipodal {"\u2014"} Vincenty does not converge for this geometry.
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
          {renderSvg()}
        </div>
      </div>
    </div>
  );
}
