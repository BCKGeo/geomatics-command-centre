import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";

const emptySetup = () => ({ station: "", bs: "", fs: "" });

export function LevelCalc() {
  const { B } = useTheme();
  const [startBM, setStartBM] = useState("");
  const [closeBM, setCloseBM] = useState("");
  const [isLoop, setIsLoop] = useState(true);
  const [setups, setSetups] = useState([emptySetup(), emptySetup(), emptySetup()]);
  const [copied, setCopied] = useState("");

  const effectiveCloseBM = isLoop ? startBM : closeBM;

  const updateSetup = (i, field, val) => {
    const next = setups.map((s, j) => j === i ? { ...s, [field]: val } : s);
    setSetups(next);
  };
  const addSetup = () => setSetups([...setups, emptySetup()]);
  const removeSetup = (i) => { if (setups.length > 2) setSetups(setups.filter((_, j) => j !== i)); };

  // Compute
  const startElev = parseFloat(startBM);
  const closeElev = parseFloat(effectiveCloseBM);
  const hasStart = !isNaN(startElev);
  const hasClose = !isNaN(closeElev);

  let results = null;
  let misclosure = null;
  let adjustedResults = null;

  if (hasStart && hasClose) {
    const rows = [];
    let valid = true;
    let prevElev = startElev;

    for (let i = 0; i < setups.length; i++) {
      const bs = parseFloat(setups[i].bs);
      const fs = parseFloat(setups[i].fs);
      if (isNaN(bs) || isNaN(fs)) { valid = false; break; }
      const hi = prevElev + bs;
      const elev = hi - fs;
      rows.push({ station: setups[i].station || `STA ${i + 1}`, bs, fs, hi, elev, index: i });
      prevElev = elev;
    }

    if (valid && rows.length > 0) {
      results = rows;
      const computedClose = rows[rows.length - 1].elev;
      misclosure = computedClose - closeElev;

      // Distribute misclosure proportionally (equal distribution across setups)
      const n = rows.length;
      adjustedResults = rows.map((r, i) => ({
        ...r,
        correction: -misclosure * ((i + 1) / n),
        adjustedElev: r.elev - misclosure * ((i + 1) / n),
      }));
    }
  }

  // Allowable misclosure (approximate 0.1 km per setup)
  const numSetups = setups.length;
  const approxK = numSetups * 0.1;
  const sqrtK = Math.sqrt(approxK);
  const allowable = {
    first: 0.003 * sqrtK,
    second: 0.006 * sqrtK,
    third: 0.012 * sqrtK,
  };

  const absMisc = misclosure !== null ? Math.abs(misclosure) : null;
  const passFirst = absMisc !== null && absMisc <= allowable.first;
  const passSecond = absMisc !== null && absMisc <= allowable.second;
  const passThird = absMisc !== null && absMisc <= allowable.third;

  const copyText = (txt, label) => { try { navigator.clipboard.writeText(txt); setCopied(label); setTimeout(() => setCopied(""), 1500); } catch {} };

  const inp = { background: B.bg, border: `1px solid ${B.borderHi}`, borderRadius: 4, padding: "4px 8px", color: B.text, fontSize: 16, outline: "none", fontFamily: B.font, boxSizing: "border-box" };
  const outRow = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", borderRadius: 4, background: B.bg, border: `1px solid ${B.border}`, marginBottom: 4 };
  const copyBtn = (txt, label) => <button onClick={() => copyText(txt, label)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: copied === label ? B.priBr : B.textDim, fontFamily: B.font, padding: "2px 6px" }}>{copied === label ? "\u2713" : "\uD83D\uDCCB"}</button>;

  const smallBtn = { padding: "3px 8px", fontSize: 11, fontFamily: B.font, color: B.textMid, background: "transparent", border: `1px solid ${B.border}`, borderRadius: 3, cursor: "pointer" };
  const addBtnStyle = { ...smallBtn, color: B.priBr, border: `1px solid ${B.priBr}` };
  const removeBtnStyle = { ...smallBtn, color: "#ef4444", border: `1px solid #ef444460` };

  const fmtElev = (v) => v.toFixed(4);
  const fmtMisc = (v) => {
    const mm = v * 1000;
    return `${v >= 0 ? "+" : ""}${v.toFixed(4)} m (${mm >= 0 ? "+" : ""}${mm.toFixed(1)} mm)`;
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: B.textMid, marginBottom: 4 }}>Compute adjusted elevations from a levelling loop with misclosure distribution.</div>
      <div style={{ fontSize: 10, color: B.textDim, marginBottom: 10 }}>Enter benchmark elevations and backsight/foresight readings for each setup.</div>

      {/* Starting BM */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <label style={{ fontSize: 11, color: B.textMid, width: 100 }}>Starting BM</label>
        <input value={startBM} onChange={e => setStartBM(e.target.value)} inputMode="decimal" placeholder="elevation (m)" style={{ ...inp, flex: 1, maxWidth: 150 }} />
        <span style={{ fontSize: 10, color: B.textDim }}>m</span>
      </div>

      {/* Loop checkbox */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <label style={{ fontSize: 11, color: B.textMid, width: 100 }}>Loop closure</label>
        <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11, color: B.textMid }}>
          <input type="checkbox" checked={isLoop} onChange={e => setIsLoop(e.target.checked)} style={{ accentColor: B.priBr }} />
          Closing BM = Starting BM
        </label>
      </div>

      {/* Closing BM (if not loop) */}
      {!isLoop && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <label style={{ fontSize: 11, color: B.textMid, width: 100 }}>Closing BM</label>
          <input value={closeBM} onChange={e => setCloseBM(e.target.value)} inputMode="decimal" placeholder="elevation (m)" style={{ ...inp, flex: 1, maxWidth: 150 }} />
          <span style={{ fontSize: 10, color: B.textDim }}>m</span>
        </div>
      )}

      {/* Setup table */}
      <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 10, marginTop: 8, marginBottom: 8 }}>
        <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Setups</div>

        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 30px", gap: 4, marginBottom: 4, padding: "0 2px" }}>
          <span style={{ fontSize: 10, color: B.textDim }}>Station</span>
          <span style={{ fontSize: 10, color: B.textDim }}>BS (m)</span>
          <span style={{ fontSize: 10, color: B.textDim }}>FS (m)</span>
          <span />
        </div>

        {setups.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 30px", gap: 4, marginBottom: 4 }}>
            <input value={s.station} onChange={e => updateSetup(i, "station", e.target.value)} placeholder={`STA ${i + 1}`} style={{ ...inp, width: "100%", fontSize: 13 }} />
            <input value={s.bs} onChange={e => updateSetup(i, "bs", e.target.value)} inputMode="decimal" placeholder="BS" style={{ ...inp, width: "100%", fontSize: 13, fontFamily: "monospace" }} />
            <input value={s.fs} onChange={e => updateSetup(i, "fs", e.target.value)} inputMode="decimal" placeholder="FS" style={{ ...inp, width: "100%", fontSize: 13, fontFamily: "monospace" }} />
            <button onClick={() => removeSetup(i)} style={removeBtnStyle} title="Remove setup">{"\u00D7"}</button>
          </div>
        ))}

        <button onClick={addSetup} style={addBtnStyle}>+ Add Setup</button>
      </div>

      {/* Results */}
      {adjustedResults && (
        <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 10, marginTop: 8 }}>
          <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Results</div>

          {/* Column header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 90px 90px 24px", gap: 4, marginBottom: 4, padding: "0 10px" }}>
            <span style={{ fontSize: 9, color: B.textDim }}>Station</span>
            <span style={{ fontSize: 9, color: B.textDim }}>HI</span>
            <span style={{ fontSize: 9, color: B.textDim }}>Raw Elev</span>
            <span style={{ fontSize: 9, color: B.textDim }}>Correction</span>
            <span style={{ fontSize: 9, color: B.textDim }}>Adj Elev</span>
            <span />
          </div>

          {adjustedResults.map((r, i) => (
            <div key={i} style={{ ...outRow, display: "grid", gridTemplateColumns: "1fr 80px 80px 90px 90px 24px", gap: 4 }}>
              <span style={{ fontFamily: B.font, fontSize: 11, color: B.text }}>{r.station}</span>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: B.textMid }}>{fmtElev(r.hi)}</span>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: B.textMid }}>{fmtElev(r.elev)}</span>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: r.correction === 0 ? B.textDim : B.gold }}>{r.correction >= 0 ? "+" : ""}{r.correction.toFixed(4)}</span>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: B.text, fontWeight: 600 }}>{fmtElev(r.adjustedElev)}</span>
              {copyBtn(fmtElev(r.adjustedElev), `adj-${i}`)}
            </div>
          ))}

          {/* Summary */}
          <div style={{ borderTop: `1px solid ${B.border}`, paddingTop: 10, marginTop: 8 }}>
            <div style={{ fontFamily: B.font, fontSize: 10, color: B.textDim, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Closure Summary</div>

            <div style={outRow}>
              <span style={{ fontFamily: B.font, fontSize: 11, color: B.textMid }}>Misclosure</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: absMisc < 0.001 ? "#22c55e" : B.text, fontWeight: 600 }}>{fmtMisc(misclosure)}</span>
                {copyBtn(misclosure.toFixed(4), "misc")}
              </div>
            </div>

            <div style={{ fontSize: 10, color: B.textDim, marginBottom: 4, marginTop: 6 }}>
              Allowable misclosure (approx {approxK.toFixed(1)} km, {numSetups} setups at 100 m each)
            </div>

            {[
              { label: "1st Order", val: allowable.first, pass: passFirst, formula: `3 mm \u00D7 \u221A${approxK.toFixed(1)}` },
              { label: "2nd Order", val: allowable.second, pass: passSecond, formula: `6 mm \u00D7 \u221A${approxK.toFixed(1)}` },
              { label: "3rd Order", val: allowable.third, pass: passThird, formula: `12 mm \u00D7 \u221A${approxK.toFixed(1)}` },
            ].map((o) => (
              <div key={o.label} style={{ ...outRow, borderColor: o.pass ? "#22c55e40" : "#ef444440" }}>
                <span style={{ fontFamily: B.font, fontSize: 11, color: B.textMid, minWidth: 70 }}>{o.label}</span>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: B.textDim, flex: 1 }}>{o.formula}</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: B.textMid, marginRight: 8 }}>{"\u00B1"}{(o.val * 1000).toFixed(1)} mm</span>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: B.font, color: o.pass ? "#22c55e" : "#ef4444", minWidth: 36, textAlign: "right" }}>{o.pass ? "PASS" : "FAIL"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
