import { useState } from "react";

const SHAPES = [
  { label: "City", shape: "circle", desc: "City, Ville" },
  { label: "Town", shape: "triangle", desc: "Town, Village, Hamlet, etc." },
  { label: "Municipality", shape: "square", desc: "Municipality, Township, Canton, etc." },
  { label: "Regional", shape: "diamond", desc: "Regional District, County, MRC, etc." },
];

const COLORS = [
  { label: "Full coverage", color: "#4caf50", desc: "Portal + Council + Standards" },
  { label: "Partial", color: "#e6a817", desc: "1-2 resources" },
  { label: "No data", color: "#555", desc: "No resources found" },
];

function ShapeIcon({ shape, color, size = 12 }) {
  const s = { display: "inline-block", width: size, height: size, background: color };
  if (shape === "circle") return <span style={{ ...s, borderRadius: "50%" }} />;
  if (shape === "triangle") return (
    <span style={{ display: "inline-block", width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent`, borderBottom: `${size}px solid ${color}` }} />
  );
  if (shape === "diamond") return <span style={{ ...s, transform: "rotate(45deg)", borderRadius: 2 }} />;
  return <span style={{ ...s, borderRadius: 2 }} />;
}

export function MunicipalMapLegend({ B, isMobile }) {
  const [open, setOpen] = useState(!isMobile);

  const toggle = () => setOpen((o) => !o);

  return (
    <div style={{
      position: "absolute",
      bottom: isMobile ? 60 : 10,
      left: 10,
      zIndex: 2,
      fontFamily: B.font,
      fontSize: 10,
    }}>
      <button
        type="button"
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
        aria-expanded={open}
        aria-label="Map legend"
        style={{
          background: `${B.bg}ee`,
          border: `1px solid ${B.border}`,
          borderRadius: 4,
          padding: "3px 8px",
          color: B.textMid,
          cursor: "pointer",
          fontSize: 10,
          fontFamily: B.font,
          backdropFilter: "blur(4px)",
        }}
      >
        {open ? "Legend \u25BC" : "Legend \u25B6"}
      </button>

      {open && (
        <div style={{
          marginTop: 4,
          background: `${B.bg}ee`,
          border: `1px solid ${B.border}`,
          borderRadius: 6,
          padding: "8px 10px",
          backdropFilter: "blur(4px)",
          maxWidth: 200,
        }}>
          <div style={{ color: B.textDim, marginBottom: 4, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px" }}>Shape = Entity Type</div>
          {SHAPES.map((s) => (
            <div key={s.shape} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <ShapeIcon shape={s.shape} color={B.pri} />
              <span style={{ color: B.text }}>{s.label}</span>
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${B.border}`, margin: "6px 0", paddingTop: 6 }}>
            <div style={{ color: B.textDim, marginBottom: 4, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px" }}>Color = Data Coverage</div>
            {COLORS.map((c) => (
              <div key={c.color} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: c.color }} />
                <span style={{ color: B.text }}>{c.label}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${B.border}`, margin: "6px 0", paddingTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", background: "#4caf50", border: "3px solid #fff", boxShadow: "0 0 4px rgba(0,0,0,0.3)" }} />
              <span style={{ color: B.text }}>White ring = Has survey standards</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
