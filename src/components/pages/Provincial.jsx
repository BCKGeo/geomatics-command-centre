import { useTheme } from "../../context/ThemeContext.jsx";
import { ProvIntel } from "../resources/ProvIntel.jsx";

export function Provincial() {
  const { B } = useTheme();
  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };
  return (
    <div style={{ ...cardStyle, maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>{"\uD83C\uDFDB\uFE0F"}</span>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: B.priBr }}>Provincial Intel</h2>
      </div>
      <ProvIntel initialProv="bc" />
    </div>
  );
}
