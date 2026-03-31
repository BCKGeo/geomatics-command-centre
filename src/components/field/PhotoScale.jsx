import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";

const PRESETS = [
  { name: "Custom", sW: "", sH: "", iW: "", iH: "", fl: "" },
  { name: "Compact 1-inch (20 MP, 24 mm equiv)", sW: "13.2", sH: "8.8", iW: "5472", iH: "3648", fl: "8.8" },
  { name: "Micro Four Thirds (20 MP, 24 mm)", sW: "17.3", sH: "13.0", iW: "5184", iH: "3888", fl: "12" },
  { name: "APS-C (26 MP, 35 mm equiv)", sW: "23.5", sH: "15.6", iW: "6240", iH: "4160", fl: "23.2" },
  { name: "Full Frame (45 MP, 35 mm)", sW: "35.9", sH: "23.9", iW: "8192", iH: "5464", fl: "35" },
  { name: "Full Frame (61 MP, 24 mm)", sW: "35.7", sH: "23.8", iW: "9504", iH: "6336", fl: "24" },
  { name: "1-inch Telephoto (12 MP, 162 mm equiv)", sW: "13.2", sH: "8.8", iW: "4000", iH: "3000", fl: "46.5" },
];

export function PhotoScale() {
  const { B } = useTheme();
  const [preset, setPreset] = useState(1); // default to Compact 1-inch
  const [sW, setSW] = useState(PRESETS[1].sW);
  const [sH, setSH] = useState(PRESETS[1].sH);
  const [iW, setIW] = useState(PRESETS[1].iW);
  const [iH, setIH] = useState(PRESETS[1].iH);
  const [fl, setFL] = useState(PRESETS[1].fl);
  const [alt, setAlt] = useState("120");
  const [copied, setCopied] = useState("");

  const applyPreset = (idx) => {
    setPreset(idx);
    const p = PRESETS[idx];
    setSW(p.sW); setSH(p.sH); setIW(p.iW); setIH(p.iH); setFL(p.fl);
  };

  const sWv = parseFloat(sW), sHv = parseFloat(sH), iWv = parseFloat(iW), iHv = parseFloat(iH), flv = parseFloat(fl), altv = parseFloat(alt);
  const valid = sWv > 0 && sHv > 0 && iWv > 0 && iHv > 0 && flv > 0 && altv > 0;

  let gsd = null, scaleDenom = null, covW = null, covH = null, covArea = null;
  if (valid) {
    // GSD in metres, then convert to cm for display
    gsd = (sWv * altv * 1000) / (flv * iWv) / 1000; // = (sW_mm * alt_m) / (fl_mm * iW_px) in metres
    // Simpler: gsd_m = (sensor_width_mm / 1000 * altitude_m) / (focal_length_mm / 1000 * image_width_px)
    // = sensor_width_mm * altitude_m / (focal_length_mm * image_width_px) ... but units cancel to metres
    gsd = (sWv / 1000) * altv / (flv / 1000) / iWv; // = sW_m * alt_m / (fl_m * iW_px) = m/px
    scaleDenom = (altv * 1000) / flv; // altitude_mm / focal_length_mm
    covW = gsd * iWv;
    covH = gsd * iHv;
    covArea = covW * covH;
  }

  const copyText = (txt, label) => { try { navigator.clipboard.writeText(txt); setCopied(label); setTimeout(() => setCopied(""), 1500); } catch {} };

  const inp = { background: B.bg, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "4px 8px", color: B.text, fontSize: 12, outline: "none", fontFamily: B.font };
  const outRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderRadius: 4, background: B.bg, border: `1px solid ${B.border}`, marginBottom: 4 };
  const copyBtn = (txt, label) => <button onClick={() => copyText(txt, label)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: copied === label ? B.priBr : B.textDim, fontFamily: B.font, padding: "2px 6px" }}>{copied === label ? "\u2713" : "\uD83D\uDCCB"}</button>;

  return (
    <div>
      <div style={{ fontSize: 11, color: B.textMid, marginBottom: 4 }}>Ground sample distance, photo scale, and coverage from camera specs and flying height.</div>
      <div style={{ fontSize: 10, color: B.textDim, marginBottom: 8 }}>Vendor-neutral presets by sensor category. All fields editable after selection.</div>

      {/* Preset selector */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, color: B.textDim, marginBottom: 3, display: "block" }}>Sensor Preset</label>
        <select value={preset} onChange={e => applyPreset(Number(e.target.value))} style={{ ...inp, width: "100%", maxWidth: 360, cursor: "pointer" }}>
          {PRESETS.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
        </select>
      </div>

      {/* Camera inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12, maxWidth: 420 }}>
        <div>
          <label style={{ fontSize: 10, color: B.textDim, display: "block", marginBottom: 2 }}>Focal Length (mm)</label>
          <input value={fl} onChange={e => setFL(e.target.value)} style={{ ...inp, width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: B.textDim, display: "block", marginBottom: 2 }}>Sensor W (mm)</label>
          <input value={sW} onChange={e => setSW(e.target.value)} style={{ ...inp, width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: B.textDim, display: "block", marginBottom: 2 }}>Sensor H (mm)</label>
          <input value={sH} onChange={e => setSH(e.target.value)} style={{ ...inp, width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: B.textDim, display: "block", marginBottom: 2 }}>Image W (px)</label>
          <input value={iW} onChange={e => setIW(e.target.value)} style={{ ...inp, width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: B.textDim, display: "block", marginBottom: 2 }}>Image H (px)</label>
          <input value={iH} onChange={e => setIH(e.target.value)} style={{ ...inp, width: "100%" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: B.textDim, display: "block", marginBottom: 2 }}>Flying Height AGL (m)</label>
          <input value={alt} onChange={e => setAlt(e.target.value)} style={{ ...inp, width: "100%" }} />
        </div>
      </div>

      {/* Results */}
      {valid && (
        <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 10 }}>
          <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Results</div>
          <div style={{ ...outRow, borderColor: B.priBr + "40" }}>
            <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>GSD</span>
            <span style={{ fontFamily: B.font, fontSize: 14, color: B.priBr, flex: 1, fontWeight: 700 }}>{(gsd * 100).toFixed(2)} cm/px</span>
            {copyBtn((gsd * 100).toFixed(2) + " cm/px", "gsd")}
          </div>
          <div style={outRow}>
            <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>Photo Scale</span>
            <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>1:{Math.round(scaleDenom).toLocaleString()}</span>
            {copyBtn("1:" + Math.round(scaleDenom), "scale")}
          </div>
          <div style={outRow}>
            <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>Coverage</span>
            <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{covW.toFixed(1)} m {"\u00D7"} {covH.toFixed(1)} m</span>
            {copyBtn(`${covW.toFixed(1)} x ${covH.toFixed(1)} m`, "cov")}
          </div>
          <div style={outRow}>
            <span style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, width: 80 }}>Coverage Area</span>
            <span style={{ fontFamily: B.font, fontSize: 12, color: B.text, flex: 1 }}>{covArea.toFixed(1)} m{"\u00B2"} ({(covArea / 10000).toFixed(4)} ha)</span>
            {copyBtn(covArea.toFixed(1) + " m2", "covarea")}
          </div>
        </div>
      )}
    </div>
  );
}
