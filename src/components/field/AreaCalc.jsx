import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { geodesicArea, geodesicPerimeter } from "../../geo.js";

export function AreaCalc() {
  const { B } = useTheme();
  const [points, setPoints] = useState([
    { lat: "45.4215", lon: "-75.6972" },
    { lat: "45.4215", lon: "-75.6800" },
    { lat: "45.4350", lon: "-75.6886" },
  ]);
  const [copied, setCopied] = useState("");

  const updatePoint = (i, field, val) => {
    const next = [...points];
    next[i] = { ...next[i], [field]: val };
    setPoints(next);
  };
  const addPoint = () => setPoints([...points, { lat: "", lon: "" }]);
  const removePoint = (i) => { if (points.length > 3) setPoints(points.filter((_, j) => j !== i)); };

  const parsed = points.map(p => ({ lat: parseFloat(p.lat), lon: parseFloat(p.lon) }));
  const allValid = parsed.length >= 3 && parsed.every(p => !isNaN(p.lat) && !isNaN(p.lon) && p.lat >= -90 && p.lat <= 90 && p.lon >= -180 && p.lon <= 180);
  const area = allValid ? geodesicArea(parsed) : null;
  const perim = allValid ? geodesicPerimeter(parsed) : null;

  const copyText = (txt, label) => { try { navigator.clipboard.writeText(txt); setCopied(label); setTimeout(() => setCopied(""), 1500); } catch {} };

  const inp = { background: B.bg, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "4px 8px", color: B.text, fontSize: 16, outline: "none", fontFamily: B.font, width: "100%", maxWidth: 110, boxSizing: "border-box" };
  const outRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderRadius: 4, background: B.bg, border: `1px solid ${B.border}`, marginBottom: 4 };
  const copyBtn = (txt, label) => <button onClick={() => copyText(txt, label)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: copied === label ? B.priBr : B.textDim, fontFamily: B.font, padding: "2px 6px" }}>{copied === label ? "\u2713" : "\uD83D\uDCCB"}</button>;

  // SVG polygon visualizer
  const renderSvg = () => {
    if (!allValid) return null;
    const lats = parsed.map(p => p.lat), lons = parsed.map(p => p.lon);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const spanLat = maxLat - minLat || 0.001, spanLon = maxLon - minLon || 0.001;
    const pad = 30, sz = 220, draw = sz - 2 * pad;
    const scale = Math.min(draw / spanLon, draw / spanLat);
    const pts = parsed.map(p => ({
      x: pad + (p.lon - minLon) * scale + (draw - spanLon * scale) / 2,
      y: pad + (maxLat - p.lat) * scale + (draw - spanLat * scale) / 2,
    }));
    const polyStr = pts.map(p => `${p.x},${p.y}`).join(" ");
    // Centroid for label
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;

    return (
      <svg viewBox={`0 0 ${sz} ${sz}`} width="100%" style={{ maxWidth: 220 }} preserveAspectRatio="xMidYMid meet">
        <rect width={sz} height={sz} fill="none" />
        {/* Polygon fill */}
        <polygon points={polyStr} fill={B.priBr} fillOpacity={0.12} stroke={B.priBr} strokeWidth={1.5} />
        {/* Closing segment dashed */}
        <line x1={pts[pts.length - 1].x} y1={pts[pts.length - 1].y} x2={pts[0].x} y2={pts[0].y} stroke={B.priBr} strokeWidth={1} strokeDasharray="4,3" />
        {/* Vertices */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill={B.priBr} />
            <text x={p.x + 6} y={p.y - 6} fill={B.text} fontSize={9} fontFamily={B.font} fontWeight="600">{i + 1}</text>
          </g>
        ))}
        {/* Area label */}
        {area != null && (
          <text x={cx} y={cy} fill={B.gold} fontSize={9} fontFamily={B.font} textAnchor="middle" fontWeight="600">
            {area >= 10000 ? (area / 10000).toFixed(2) + " ha" : area.toFixed(1) + " m\u00B2"}
          </text>
        )}
      </svg>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: B.textMid, marginBottom: 4 }}>Geodesic area and perimeter from coordinate vertices (spherical excess on GRS80 authalic sphere).</div>
      <div style={{ fontSize: 10, color: B.textDim, marginBottom: 8 }}>Closure is implicit (last vertex connects to first). Minimum 3 points.</div>
      <div className="cmd-split" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>
        <div>
          {/* Vertex table */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center" }}>
              <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 20 }}>#</span>
              <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 110 }}>Latitude</span>
              <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 110 }}>Longitude</span>
            </div>
            {points.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3, alignItems: "center" }}>
                <span style={{ fontFamily: B.font, fontSize: 11, color: B.textMid, width: 20, textAlign: "center" }}>{i + 1}</span>
                <input value={p.lat} onChange={e => updatePoint(i, "lat", e.target.value)} style={inp} placeholder="Lat (DD)" />
                <input value={p.lon} onChange={e => updatePoint(i, "lon", e.target.value)} style={inp} placeholder="Lon (DD)" />
                {points.length > 3 && (
                  <button onClick={() => removePoint(i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: B.textDim, padding: "2px 4px" }} title="Remove vertex">{"\u2715"}</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addPoint} style={{ background: B.bg, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "4px 12px", fontSize: 11, color: B.priBr, cursor: "pointer", fontFamily: B.font, marginBottom: 12 }}>+ Add Vertex</button>

          {allValid && area != null && (
            <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 10 }}>
              <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Results ({parsed.length} vertices)</div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>Area</span>
                <span style={{ fontFamily: B.font, fontSize: 12, color: B.priBr, flex: 1, fontWeight: 600 }}>{area.toFixed(2)} m{"\u00B2"}</span>
                {copyBtn(area.toFixed(2), "area-m")}
              </div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}></span>
                <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{(area / 10000).toFixed(4)} ha {"\u00B7"} {(area / 4046.8564224).toFixed(4)} ac</span>
                {copyBtn((area / 10000).toFixed(4) + " ha", "area-ha")}
              </div>
              <div style={outRow}>
                <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>Perimeter</span>
                <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{perim.toFixed(3)} m{perim >= 1000 ? ` (${(perim / 1000).toFixed(3)} km)` : ""}</span>
                {copyBtn(perim.toFixed(3), "perim")}
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
