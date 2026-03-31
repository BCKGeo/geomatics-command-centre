import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { curveElements } from "../../geo.js";

export function CurveCalc() {
  const { B } = useTheme();
  const [R, setR] = useState("");
  const [delta, setDelta] = useState("60");
  const [T, setT] = useState("");
  const [L, setL] = useState("");
  const [C, setC] = useState("");
  const [E, setE] = useState("");
  const [M, setM] = useState("");
  const [stationMode, setStationMode] = useState("metric"); // "metric" = 30m, "imperial" = 100ft (30.48m)
  const [copied, setCopied] = useState("");

  const stationLength = stationMode === "metric" ? 30 : 30.48;

  // Build params from non-empty fields
  const params = { stationLength };
  if (R !== "") params.R = parseFloat(R);
  if (delta !== "") params.delta = parseFloat(delta);
  if (T !== "") params.T = parseFloat(T);
  if (L !== "") params.L = parseFloat(L);
  if (C !== "") params.C = parseFloat(C);
  if (E !== "") params.E = parseFloat(E);
  if (M !== "") params.M = parseFloat(M);

  // Count how many inputs provided
  const filledCount = [R, delta, T, L, C, E, M].filter(v => v !== "").length;
  const result = filledCount >= 2 ? curveElements(params) : null;

  const copyText = (txt, label) => { try { navigator.clipboard.writeText(txt); setCopied(label); setTimeout(() => setCopied(""), 1500); } catch {} };

  const inp = { background: B.bg, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "4px 8px", color: B.text, fontSize: 12, outline: "none", fontFamily: B.font };
  const outRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderRadius: 4, background: B.bg, border: `1px solid ${B.border}`, marginBottom: 4 };
  const toggleBtn = (active) => ({ padding: "4px 10px", fontSize: 11, fontWeight: active ? 700 : 400, fontFamily: B.font, color: active ? B.bg : B.textMid, background: active ? B.priBr : "transparent", border: `1px solid ${active ? B.priBr : B.border}`, borderRadius: 3, cursor: "pointer" });
  const copyBtn = (txt, label) => <button onClick={() => copyText(txt, label)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: copied === label ? B.priBr : B.textDim, fontFamily: B.font, padding: "2px 6px" }}>{copied === label ? "\u2713" : "\uD83D\uDCCB"}</button>;

  const inputField = (label, value, setter, unit) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <label style={{ fontSize: 11, color: B.textMid, width: 70 }}>{label}</label>
      <input value={value} onChange={e => setter(e.target.value)} style={{ ...inp, width: 110 }} placeholder="enter value" />
      <span style={{ fontSize: 10, color: B.textDim }}>{unit}</span>
    </div>
  );

  // SVG curve visualizer
  const renderSvg = () => {
    if (!result) return null;
    const sz = 240, pad = 30;
    const dRad = result.delta * Math.PI / 180;
    // Place PI at top center
    const piX = sz / 2, piY = pad + 20;
    const halfDelta = dRad / 2;
    // Tangent lines go down-left and down-right from PI
    const tLen = 80; // visual tangent length (scaled)
    const pcX = piX - tLen * Math.sin(halfDelta);
    const pcY = piY + tLen * Math.cos(halfDelta);
    const ptX = piX + tLen * Math.sin(halfDelta);
    const ptY = piY + tLen * Math.cos(halfDelta);
    // Center of curve (below PI)
    const rVisual = tLen / Math.tan(halfDelta || 0.01);
    const cenX = piX;
    const cenY = piY + tLen / Math.cos(halfDelta || 0.01);
    // Arc from PC to PT (centered at cenX, cenY with radius rVisual)
    const arcR = Math.sqrt((pcX - cenX) ** 2 + (pcY - cenY) ** 2);
    const largeArc = result.delta > 180 ? 1 : 0;
    // Chord midpoint
    const midX = (pcX + ptX) / 2;
    const midY = (pcY + ptY) / 2;
    // M point (on arc at midpoint of curve)
    const midArcX = cenX;
    const midArcY = cenY - arcR;

    return (
      <svg viewBox={`0 0 ${sz} ${sz}`} width="100%" style={{ maxWidth: 240 }} preserveAspectRatio="xMidYMid meet">
        <rect width={sz} height={sz} fill="none" />
        {/* Tangent lines */}
        <line x1={piX} y1={piY} x2={pcX} y2={pcY} stroke={B.textMid} strokeWidth={1.2} />
        <line x1={piX} y1={piY} x2={ptX} y2={ptY} stroke={B.textMid} strokeWidth={1.2} />
        {/* Arc */}
        <path d={`M ${pcX} ${pcY} A ${arcR} ${arcR} 0 ${largeArc} 1 ${ptX} ${ptY}`} fill="none" stroke={B.priBr} strokeWidth={2} />
        {/* Chord (dashed) */}
        <line x1={pcX} y1={pcY} x2={ptX} y2={ptY} stroke={B.acc} strokeWidth={1} strokeDasharray="4,3" />
        {/* Radius line */}
        <line x1={cenX} y1={cenY} x2={midArcX} y2={midArcY} stroke={B.textDim} strokeWidth={0.8} strokeDasharray="2,3" />
        {/* E line (PI to midpoint of arc) */}
        <line x1={piX} y1={piY} x2={midArcX} y2={midArcY} stroke={B.gold} strokeWidth={1} strokeDasharray="3,2" />
        {/* Labels */}
        <circle cx={piX} cy={piY} r={3} fill={B.gold} />
        <text x={piX + 6} y={piY - 4} fill={B.gold} fontSize={9} fontFamily={B.font} fontWeight="600">PI</text>
        <circle cx={pcX} cy={pcY} r={3} fill={B.priBr} />
        <text x={pcX - 18} y={pcY + 4} fill={B.priBr} fontSize={9} fontFamily={B.font} fontWeight="600">PC</text>
        <circle cx={ptX} cy={ptY} r={3} fill={B.priBr} />
        <text x={ptX + 6} y={ptY + 4} fill={B.priBr} fontSize={9} fontFamily={B.font} fontWeight="600">PT</text>
        {/* T label */}
        <text x={(piX + pcX) / 2 - 14} y={(piY + pcY) / 2} fill={B.textMid} fontSize={8} fontFamily={B.font}>T</text>
        {/* C label */}
        <text x={midX} y={midY + 12} fill={B.acc} fontSize={8} fontFamily={B.font} textAnchor="middle">C</text>
        {/* R label */}
        <text x={cenX + 6} y={(cenY + midArcY) / 2} fill={B.textDim} fontSize={8} fontFamily={B.font}>R</text>
        {/* E label */}
        <text x={piX - 14} y={(piY + midArcY) / 2} fill={B.gold} fontSize={8} fontFamily={B.font}>E</text>
        {/* Delta angle arc at PI */}
        <text x={piX - 4} y={piY + 18} fill={B.text} fontSize={8} fontFamily={B.font}>{"\u0394"}={result.delta.toFixed(1)}{"\u00B0"}</text>
      </svg>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: B.textMid, marginBottom: 4 }}>Compute all elements of a simple circular curve from any two known values.</div>
      <div style={{ fontSize: 10, color: B.textDim, marginBottom: 8 }}>Enter any 2 values. Supported pairs: R+any, {"\u0394"}+any, T+E, E+M.</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        <button onClick={() => setStationMode("metric")} style={toggleBtn(stationMode === "metric")}>30 m station</button>
        <button onClick={() => setStationMode("imperial")} style={toggleBtn(stationMode === "imperial")}>100 ft station</button>
      </div>
      <div className="cmd-split" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>
        <div>
          {inputField("Radius (R)", R, setR, "m")}
          {inputField("Delta (\u0394)", delta, setDelta, "\u00B0")}
          {inputField("Tangent (T)", T, setT, "m")}
          {inputField("Arc (L)", L, setL, "m")}
          {inputField("Chord (C)", C, setC, "m")}
          {inputField("External (E)", E, setE, "m")}
          {inputField("Mid Ord (M)", M, setM, "m")}

          {filledCount < 2 && (
            <div style={{ fontSize: 11, color: B.textDim, marginTop: 8 }}>Enter at least 2 values to compute curve elements.</div>
          )}
          {filledCount >= 2 && !result && (
            <div style={{ marginTop: 8, padding: 8, background: "#ef444420", border: "1px solid #ef444440", borderRadius: 4, fontSize: 11, color: B.text }}>
              This input combination requires iterative solution {"\u2014"} use R or {"\u0394"} as one input.
            </div>
          )}

          {result && (
            <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 10, marginTop: 8 }}>
              <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Computed Elements</div>
              {[
                { label: "Radius (R)", val: result.R, unit: "m", key: "R" },
                { label: "Delta (\u0394)", val: result.delta, unit: "\u00B0", key: "delta" },
                { label: "Tangent (T)", val: result.T, unit: "m", key: "T" },
                { label: "Arc Length (L)", val: result.L, unit: "m", key: "L" },
                { label: "Chord (C)", val: result.C, unit: "m", key: "C" },
                { label: "External (E)", val: result.E, unit: "m", key: "E" },
                { label: "Mid Ordinate (M)", val: result.M, unit: "m", key: "M" },
                { label: "D (arc def)", val: result.D_arc, unit: "\u00B0", key: "Darc" },
                { label: "D (chord def)", val: result.D_chord, unit: "\u00B0", key: "Dchord" },
              ].map(row => (
                <div key={row.key} style={outRow}>
                  <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 100 }}>{row.label}</span>
                  <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{row.val.toFixed(4)} {row.unit}</span>
                  {copyBtn(row.val.toFixed(4), row.key)}
                </div>
              ))}
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
