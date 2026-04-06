import { useTheme } from "../../context/ThemeContext.jsx";
import { CONSTELLATION_COLORS, PDOP_THRESHOLDS, pdopLevel } from "../../lib/satellites.js";

const R = 90; // plot radius in SVG units
const CX = 100, CY = 100; // center

function satXY(az, el) {
  const r = ((90 - el) / 90) * R;
  const azRad = (az * Math.PI) / 180;
  return { x: CX + r * Math.sin(azRad), y: CY - r * Math.cos(azRad) };
}

const AZ_LABELS = ["N", "30", "60", "E", "120", "150", "S", "210", "240", "W", "300", "330"];

export function Skyplot({ visible = [], count = {}, pdop = null }) {
  const { B } = useTheme();
  const pl = pdop != null ? pdopLevel(pdop) : null;

  return (
    <div>
      <svg viewBox="0 0 200 200" style={{ width: "100%", maxWidth: 220, display: "block", margin: "0 auto" }}>
        {/* Background */}
        <circle cx={CX} cy={CY} r={R} fill={B.inset} stroke={B.border} strokeWidth="1" />
        {/* Elevation rings at 30 and 60 */}
        <circle cx={CX} cy={CY} r={R * (2 / 3)} fill="none" stroke={B.border} strokeWidth="0.5" strokeDasharray="3,3" />
        <circle cx={CX} cy={CY} r={R * (1 / 3)} fill="none" stroke={B.border} strokeWidth="0.5" strokeDasharray="3,3" />
        {/* Crosshairs */}
        <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke={B.border} strokeWidth="0.5" />
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke={B.border} strokeWidth="0.5" />
        {/* Azimuth ticks and labels */}
        {AZ_LABELS.map((label, i) => {
          const ang = (i * 30 * Math.PI) / 180;
          const lx = CX + (R + 8) * Math.sin(ang);
          const ly = CY - (R + 8) * Math.cos(ang);
          const isCardinal = i % 3 === 0;
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: isCardinal ? 8 : 6, fill: isCardinal ? B.text : B.textDim, fontFamily: "monospace", fontWeight: isCardinal ? 700 : 400 }}>
              {label}
            </text>
          );
        })}
        {/* Elevation labels */}
        <text x={CX + 3} y={CY - R * (1 / 3) + 1} style={{ fontSize: 5, fill: B.textDim }}>60°</text>
        <text x={CX + 3} y={CY - R * (2 / 3) + 1} style={{ fontSize: 5, fill: B.textDim }}>30°</text>
        {/* Zenith dot */}
        <circle cx={CX} cy={CY} r={1.5} fill={B.textDim} />
        {/* Satellite dots */}
        {visible.map((s, i) => {
          const { x, y } = satXY(s.az, s.el);
          return (
            <circle key={i} cx={x} cy={y} r={3.5}
              fill={CONSTELLATION_COLORS[s.constellation] || CONSTELLATION_COLORS.unknown}
              stroke={B.surface} strokeWidth="0.8" opacity={0.9}>
              <title>{s.name} Az:{Math.round(s.az)}° El:{Math.round(s.el)}°</title>
            </circle>
          );
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
        {[["GPS", "gps"], ["GLO", "glonass"], ["GAL", "galileo"], ["BDS", "beidou"]].map(([label, key]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: CONSTELLATION_COLORS[key] }} />
            <span style={{ fontSize: 9, color: B.textMid, fontFamily: "monospace" }}>{label} {count[key] || 0}</span>
          </div>
        ))}
      </div>
      {/* PDOP + Total */}
      <div style={{ textAlign: "center", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: B.textDim, fontFamily: "monospace" }}>Total {count.total || 0}</span>
        {pdop != null && pl && (
          <span style={{ fontSize: 10, fontFamily: "monospace", marginLeft: 10 }}>
            PDOP <b style={{ color: pl.color }}>{pdop.toFixed(1)}</b>{" "}
            <span style={{ color: pl.color, fontSize: 9 }}>{pl.label}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function SkyplotFallback() {
  const { B } = useTheme();
  return (
    <div style={{ textAlign: "center", padding: "20px 12px" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{"\uD83D\uDEF0\uFE0F"}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: B.text, marginBottom: 6 }}>Satellite Visibility</div>
      <div style={{ fontSize: 11, color: B.textMid, lineHeight: 1.5, marginBottom: 10 }}>
        Deploy the Celestrak proxy worker to enable real-time GNSS satellite tracking.
      </div>
      <div style={{ fontSize: 10, color: B.textDim, fontFamily: "monospace", marginBottom: 8 }}>
        cd workers/celestrak-proxy<br />
        npx wrangler deploy
      </div>
      <a href="https://celestrak.org/GPS/" target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 10, color: B.pri, textDecoration: "underline" }}>
        Celestrak Online Tool
      </a>
    </div>
  );
}
