import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";

/** Convert DDD.MMSS bearing to decimal degrees */
function dmmssToDecimal(dmmss) {
  const val = parseFloat(dmmss);
  if (isNaN(val)) return NaN;
  const deg = Math.trunc(val);
  const frac = Math.abs(val - deg);
  const mmss = frac * 100;
  const min = Math.trunc(mmss + 1e-9);
  const sec = (mmss - min) * 100;
  return deg + min / 60 + sec / 3600;
}

/** Convert decimal degrees to DDD.MMSS string */
function decimalToDmmss(dd) {
  const deg = Math.trunc(dd);
  const rest = (dd - deg) * 60;
  const min = Math.trunc(rest + 1e-9);
  const sec = (rest - min) * 60;
  return `${deg}.${String(min).padStart(2, "0")}${sec.toFixed(0).padStart(2, "0")}`;
}

/** Convert decimal degrees to radians */
function toRad(d) { return d * Math.PI / 180; }
/** Convert radians to decimal degrees */
function toDeg(r) { return r * 180 / Math.PI; }

export function TraverseCalc() {
  const { B } = useTheme();
  const [startN, setStartN] = useState("5000.000");
  const [startE, setStartE] = useState("5000.000");
  const [closeN, setCloseN] = useState("5000.000");
  const [closeE, setCloseE] = useState("5000.000");
  const [isLoop, setIsLoop] = useState(true);
  const [legs, setLegs] = useState([
    { bearing: "", distance: "" },
    { bearing: "", distance: "" },
    { bearing: "", distance: "" },
  ]);
  const [copied, setCopied] = useState("");

  const copyText = (txt, label) => { try { navigator.clipboard.writeText(txt); setCopied(label); setTimeout(() => setCopied(""), 1500); } catch {} };

  const inp = { background: B.bg, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "4px 8px", color: B.text, fontSize: 16, outline: "none", fontFamily: B.font, boxSizing: "border-box" };
  const outRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderRadius: 4, background: B.bg, border: `1px solid ${B.border}`, marginBottom: 4 };
  const copyBtn = (txt, label) => <button onClick={() => copyText(txt, label)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: copied === label ? B.priBr : B.textDim, fontFamily: B.font, padding: "2px 6px" }}>{copied === label ? "\u2713" : "\uD83D\uDCCB"}</button>;

  // Sync closing point when loop is toggled on
  const toggleLoop = () => {
    if (!isLoop) {
      setCloseN(startN);
      setCloseE(startE);
    }
    setIsLoop(!isLoop);
  };

  const updateLeg = (idx, field, val) => {
    const next = legs.map((l, i) => i === idx ? { ...l, [field]: val } : l);
    setLegs(next);
  };

  const addLeg = () => setLegs([...legs, { bearing: "", distance: "" }]);
  const removeLeg = (idx) => { if (legs.length > 1) setLegs(legs.filter((_, i) => i !== idx)); };

  // When start changes and loop is on, sync close
  const handleStartN = (v) => { setStartN(v); if (isLoop) setCloseN(v); };
  const handleStartE = (v) => { setStartE(v); if (isLoop) setCloseE(v); };

  // Compute traverse
  const sN = parseFloat(startN) || 0;
  const sE = parseFloat(startE) || 0;
  const cN = isLoop ? sN : (parseFloat(closeN) || 0);
  const cE = isLoop ? sE : (parseFloat(closeE) || 0);

  const computed = [];
  let curN = sN, curE = sE, totalDist = 0;
  let allValid = true;

  for (let i = 0; i < legs.length; i++) {
    const brg = dmmssToDecimal(legs[i].bearing);
    const dist = parseFloat(legs[i].distance);
    if (isNaN(brg) || isNaN(dist) || dist <= 0 || legs[i].bearing === "" || legs[i].distance === "") {
      allValid = false;
      break;
    }
    const brgRad = toRad(brg);
    const dN = dist * Math.cos(brgRad);
    const dE = dist * Math.sin(brgRad);
    curN += dN;
    curE += dE;
    totalDist += dist;
    computed.push({ leg: i + 1, bearing: brg, distance: dist, dN, dE, cumN: curN, cumE: curE });
  }

  const hasResult = allValid && computed.length > 0;
  const errorN = hasResult ? curN - cN : 0;
  const errorE = hasResult ? curE - cE : 0;
  const linearClosure = Math.sqrt(errorN * errorN + errorE * errorE);
  const ratio = linearClosure > 0 ? totalDist / linearClosure : Infinity;
  const closureBearing = hasResult ? (() => {
    let a = toDeg(Math.atan2(errorE, errorN));
    if (a < 0) a += 360;
    return a;
  })() : 0;

  // Quality rating
  const getQuality = (r) => {
    if (r >= 10000) return { color: "#22c55e", label: "Excellent" };
    if (r >= 5000) return { color: "#22c55e", label: "Good" };
    if (r >= 3000) return { color: "#f59e0b", label: "Marginal" };
    return { color: "#ef4444", label: "Poor" };
  };

  const quality = hasResult ? getQuality(ratio) : null;

  const btnStyle = { padding: "4px 10px", fontSize: 11, fontWeight: 600, fontFamily: B.font, color: B.bg, background: B.priBr, border: `1px solid ${B.priBr}`, borderRadius: 3, cursor: "pointer" };
  const btnDangerStyle = { padding: "4px 8px", fontSize: 11, fontWeight: 400, fontFamily: B.font, color: B.textDim, background: "transparent", border: `1px solid ${B.border}`, borderRadius: 3, cursor: "pointer" };

  // SVG traverse visualizer
  const renderSvg = () => {
    if (!hasResult || computed.length < 1) return null;
    const sz = 240, pad = 30;
    // Collect all points
    const pts = [{ n: sN, e: sE }];
    for (const c of computed) pts.push({ n: c.cumN, e: c.cumE });
    // Bounding box
    const allN = pts.map(p => p.n);
    const allE = pts.map(p => p.e);
    const minN = Math.min(...allN), maxN = Math.max(...allN);
    const minE = Math.min(...allE), maxE = Math.max(...allE);
    const rangeN = maxN - minN || 1;
    const rangeE = maxE - minE || 1;
    const scale = Math.min((sz - pad * 2) / rangeE, (sz - pad * 2) / rangeN);
    const offE = (sz - rangeE * scale) / 2;
    const offN = (sz - rangeN * scale) / 2;
    const tx = (e) => offE + (e - minE) * scale;
    const ty = (n) => sz - offN - (n - minN) * scale; // flip Y

    const svgPts = pts.map(p => ({ x: tx(p.e), y: ty(p.n) }));

    return (
      <svg viewBox={`0 0 ${sz} ${sz}`} width="100%" style={{ maxWidth: 240 }} preserveAspectRatio="xMidYMid meet">
        <rect width={sz} height={sz} fill="none" />
        {/* Traverse legs */}
        {svgPts.map((p, i) => i > 0 ? (
          <line key={i} x1={svgPts[i - 1].x} y1={svgPts[i - 1].y} x2={p.x} y2={p.y} stroke={B.priBr} strokeWidth={1.5} />
        ) : null)}
        {/* Closure error line (if not zero) */}
        {linearClosure > 0.001 && (
          <line x1={svgPts[svgPts.length - 1].x} y1={svgPts[svgPts.length - 1].y}
                x2={tx(cE)} y2={ty(cN)}
                stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4,3" />
        )}
        {/* Points */}
        {svgPts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={i === 0 ? 5 : 3.5} fill={i === 0 ? B.priBr : B.gold} />
            <text x={p.x + 6} y={p.y - 5} fill={i === 0 ? B.priBr : B.gold} fontSize={9} fontFamily={B.font} fontWeight="600">
              {i === 0 ? "Start" : i}
            </text>
          </g>
        ))}
        {/* Close point if different from last computed */}
        {linearClosure > 0.001 && (
          <g>
            <circle cx={tx(cE)} cy={ty(cN)} r={4} fill="none" stroke="#ef4444" strokeWidth={1.5} />
            <text x={tx(cE) + 6} y={ty(cN) - 5} fill="#ef4444" fontSize={9} fontFamily={B.font} fontWeight="600">Close</text>
          </g>
        )}
      </svg>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: B.textMid, marginBottom: 4 }}>Compute traverse closure from bearings (DDD.MMSS) and distances (metres).</div>
      <div style={{ fontSize: 10, color: B.textDim, marginBottom: 8 }}>Bearing format: 45.3020 = 45{"\u00B0"} 30' 20" {"\u00B7"} Plane coordinates (grid bearings)</div>

      <div className="cmd-split" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>
        <div>
          {/* Starting point */}
          <div style={{ fontSize: 10, color: B.textDim, marginBottom: 3, fontWeight: 600 }}>Starting Point</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ fontSize: 11, color: B.textMid }}>N</label>
            <input value={startN} onChange={e => handleStartN(e.target.value)} inputMode="decimal" style={{ ...inp, width: "100%", maxWidth: 130, flex: 1, minWidth: 80 }} />
            <label style={{ fontSize: 11, color: B.textMid }}>E</label>
            <input value={startE} onChange={e => handleStartE(e.target.value)} inputMode="decimal" style={{ ...inp, width: "100%", maxWidth: 130, flex: 1, minWidth: 80 }} />
          </div>

          {/* Loop checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, color: B.textMid }}>
              <input type="checkbox" checked={isLoop} onChange={toggleLoop} style={{ accentColor: B.priBr }} />
              Loop traverse (close = start)
            </label>
          </div>

          {/* Closing point (only if not loop) */}
          {!isLoop && (
            <div>
              <div style={{ fontSize: 10, color: B.textDim, marginBottom: 3, fontWeight: 600 }}>Closing Point</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ fontSize: 11, color: B.textMid }}>N</label>
                <input value={closeN} onChange={e => setCloseN(e.target.value)} inputMode="decimal" style={{ ...inp, width: "100%", maxWidth: 130, flex: 1, minWidth: 80 }} />
                <label style={{ fontSize: 11, color: B.textMid }}>E</label>
                <input value={closeE} onChange={e => setCloseE(e.target.value)} inputMode="decimal" style={{ ...inp, width: "100%", maxWidth: 130, flex: 1, minWidth: 80 }} />
              </div>
            </div>
          )}

          {/* Traverse legs */}
          <div style={{ fontSize: 10, color: B.textDim, marginBottom: 6, marginTop: 4, fontWeight: 600 }}>Traverse Legs</div>
          {legs.map((leg, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: B.textDim, width: 18, textAlign: "right", fontFamily: "monospace" }}>{i + 1}</span>
              <label style={{ fontSize: 10, color: B.textMid }}>Brg</label>
              <input value={leg.bearing} onChange={e => updateLeg(i, "bearing", e.target.value)} inputMode="decimal" placeholder="DDD.MMSS" style={{ ...inp, width: "100%", maxWidth: 110, flex: 1, minWidth: 70, fontSize: 14 }} />
              <label style={{ fontSize: 10, color: B.textMid }}>Dist</label>
              <input value={leg.distance} onChange={e => updateLeg(i, "distance", e.target.value)} inputMode="decimal" placeholder="m" style={{ ...inp, width: "100%", maxWidth: 90, flex: 1, minWidth: 60, fontSize: 14 }} />
              <button onClick={() => removeLeg(i)} style={btnDangerStyle} title="Remove leg">{"\u00D7"}</button>
            </div>
          ))}
          <button onClick={addLeg} style={{ ...btnStyle, marginTop: 4, marginBottom: 10 }}>+ Add Leg</button>

          {/* Results */}
          {hasResult && (
            <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 10, marginTop: 4 }}>
              <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Computed Coordinates</div>

              {/* Leg results table */}
              <div style={{ marginBottom: 10, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${B.border}` }}>
                      <th style={{ padding: "4px 6px", textAlign: "left", color: B.textDim, fontSize: 10, fontWeight: 600 }}>Leg</th>
                      <th style={{ padding: "4px 6px", textAlign: "right", color: B.textDim, fontSize: 10, fontWeight: 600 }}>Bearing</th>
                      <th style={{ padding: "4px 6px", textAlign: "right", color: B.textDim, fontSize: 10, fontWeight: 600 }}>Dist (m)</th>
                      <th style={{ padding: "4px 6px", textAlign: "right", color: B.textDim, fontSize: 10, fontWeight: 600 }}>{"\u0394"}N</th>
                      <th style={{ padding: "4px 6px", textAlign: "right", color: B.textDim, fontSize: 10, fontWeight: 600 }}>{"\u0394"}E</th>
                      <th style={{ padding: "4px 6px", textAlign: "right", color: B.textDim, fontSize: 10, fontWeight: 600 }}>Northing</th>
                      <th style={{ padding: "4px 6px", textAlign: "right", color: B.textDim, fontSize: 10, fontWeight: 600 }}>Easting</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${B.border}` }}>
                      <td style={{ padding: "3px 6px", color: B.priBr }}>Start</td>
                      <td colSpan={4}></td>
                      <td style={{ padding: "3px 6px", textAlign: "right", color: B.text }}>{sN.toFixed(3)}</td>
                      <td style={{ padding: "3px 6px", textAlign: "right", color: B.text }}>{sE.toFixed(3)}</td>
                    </tr>
                    {computed.map(c => (
                      <tr key={c.leg} style={{ borderBottom: `1px solid ${B.border}` }}>
                        <td style={{ padding: "3px 6px", color: B.textMid }}>{c.leg}</td>
                        <td style={{ padding: "3px 6px", textAlign: "right", color: B.text }}>{c.bearing.toFixed(4)}{"\u00B0"}</td>
                        <td style={{ padding: "3px 6px", textAlign: "right", color: B.text }}>{c.distance.toFixed(3)}</td>
                        <td style={{ padding: "3px 6px", textAlign: "right", color: c.dN >= 0 ? B.text : "#f59e0b" }}>{c.dN >= 0 ? "+" : ""}{c.dN.toFixed(3)}</td>
                        <td style={{ padding: "3px 6px", textAlign: "right", color: c.dE >= 0 ? B.text : "#f59e0b" }}>{c.dE >= 0 ? "+" : ""}{c.dE.toFixed(3)}</td>
                        <td style={{ padding: "3px 6px", textAlign: "right", color: B.text }}>{c.cumN.toFixed(3)}</td>
                        <td style={{ padding: "3px 6px", textAlign: "right", color: B.text }}>{c.cumE.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Closure summary */}
              <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Closure Analysis</div>

              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 100 }}>Total Distance</span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: B.text, flex: 1 }}>{totalDist.toFixed(3)} m</span>
                {copyBtn(totalDist.toFixed(3), "totdist")}
              </div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 100 }}>Error {"\u0394"}N</span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: B.text, flex: 1 }}>{errorN >= 0 ? "+" : ""}{errorN.toFixed(4)} m</span>
                {copyBtn(errorN.toFixed(4), "errN")}
              </div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 100 }}>Error {"\u0394"}E</span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: B.text, flex: 1 }}>{errorE >= 0 ? "+" : ""}{errorE.toFixed(4)} m</span>
                {copyBtn(errorE.toFixed(4), "errE")}
              </div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 100 }}>Linear Closure</span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: B.text, flex: 1 }}>{linearClosure.toFixed(4)} m</span>
                {copyBtn(linearClosure.toFixed(4), "linclose")}
              </div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 100 }}>Ratio of Closure</span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: quality.color, flex: 1, fontWeight: 700 }}>
                  {ratio === Infinity ? "Perfect (0 error)" : `1:${Math.round(ratio).toLocaleString("en-CA")}`}
                  <span style={{ fontFamily: B.font, fontSize: 10, fontWeight: 400, marginLeft: 8, color: quality.color }}>{quality.label}</span>
                </span>
                {ratio !== Infinity && copyBtn(`1:${Math.round(ratio)}`, "ratio")}
              </div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 100 }}>Closure Bearing</span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: B.text, flex: 1 }}>
                  {closureBearing.toFixed(4)}{"\u00B0"} ({decimalToDmmss(closureBearing)} DDD.MMSS)
                </span>
                {copyBtn(closureBearing.toFixed(4), "clbrg")}
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
