import { useTheme } from "../../context/ThemeContext.jsx";

export function KpCell({ val, time }) {
  const { B } = useTheme();
  const c = val < 2 ? "#22c55e" : val < 4 ? "#84cc16" : val < 5 ? "#eab308" : val < 6 ? "#f97316" : val < 7 ? "#ef4444" : "#dc2626";
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "8px 2px", border: `1px solid ${B.border}`, position: "relative" }}>
      <div style={{ fontFamily: B.display, fontSize: 18, fontWeight: 800, lineHeight: 1, color: c }}>{Math.round(val)}</div>
      <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, marginTop: 4, letterSpacing: 0.5 }}>{time}</div>
    </div>
  );
}
