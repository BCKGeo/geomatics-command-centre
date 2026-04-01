import { useTheme } from "../../context/ThemeContext.jsx";

export function GaugeRing({ level, label }) {
  const { B } = useTheme();
  const levelNum = parseInt(level?.replace(/\D/g, "")) || 0;
  const colors = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444", "#dc2626"];
  const fills = [60, 120, 180, 240, 300, 340];
  const color = colors[levelNum] || "#22c55e";
  const fill = fills[levelNum] || 0;
  const isExtreme = levelNum === 5;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 84, height: 84, borderRadius: "50%", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: `conic-gradient(${color} 0deg, ${color} ${fill}deg, ${B.surfaceHi} ${fill}deg, ${B.surfaceHi} 360deg)`, boxShadow: `0 0 0 2px ${B.border}${isExtreme ? ", 0 0 12px " + color : ""}`, transition: "box-shadow .2s", animation: isExtreme ? "pulse-ring 1.5s ease-in-out infinite" : "none" }}>
        <div style={{ position: "absolute", inset: 8, borderRadius: "50%", background: B.surface, border: `1px solid ${B.border}` }} />
        <div style={{ position: "relative", zIndex: 1, fontFamily: B.display, fontSize: 22, fontWeight: 900, color: color, textShadow: `0 0 8px ${color}` }}>{level}</div>
      </div>
      <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}
