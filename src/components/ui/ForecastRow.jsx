import { useTheme } from "../../context/ThemeContext.jsx";

const SCALE_COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444", "#dc2626"];

function MiniGauge({ level, label }) {
  const { B } = useTheme();
  const num = parseInt(level?.replace(/\D/g, "")) || 0;
  const color = SCALE_COLORS[num] || "#22c55e";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", margin: "0 auto 2px", display: "flex", alignItems: "center", justifyContent: "center", background: `conic-gradient(${color} 0deg, ${color} ${num * 60}deg, ${B.surfaceHi} ${num * 60}deg, ${B.surfaceHi} 360deg)`, border: `1px solid ${B.border}` }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: B.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: B.display, fontSize: 10, fontWeight: 800, color }}>{level}</span>
        </div>
      </div>
      <div style={{ fontSize: 8, color: B.textDim, fontFamily: B.font }}>{label}</div>
    </div>
  );
}

export function ForecastRow({ scales }) {
  const { B } = useTheme();
  if (!scales) return null;

  // scales keys "1", "2", "3" are next 3 days
  const days = ["1", "2", "3"].map(k => scales[k]).filter(Boolean);
  if (days.length === 0) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span>{"\uD83D\uDD2E"}</span>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: B.text }}>3-Day Forecast</h2>
        <span style={{ fontSize: 10, color: B.textDim, marginLeft: "auto" }}>NOAA SWPC</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${days.length}, 1fr)`, gap: 8 }}>
        {days.map((d, i) => {
          const g = d.G?.Scale || "0", s = d.S?.Scale || "0", r = d.R?.Scale || "0";
          const date = d.DateStamp || "";
          const dayLabel = date ? new Date(date + "T12:00:00").toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }) : `Day ${i + 1}`;
          return (
            <div key={i} style={{ background: B.inset, border: `2px solid ${B.border}`, borderTopColor: B.bvD, borderLeftColor: B.bvD, borderBottomColor: B.bvL, borderRightColor: B.bvL, padding: 8, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: B.textMid, fontFamily: B.font, fontWeight: 600, marginBottom: 6 }}>{dayLabel}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
                <MiniGauge level={`G${g}`} label="Geomag" />
                <MiniGauge level={`S${s}`} label="Solar" />
                <MiniGauge level={`R${r}`} label="Radio" />
              </div>
              {d.R?.MinorProb && (
                <div style={{ fontSize: 9, color: B.textDim, marginTop: 4, fontFamily: B.font }}>
                  R minor: {d.R.MinorProb}% {d.R.MajorProb ? `| major: ${d.R.MajorProb}%` : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
