import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";

export function HelpPanel({ text }) {
  const { B } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: `1px solid ${B.border}`, borderRadius: 4, padding: "4px 10px", fontSize: 10, color: B.textMid, cursor: "pointer", fontFamily: B.font, display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 8 }}>{open ? "\u25BC" : "\u25B6"}</span> How to use this tool
      </button>
      {open && <div style={{ marginTop: 6, padding: "8px 12px", background: B.bg, border: `1px solid ${B.border}`, borderRadius: 4, fontSize: 10, color: B.textMid, lineHeight: 1.6 }}>{text}</div>}
    </div>
  );
}
