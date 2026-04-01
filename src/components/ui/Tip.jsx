import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";

export function Tip({ text }) {
  const { B } = useTheme();
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 4 }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: "50%", background: B.border, color: B.textMid, fontSize: 9, cursor: "help", fontWeight: 700 }}>?</span>
      {show && <div style={{ position: "absolute", bottom: "120%", left: "50%", transform: "translateX(-50%)", background: B.surface, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "6px 10px", fontSize: 10, color: B.text, lineHeight: 1.4, width: 220, zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>{text}</div>}
    </span>
  );
}
