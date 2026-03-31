import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { ddToDms, dmsToDd, geoToUtm, getUtmZone, utmCM, geoToTM, tmToGeo } from "../../geo.js";
import { DEFAULT_LAT, DEFAULT_LON } from "../../data/constants.js";

function solveIntersection(mode, latA, lonA, latB, lonB, valA, valB) {
  // Project both points into UTM zone of A
  const zone = getUtmZone(lonA), cm = utmCM(zone), k0 = 0.9996, fe = 500000, fn = latA >= 0 ? 0 : 1e7;
  const a = geoToTM(latA, lonA, cm, k0, fe, fn);
  const b = geoToTM(latB, lonB, cm, k0, fe, fn);
  const ax = a.easting, ay = a.northing, bx = b.easting, by = b.northing;

  const toGeo = (e, n) => {
    const g = tmToGeo(e, n, cm, k0, fe, fn);
    const u = geoToUtm(g.lat, g.lon);
    return { lat: g.lat, lon: g.lon, utm: u };
  };

  if (mode === "bearing-bearing") {
    const azA = valA * Math.PI / 180, azB = valB * Math.PI / 180;
    // Direction vectors (grid bearing: 0=north, 90=east)
    const dxA = Math.sin(azA), dyA = Math.cos(azA);
    const dxB = Math.sin(azB), dyB = Math.cos(azB);
    const det = dxA * dyB - dyA * dxB;
    if (Math.abs(det) < 1e-10) return { solutions: [], error: "Lines are parallel" };
    const t = ((bx - ax) * dyB - (by - ay) * dxB) / det;
    const ix = ax + t * dxA, iy = ay + t * dyA;
    return { solutions: [toGeo(ix, iy)] };
  }

  if (mode === "bearing-distance") {
    const azA = valA * Math.PI / 180;
    const dxA = Math.sin(azA), dyA = Math.cos(azA);
    const r = valB; // distance from B
    // Line-circle intersection: parameterize line from A as (ax+t*dxA, ay+t*dyA), circle centered at B with radius r
    const dx = ax - bx, dy = ay - by;
    const a2 = dxA * dxA + dyA * dyA; // should be 1
    const b2 = 2 * (dx * dxA + dy * dyA);
    const c2 = dx * dx + dy * dy - r * r;
    const disc = b2 * b2 - 4 * a2 * c2;
    if (disc < 0) return { solutions: [], error: "No intersection (line does not reach circle)" };
    const sqrtD = Math.sqrt(disc);
    const t1 = (-b2 + sqrtD) / (2 * a2);
    const t2 = (-b2 - sqrtD) / (2 * a2);
    const sols = [];
    if (t1 >= 0) sols.push(toGeo(ax + t1 * dxA, ay + t1 * dyA));
    if (Math.abs(disc) > 1e-6 && t2 >= 0) sols.push(toGeo(ax + t2 * dxA, ay + t2 * dyA));
    if (sols.length === 0) return { solutions: [], error: "No intersection in forward direction" };
    return { solutions: sols };
  }

  if (mode === "distance-distance") {
    const rA = valA, rB = valB;
    const d = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
    if (d > rA + rB) return { solutions: [], error: "Circles do not intersect (too far apart)" };
    if (d < Math.abs(rA - rB)) return { solutions: [], error: "One circle is inside the other" };
    if (d < 1e-10 && Math.abs(rA - rB) < 1e-10) return { solutions: [], error: "Circles are coincident" };
    const a3 = (rA * rA - rB * rB + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, rA * rA - a3 * a3));
    const px = ax + a3 * (bx - ax) / d;
    const py = ay + a3 * (by - ay) / d;
    const ox = h * (by - ay) / d;
    const oy = h * (bx - ax) / d;
    const sols = [toGeo(px + ox, py - oy)];
    if (h > 0.001) sols.push(toGeo(px - ox, py + oy));
    return { solutions: sols };
  }

  return { solutions: [], error: "Unknown mode" };
}

export function IntersectCalc() {
  const { B } = useTheme();
  const [calcMode, setCalcMode] = useState("bearing-bearing");
  const [aLat, setALat] = useState(String(DEFAULT_LAT));
  const [aLon, setALon] = useState(String(DEFAULT_LON));
  const [bLat, setBLat] = useState("43.6532");
  const [bLon, setBLon] = useState("-79.3832");
  const [valA, setValA] = useState("225"); // bearing or distance depending on mode
  const [valB, setValB] = useState("45");  // bearing or distance depending on mode
  const [copied, setCopied] = useState("");

  const latA = parseFloat(aLat) || 0, lonA = parseFloat(aLon) || 0;
  const latB = parseFloat(bLat) || 0, lonB = parseFloat(bLon) || 0;
  const vA = parseFloat(valA), vB = parseFloat(valB);
  const valid = latA >= -90 && latA <= 90 && lonA >= -180 && lonA <= 180 && latB >= -90 && latB <= 90 && lonB >= -180 && lonB <= 180 && !isNaN(vA) && !isNaN(vB);

  const result = valid ? solveIntersection(calcMode, latA, lonA, latB, lonB, vA, vB) : null;

  const fmtDms = (dd) => { const d = ddToDms(Math.abs(dd)); return `${d.d}\u00B0 ${d.mAdj}' ${d.s.toFixed(2)}"`; };

  const copyText = (txt, label) => { try { navigator.clipboard.writeText(txt); setCopied(label); setTimeout(() => setCopied(""), 1500); } catch {} };

  const inp = { background: B.bg, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "4px 8px", color: B.text, fontSize: 12, outline: "none", fontFamily: B.font };
  const outRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderRadius: 4, background: B.bg, border: `1px solid ${B.border}`, marginBottom: 4 };
  const toggleBtn = (active) => ({ padding: "4px 10px", fontSize: 11, fontWeight: active ? 700 : 400, fontFamily: B.font, color: active ? B.bg : B.textMid, background: active ? B.priBr : "transparent", border: `1px solid ${active ? B.priBr : B.border}`, borderRadius: 3, cursor: "pointer" });
  const copyBtn = (txt, label) => <button onClick={() => copyText(txt, label)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: copied === label ? B.priBr : B.textDim, fontFamily: B.font, padding: "2px 6px" }}>{copied === label ? "\u2713" : "\uD83D\uDCCB"}</button>;

  const labelA = calcMode === "distance-distance" ? "Distance from A (m)" : "Bearing from A (\u00B0)";
  const labelB = calcMode === "bearing-bearing" ? "Bearing from B (\u00B0)" : "Distance from B (m)";

  // SVG
  const renderSvg = () => {
    if (!valid) return null;
    const sz = 220, pad = 30;
    const ax = pad + 30, ay = sz - pad - 20;
    const bx = sz - pad - 30, by = sz - pad - 20;
    const hasSols = result && result.solutions.length > 0;

    // For bearing modes, draw bearing rays
    const drawRayA = calcMode !== "distance-distance";
    const drawRayB = calcMode === "bearing-bearing";
    const drawCircA = calcMode === "distance-distance";
    const drawCircB = calcMode !== "bearing-bearing";

    const azArad = drawRayA ? vA * Math.PI / 180 : 0;
    const azBrad = drawRayB ? vB * Math.PI / 180 : 0;
    const rayLen = 120;
    const circRA = 50, circRB = 50; // visual radii

    // Intersection point(s) -- place at fixed location for visual
    const solX = (ax + bx) / 2, solY = pad + 40;

    return (
      <svg viewBox={`0 0 ${sz} ${sz}`} width="100%" style={{ maxWidth: 220 }} preserveAspectRatio="xMidYMid meet">
        <rect width={sz} height={sz} fill="none" />
        {/* Bearing ray from A */}
        {drawRayA && <line x1={ax} y1={ay} x2={ax + rayLen * Math.sin(azArad)} y2={ay - rayLen * Math.cos(azArad)} stroke={B.textMid} strokeWidth={1} strokeDasharray="4,3" />}
        {/* Bearing ray from B */}
        {drawRayB && <line x1={bx} y1={by} x2={bx + rayLen * Math.sin(azBrad)} y2={by - rayLen * Math.cos(azBrad)} stroke={B.textMid} strokeWidth={1} strokeDasharray="4,3" />}
        {/* Circle from A */}
        {drawCircA && <circle cx={ax} cy={ay} r={circRA} fill="none" stroke={B.textMid} strokeWidth={1} strokeDasharray="4,3" />}
        {/* Circle from B */}
        {drawCircB && <circle cx={bx} cy={by} r={circRB} fill="none" stroke={B.textMid} strokeWidth={1} strokeDasharray="4,3" />}
        {/* Points A and B */}
        <circle cx={ax} cy={ay} r={4} fill={B.priBr} />
        <text x={ax - 4} y={ay + 16} fill={B.priBr} fontSize={10} fontWeight="700" fontFamily={B.font}>A</text>
        <circle cx={bx} cy={by} r={4} fill={B.priBr} />
        <text x={bx - 4} y={by + 16} fill={B.priBr} fontSize={10} fontWeight="700" fontFamily={B.font}>B</text>
        {/* Intersection point(s) */}
        {hasSols && (
          <>
            <circle cx={solX} cy={solY} r={5} fill={B.gold} style={{ animation: "pulse-ring 2s infinite" }} />
            <text x={solX + 8} y={solY + 4} fill={B.gold} fontSize={9} fontFamily={B.font} fontWeight="600">P1</text>
            {result.solutions.length > 1 && (
              <>
                <circle cx={solX + 40} cy={solY + 30} r={5} fill={B.gold} />
                <text x={solX + 50} y={solY + 34} fill={B.gold} fontSize={9} fontFamily={B.font} fontWeight="600">P2</text>
              </>
            )}
          </>
        )}
        {!hasSols && result && (
          <text x={sz / 2} y={sz / 2} fill={B.textDim} fontSize={10} fontFamily={B.font} textAnchor="middle">No solution</text>
        )}
        {/* Mode label */}
        <text x={sz / 2} y={sz - 8} fill={B.textDim} fontSize={8} fontFamily={B.font} textAnchor="middle">
          {calcMode === "bearing-bearing" ? "Bearing-Bearing" : calcMode === "bearing-distance" ? "Bearing-Distance" : "Distance-Distance"}
        </text>
      </svg>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: B.textMid, marginBottom: 4 }}>Find intersection point(s) from two lines or circles. Computed in UTM projection (accurate for distances &lt; 50 km).</div>
      <div style={{ fontSize: 10, color: B.textDim, marginBottom: 8 }}>Select intersection mode, then enter coordinates and bearing/distance values.</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
        <button onClick={() => { setCalcMode("bearing-bearing"); setValA("225"); setValB("45"); }} style={toggleBtn(calcMode === "bearing-bearing")}>Bearing-Bearing</button>
        <button onClick={() => { setCalcMode("bearing-distance"); setValA("225"); setValB("100000"); }} style={toggleBtn(calcMode === "bearing-distance")}>Bearing-Distance</button>
        <button onClick={() => { setCalcMode("distance-distance"); setValA("200000"); setValB("200000"); }} style={toggleBtn(calcMode === "distance-distance")}>Distance-Distance</button>
      </div>
      <div className="cmd-split" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: B.textDim, marginBottom: 3, fontWeight: 600 }}>Point A</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 11, color: B.textMid }}>Lat</label><input value={aLat} onChange={e => setALat(e.target.value)} style={{ ...inp, width: 110 }} />
            <label style={{ fontSize: 11, color: B.textMid }}>Lon</label><input value={aLon} onChange={e => setALon(e.target.value)} style={{ ...inp, width: 110 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 11, color: B.textMid }}>{labelA}</label>
            <input value={valA} onChange={e => setValA(e.target.value)} style={{ ...inp, width: 100 }} />
          </div>

          <div style={{ fontSize: 10, color: B.textDim, marginBottom: 3, fontWeight: 600 }}>Point B</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 11, color: B.textMid }}>Lat</label><input value={bLat} onChange={e => setBLat(e.target.value)} style={{ ...inp, width: 110 }} />
            <label style={{ fontSize: 11, color: B.textMid }}>Lon</label><input value={bLon} onChange={e => setBLon(e.target.value)} style={{ ...inp, width: 110 }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 11, color: B.textMid }}>{labelB}</label>
            <input value={valB} onChange={e => setValB(e.target.value)} style={{ ...inp, width: 100 }} />
          </div>

          {/* Results */}
          {result && result.solutions.length > 0 && (
            <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 10 }}>
              <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                {result.solutions.length === 1 ? "Intersection Point" : `${result.solutions.length} Solutions`}
              </div>
              {result.solutions.map((sol, i) => (
                <div key={i} style={{ marginBottom: result.solutions.length > 1 ? 10 : 0 }}>
                  {result.solutions.length > 1 && <div style={{ fontSize: 10, color: B.gold, fontWeight: 600, marginBottom: 3 }}>Solution {i + 1}</div>}
                  <div style={outRow}>
                    <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 40 }}>DD</span>
                    <span style={{ fontFamily: B.font, fontSize: 12, color: B.priBr, flex: 1, fontWeight: 600 }}>{sol.lat.toFixed(6)}{"\u00B0"}, {sol.lon.toFixed(6)}{"\u00B0"}</span>
                    {copyBtn(`${sol.lat.toFixed(6)}, ${sol.lon.toFixed(6)}`, `dd${i}`)}
                  </div>
                  <div style={outRow}>
                    <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 40 }}>DMS</span>
                    <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{fmtDms(sol.lat)} {sol.lat >= 0 ? "N" : "S"}, {fmtDms(sol.lon)} {sol.lon >= 0 ? "E" : "W"}</span>
                    {copyBtn(`${fmtDms(sol.lat)} ${sol.lat >= 0 ? "N" : "S"}, ${fmtDms(sol.lon)} ${sol.lon >= 0 ? "E" : "W"}`, `dms${i}`)}
                  </div>
                  <div style={outRow}>
                    <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 40 }}>UTM</span>
                    <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{sol.utm.zone}{sol.utm.hemi} {sol.utm.easting.toFixed(2)} E {sol.utm.northing.toFixed(2)} N</span>
                    {copyBtn(`${sol.utm.zone}${sol.utm.hemi} ${sol.utm.easting.toFixed(2)} E ${sol.utm.northing.toFixed(2)} N`, `utm${i}`)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {result && result.error && (
            <div style={{ marginTop: 10, padding: 8, background: "#ef444420", border: "1px solid #ef444440", borderRadius: 4, fontSize: 11, color: B.text }}>
              {result.error}
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
