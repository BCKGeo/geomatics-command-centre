# Field Tools Upgrade v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade CoordConverter with zone override, height fields (h/N/H), conditional MTM visibility, and inline help; restructure layout to full-width converter with Scale+MagPanel side-by-side below.

**Architecture:** Two components rewritten in-place in `src/App.jsx`. One new helper + constant added to `src/geo.js`. Tests added to `src/geo.test.js`. No new files, no new dependencies.

**Tech Stack:** React 18, Vite, Vitest, GRS80/NAD83 projection math (existing)

**Spec:** `docs/superpowers/specs/2026-03-21-field-tools-upgrade-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/geo.js` | Modify (lines 12-13, end of file) | Add `MTM_WEST_LIMIT`, `isMtmApplicable()`, clamp MTM zones to 1-17 |
| `src/geo.test.js` | Modify (append) | Tests for `isMtmApplicable()` and height computation H = h - N |
| `src/App.jsx` | Modify (import line, `CoordConverter` function, `ScaleCalc` function, Field Tools `tab==="fieldtools"` block) | Rewrite CoordConverter, ScaleCalc, Field Tools layout. **Note:** Line numbers shift after each task — always locate targets by function name, not line number. |

---

## Task 1: Add MTM boundary logic to geo.js

**Files:**
- Modify: `src/geo.js:12-13` (MTM zone clamping) and append new exports
- Test: `src/geo.test.js` (append new describe block)

- [ ] **Step 1: Write failing tests for `isMtmApplicable()`**

Append to `src/geo.test.js`:

```javascript
describe('MTM Applicability', () => {
  it('returns true for Ottawa (-75.70)', () => {
    expect(isMtmApplicable(-75.7)).toBe(true);
  });

  it('returns true for Halifax (-63.58)', () => {
    expect(isMtmApplicable(-63.58)).toBe(true);
  });

  it('returns true at the boundary (-103.0)', () => {
    expect(isMtmApplicable(-103.0)).toBe(true);
  });

  it('returns false for Calgary (-114.07)', () => {
    expect(isMtmApplicable(-114.07)).toBe(false);
  });

  it('returns false for Prince George (-122.75)', () => {
    expect(isMtmApplicable(-122.75)).toBe(false);
  });

  it('returns false for Vancouver (-123.12)', () => {
    expect(isMtmApplicable(-123.12)).toBe(false);
  });

  it('returns true just east of boundary (-102.99)', () => {
    expect(isMtmApplicable(-102.99)).toBe(true);
  });

  it('returns false just west of boundary (-103.01)', () => {
    expect(isMtmApplicable(-103.01)).toBe(false);
  });
});
```

Also update the import line at the top of `src/geo.test.js` (line 3-9) to include `isMtmApplicable`:

```javascript
import {
  GRS80_A, GRS80_F, GRS80_E2, GRS80_EP2,
  ddToDms, dmsToDd,
  getUtmZone, utmCM, getMtmZone, mtmCM,
  geoToTM, tmToGeo, geoToUtm, geoToMtm,
  gridScaleFactor, elevFactor,
  isMtmApplicable,
} from './geo.js';
```

- [ ] **Step 2: Run tests — verify new tests fail**

Run: `npm test`
Expected: New `isMtmApplicable` tests fail with "isMtmApplicable is not a function"

- [ ] **Step 3: Implement `MTM_WEST_LIMIT` and `isMtmApplicable()` in geo.js**

Add after the `mtmCM` function (line 13):

```javascript
export const MTM_WEST_LIMIT = -103.0; // Western boundary of MTM zone 17
export function isMtmApplicable(lon) { return lon >= MTM_WEST_LIMIT; }
```

Also change `getMtmZone` (line 12) to clamp to 17 instead of 32:

```javascript
export function getMtmZone(lon){return Math.max(1,Math.min(17,Math.round((-lon-50.5)/3)));}
```

- [ ] **Step 4: Update the Prince George MTM zone test that will break**

The existing test at line ~226 asserts that `mtmCM(z)` is within 1.5° of Prince George's longitude. After clamping to zone 17, PG's zone becomes 17 (CM = -101.5°) which is 21° away. Update this test to accept the clamped behavior:

Find in `src/geo.test.js` the test `'Prince George (-122.75) → reasonable MTM zone'` and replace it:

```javascript
  it('Prince George (-122.75) → clamped to zone 17 (MTM does not cover western Canada)', () => {
    const z = getMtmZone(-122.7497);
    expect(z).toBe(17); // Clamped — MTM not applicable west of -103.0°
  });
```

Also update the clamp range test:

Find `expect(getMtmZone(-180)).toBeLessThanOrEqual(32);` and change `32` to `17`.

- [ ] **Step 5: Run tests — verify all pass**

Run: `npm test`
Expected: All tests pass (existing updated + new MTM applicability tests)

- [ ] **Step 5: Commit**

```bash
git add src/geo.js src/geo.test.js
git commit -m "feat: add isMtmApplicable() and clamp MTM zones to 1-17"
```

---

## Task 2: Add height computation tests

**Files:**
- Test: `src/geo.test.js` (append new describe block)

Height computation is pure arithmetic (`H = h - N`) done in the React component, but we should still test the formula logic to document edge cases.

- [ ] **Step 1: Write height computation tests**

Append to `src/geo.test.js`:

```javascript
describe('Height Computation (H = h - N)', () => {
  const computeH = (h, N) => h - N;

  it('typical BC point: h=620, N=16.432 → H=603.568', () => {
    expect(computeH(620, 16.432)).toBeCloseTo(603.568, 3);
  });

  it('sea level: h=16, N=16 → H=0', () => {
    expect(computeH(16, 16)).toBeCloseTo(0, 6);
  });

  it('zero geoid undulation: h=580, N=0 → H=580', () => {
    expect(computeH(580, 0)).toBe(580);
  });

  it('negative N (geoid below ellipsoid): h=100, N=-5 → H=105', () => {
    expect(computeH(100, -5)).toBe(105);
  });

  it('negative H (below geoid, low-lying area): h=2, N=10 → H=-8', () => {
    expect(computeH(2, 10)).toBe(-8);
  });

  it('large N value: h=500, N=40 → H=460', () => {
    expect(computeH(500, 40)).toBe(460);
  });
});
```

- [ ] **Step 2: Run tests — verify all pass**

Run: `npm test`
Expected: All pass (pure arithmetic, no implementation needed)

- [ ] **Step 3: Commit**

```bash
git add src/geo.test.js
git commit -m "test: add height computation H = h - N edge case tests"
```

---

## Task 3: Rewrite CoordConverter component

**Files:**
- Modify: `src/App.jsx:2` (import line — add `isMtmApplicable`)
- Modify: `src/App.jsx:322-412` (replace entire CoordConverter function)

This is the largest task. The new component adds:
- Height inputs (h, N) with computed H
- Lock/unlock zone override for UTM and MTM
- Conditional MTM visibility via `isMtmApplicable()`
- Collapsible help panel
- Tooltips (? icons with hover text)

- [ ] **Step 1: Update import line**

Change line 2 of `src/App.jsx` from:

```javascript
import { ddToDms, dmsToDd, getUtmZone, utmCM, getMtmZone, mtmCM, geoToTM, tmToGeo, geoToUtm, geoToMtm, gridScaleFactor, elevFactor, utmEpsgStr } from "./geo.js";
```

to:

```javascript
import { ddToDms, dmsToDd, getUtmZone, utmCM, getMtmZone, mtmCM, geoToTM, tmToGeo, geoToUtm, geoToMtm, gridScaleFactor, elevFactor, utmEpsgStr, isMtmApplicable } from "./geo.js";
```

- [ ] **Step 2: Add Tooltip helper component**

Insert just before the `CoordConverter` function definition (before line 322). This is a shared component used by both CoordConverter and ScaleCalc:

```jsx
// ── Tooltip helper ──
function Tip({text}){
  const [show,setShow]=useState(false);
  return(<span style={{position:"relative",display:"inline-block",marginLeft:4}}>
    <span onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)} onClick={()=>setShow(s=>!s)}
      style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:14,height:14,borderRadius:"50%",background:B.border,color:B.textMid,fontSize:9,cursor:"help",fontWeight:700}}>?</span>
    {show&&<div style={{position:"absolute",bottom:"120%",left:"50%",transform:"translateX(-50%)",background:B.surface,border:`1px solid ${B.borderHi}`,borderRadius:4,padding:"6px 10px",fontSize:10,color:B.text,lineHeight:1.4,width:220,zIndex:100,boxShadow:"0 4px 12px rgba(0,0,0,0.3)"}}>{text}</div>}
  </span>);
}

// ── Collapsible help panel ──
function HelpPanel({text}){
  const [open,setOpen]=useState(false);
  return(<div style={{marginBottom:10}}>
    <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:`1px solid ${B.border}`,borderRadius:4,padding:"4px 10px",fontSize:10,color:B.textMid,cursor:"pointer",fontFamily:B.font,display:"flex",alignItems:"center",gap:4}}>
      <span style={{fontSize:8}}>{open?"\u25BC":"\u25B6"}</span> How to use this tool
    </button>
    {open&&<div style={{marginTop:6,padding:"8px 12px",background:B.bg,border:`1px solid ${B.border}`,borderRadius:4,fontSize:10,color:B.textMid,lineHeight:1.6}}>{text}</div>}
  </div>);
}
```

- [ ] **Step 3: Replace CoordConverter function**

Find `function CoordConverter(` in `src/App.jsx` and replace the entire function through its closing `}` (originally lines 322-412, but shifted after Step 2's insertion). The new component:

```jsx
// ── Coordinate Converter Component ──
function CoordConverter({initialLat=53.9171,initialLon=-122.7497}){
  const [inputMode,setInputMode]=useState("dd");
  const [ddLat,setDdLat]=useState(String(initialLat));
  const [ddLon,setDdLon]=useState(String(initialLon));
  const initLatDms=ddToDms(initialLat),initLonDms=ddToDms(Math.abs(initialLon));
  const [dLatD,setDLatD]=useState(String(initLatDms.d));
  const [dLatM,setDLatM]=useState(String(initLatDms.mAdj));
  const [dLatS,setDLatS]=useState(String(initLatDms.s));
  const [dLatDir,setDLatDir]=useState(initialLat>=0?"N":"S");
  const [dLonD,setDLonD]=useState(String(initLonDms.d));
  const [dLonM,setDLonM]=useState(String(initLonDms.mAdj));
  const [dLonS,setDLonS]=useState(String(initLonDms.s));
  const [dLonDir,setDLonDir]=useState(initialLon>=0?"E":"W");
  const [copied,setCopied]=useState("");
  // Height fields
  const [hElip,setHElip]=useState("");
  const [nGeoid,setNGeoid]=useState("");
  // Zone override
  const [utmLocked,setUtmLocked]=useState(true);
  const [mtmLocked,setMtmLocked]=useState(true);
  const [utmZoneOverride,setUtmZoneOverride]=useState("");
  const [mtmZoneOverride,setMtmZoneOverride]=useState("");

  // Canonical DD from whichever input mode is active
  let pLat,pLon;
  if(inputMode==="dd"){
    pLat=parseFloat(ddLat)||0; pLon=parseFloat(ddLon)||0;
  }else{
    const sgnLat=dLatDir==="N"?1:-1, sgnLon=dLonDir==="E"?1:-1;
    pLat=dmsToDd(parseInt(dLatD)||0,parseInt(dLatM)||0,parseFloat(dLatS)||0,sgnLat);
    pLon=dmsToDd(parseInt(dLonD)||0,parseInt(dLonM)||0,parseFloat(dLonS)||0,sgnLon);
  }

  // Zone logic
  const autoUtmZone=getUtmZone(pLon);
  const utmZone=utmLocked?autoUtmZone:(parseInt(utmZoneOverride)||autoUtmZone);
  const showMtm=isMtmApplicable(pLon);
  const autoMtmZone=showMtm?getMtmZone(pLon):1;
  const mtmZone=mtmLocked?autoMtmZone:(parseInt(mtmZoneOverride)||autoMtmZone);

  // Compute all outputs
  const latDms=ddToDms(pLat),lonDms=ddToDms(Math.abs(pLon));
  const utmResult=geoToTM(pLat,pLon,utmCM(utmZone),0.9996,500000,pLat>=0?0:1e7);
  const utmHemi=pLat>=0?"N":"S";
  const mtmResult=showMtm?geoToTM(pLat,pLon,mtmCM(mtmZone),0.9999,304800,0):null;

  // Height computation
  const h=parseFloat(hElip), n=parseFloat(nGeoid);
  const hValid=!isNaN(h), nValid=!isNaN(n);
  const orthoH=hValid&&nValid?(h-n):NaN;

  const ddStr=`${pLat.toFixed(6)}, ${pLon.toFixed(6)}`;
  const dmsStr=`${latDms.d}\u00B0 ${latDms.mAdj}' ${latDms.s.toFixed(2)}" ${pLat>=0?"N":"S"}, ${lonDms.d}\u00B0 ${lonDms.mAdj}' ${lonDms.s.toFixed(2)}" ${pLon>=0?"E":"W"}`;
  const utmStr=`${utmZone}${utmHemi}  ${utmResult.easting.toFixed(2)} E  ${utmResult.northing.toFixed(2)} N`;
  const mtmStr=mtmResult?`Zone ${mtmZone}  ${mtmResult.easting.toFixed(2)} E  ${mtmResult.northing.toFixed(2)} N`:"";
  const htStr=hValid?`h: ${h.toFixed(3)} m`+(nValid?` | N: ${n.toFixed(3)} m | H: ${orthoH.toFixed(3)} m (CGVD2013)`:""):"";

  // Sync functions
  const syncDdToDms=()=>{
    const la=ddToDms(parseFloat(ddLat)||0),lo=ddToDms(Math.abs(parseFloat(ddLon)||0));
    setDLatD(String(la.d));setDLatM(String(la.mAdj));setDLatS(String(la.s));setDLatDir((parseFloat(ddLat)||0)>=0?"N":"S");
    setDLonD(String(lo.d));setDLonM(String(lo.mAdj));setDLonS(String(lo.s));setDLonDir((parseFloat(ddLon)||0)>=0?"E":"W");
  };
  const syncDmsToDd=()=>{
    const sgnLa=dLatDir==="N"?1:-1,sgnLo=dLonDir==="E"?1:-1;
    setDdLat(dmsToDd(parseInt(dLatD)||0,parseInt(dLatM)||0,parseFloat(dLatS)||0,sgnLa).toFixed(6));
    setDdLon(dmsToDd(parseInt(dLonD)||0,parseInt(dLonM)||0,parseFloat(dLonS)||0,sgnLo).toFixed(6));
  };

  const switchMode=(m)=>{if(m===inputMode)return;if(m==="dms")syncDdToDms();else syncDmsToDd();setInputMode(m);};
  const copyText=(txt,label)=>{try{navigator.clipboard.writeText(txt);setCopied(label);setTimeout(()=>setCopied(""),1500);}catch{}};

  const inp={background:B.bg,border:`1px solid ${B.borderHi}`,borderRadius:4,padding:"4px 8px",color:B.text,fontSize:12,outline:"none",fontFamily:B.font};
  const dmsInp={...inp,width:48,textAlign:"center"};
  const toggleBtn=(active,label)=>({padding:"4px 10px",fontSize:11,fontWeight:active?700:400,fontFamily:B.font,color:active?B.bg:B.textMid,background:active?B.priBr:"transparent",border:`1px solid ${active?B.priBr:B.border}`,borderRadius:3,cursor:"pointer"});
  const outRow={display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 10px",borderRadius:4,background:B.bg,border:`1px solid ${B.border}`,marginBottom:4};
  const copyBtn=(txt,label)=><button onClick={()=>copyText(txt,label)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:copied===label?B.priBr:B.textDim,fontFamily:B.font,padding:"2px 6px"}}>{copied===label?"\u2713":"📋"}</button>;
  const lockBtn=(locked,onToggle)=><button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:"2px 4px",color:locked?B.textDim:B.priBr}} title={locked?"Auto-detected. Click to override.":"Manual override. Click to auto-detect."}>{locked?"\uD83D\uDD12":"\uD83D\uDD13"}</button>;

  return(<div>
    <HelpPanel text="Enter geographic coordinates in Decimal Degrees (DD) or Degrees-Minutes-Seconds (DMS). UTM and MTM projections are computed automatically for your location. To override the auto-detected zone, click the lock icon. For heights, enter your ellipsoidal height from GNSS and geoid undulation (N) from NRCan's GPS\u00B7H tool \u2014 orthometric height is computed as H = h \u2212 N. All coordinates reference NAD83(CSRS) on the GRS80 ellipsoid. Heights reference CGVD2013."/>
    <div style={{fontSize:11,color:B.textMid,marginBottom:4}}>Convert between geographic (DD/DMS), UTM, and MTM projections.</div>
    <div style={{fontSize:10,color:B.textDim,marginBottom:8}}>NAD83(CSRS) {"\u00B7"} GRS80 {"\u00B7"} CGVD2013</div>
    <div style={{display:"flex",gap:4,marginBottom:10}}>
      <button onClick={()=>switchMode("dd")} style={toggleBtn(inputMode==="dd","DD")}>DD</button>
      <button onClick={()=>switchMode("dms")} style={toggleBtn(inputMode==="dms","DMS")}>DMS</button>
    </div>
    {inputMode==="dd"?(
      <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{fontSize:11,color:B.textMid}}>Lat</label><input value={ddLat} onChange={e=>setDdLat(e.target.value)} style={{...inp,width:120}}/>
        <label style={{fontSize:11,color:B.textMid}}>Lon</label><input value={ddLon} onChange={e=>setDdLon(e.target.value)} style={{...inp,width:120}}/></div>
    ):(
      <div style={{marginBottom:8}}>
        <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
          <label style={{fontSize:10,color:B.textDim,width:24}}>Lat</label>
          <input value={dLatD} onChange={e=>setDLatD(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
          <input value={dLatM} onChange={e=>setDLatM(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
          <input value={dLatS} onChange={e=>setDLatS(e.target.value)} style={{...dmsInp,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
          <button onClick={()=>setDLatDir(d=>d==="N"?"S":"N")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{dLatDir}</button></div>
        <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
          <label style={{fontSize:10,color:B.textDim,width:24}}>Lon</label>
          <input value={dLonD} onChange={e=>setDLonD(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
          <input value={dLonM} onChange={e=>setDLonM(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
          <input value={dLonS} onChange={e=>setDLonS(e.target.value)} style={{...dmsInp,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
          <button onClick={()=>setDLonDir(d=>d==="E"?"W":"E")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{dLonDir}</button></div>
      </div>
    )}
    {/* Height inputs */}
    <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
      <label style={{fontSize:11,color:B.textMid}}>h<Tip text="Ellipsoidal height — the height above the GRS80 ellipsoid as measured by GNSS. This is NOT the same as elevation above sea level."/></label>
      <input value={hElip} onChange={e=>setHElip(e.target.value)} placeholder="Ellipsoidal" style={{...inp,width:100}}/>
      <label style={{fontSize:11,color:B.textMid}}>N<Tip text="Geoid undulation — the separation between the GRS80 ellipsoid and the geoid at your location. Get this from your GNSS processing software or NRCan's GPS\u00B7H tool. In most of Canada, N is positive (geoid above ellipsoid)."/></label>
      <input value={nGeoid} onChange={e=>setNGeoid(e.target.value)} placeholder="Geoid Und." style={{...inp,width:100}}/>
      <span style={{fontSize:11,color:B.textMid}}>H<Tip text="Orthometric height — height above mean sea level (CGVD2013). Computed as H = h \u2212 N."/></span>
      <span style={{fontFamily:B.font,fontSize:12,color:!isNaN(orthoH)?B.priBr:B.textDim,fontWeight:600}}>{!isNaN(orthoH)?orthoH.toFixed(3)+" m":"\u2014"}</span>
      <span style={{fontSize:10,color:B.textDim}}>m</span>
    </div>
    {/* Zone controls */}
    <div style={{display:"flex",gap:12,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <span style={{fontSize:10,color:B.textDim}}>UTM</span>
        {lockBtn(utmLocked,()=>{if(utmLocked)setUtmZoneOverride(String(autoUtmZone));setUtmLocked(l=>!l);})}
        {utmLocked?<span style={{fontFamily:B.font,fontSize:12,color:B.text}}>{autoUtmZone}{utmHemi}</span>
          :<input value={utmZoneOverride} onChange={e=>{const v=parseInt(e.target.value);if(!e.target.value)setUtmZoneOverride("");else if(v>=1&&v<=60)setUtmZoneOverride(String(v));}} style={{...inp,width:48,textAlign:"center"}} min="1" max="60"/>}
        <span style={{fontSize:9,color:utmLocked?B.textDim:B.priBr}}>{utmLocked?"Auto":"Manual"}</span>
      </div>
      {showMtm&&<div style={{display:"flex",alignItems:"center",gap:4}}>
        <span style={{fontSize:10,color:B.textDim}}>MTM</span>
        {lockBtn(mtmLocked,()=>{if(mtmLocked)setMtmZoneOverride(String(autoMtmZone));setMtmLocked(l=>!l);})}
        {mtmLocked?<span style={{fontFamily:B.font,fontSize:12,color:B.text}}>{autoMtmZone}</span>
          :<input value={mtmZoneOverride} onChange={e=>{const v=parseInt(e.target.value);if(!e.target.value)setMtmZoneOverride("");else if(v>=1&&v<=17)setMtmZoneOverride(String(v));}} style={{...inp,width:48,textAlign:"center"}} min="1" max="17"/>}
        <span style={{fontSize:9,color:mtmLocked?B.textDim:B.priBr}}>{mtmLocked?"Auto":"Manual"}</span>
      </div>}
    </div>
    {/* Outputs */}
    <div style={{borderTop:`1px solid ${B.border}`,paddingTop:10}}>
      <div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>All Formats</div>
      <div style={outRow}><span style={{fontFamily:B.font,fontSize:10,color:B.textDim,width:32}}>DD</span><span style={{fontFamily:B.font,fontSize:12,color:B.text,flex:1}}>{pLat.toFixed(6)}{"\u00B0"}, {pLon.toFixed(6)}{"\u00B0"}</span>{copyBtn(ddStr,"dd")}</div>
      <div style={outRow}><span style={{fontFamily:B.font,fontSize:10,color:B.textDim,width:32}}>DMS</span><span style={{fontFamily:B.font,fontSize:12,color:B.text,flex:1}}>{dmsStr}</span>{copyBtn(dmsStr,"dms")}</div>
      <div style={outRow}><span style={{fontFamily:B.font,fontSize:10,color:B.textDim,width:32}}>UTM</span><span style={{fontFamily:B.font,fontSize:12,color:B.priBr,flex:1}}>{utmStr}</span><span style={{fontFamily:B.font,fontSize:9,color:B.textDim}}>{utmEpsgStr(utmZone,utmHemi)}</span>{copyBtn(utmStr,"utm")}</div>
      {showMtm&&<div style={outRow}><span style={{fontFamily:B.font,fontSize:10,color:B.textDim,width:32}}>MTM</span><span style={{fontFamily:B.font,fontSize:12,color:B.priBr,flex:1}}>{mtmStr}</span>{copyBtn(mtmStr,"mtm")}</div>}
      {htStr&&<div style={outRow}><span style={{fontFamily:B.font,fontSize:10,color:B.textDim,width:32}}>HT</span><span style={{fontFamily:B.font,fontSize:12,color:B.text,flex:1}}>{htStr}</span>{copyBtn(htStr,"ht")}</div>}
    </div>
  </div>);
}
```

- [ ] **Step 4: Run `npm run build` — verify no build errors**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: rewrite CoordConverter with zone override, heights, MTM visibility, tooltips"
```

---

## Task 4: Rewrite ScaleCalc component

**Files:**
- Modify: `src/App.jsx:415-482` (replace entire ScaleCalc function)

New features:
- Elevation label changed to "Orthometric Height (H) (CGVD2013)"
- MTM hidden when west of -103.0°
- Lock/unlock zone override (same pattern as converter)
- Tooltips on all three scale factor boxes
- Collapsible help panel

- [ ] **Step 1: Replace ScaleCalc function**

Find `function ScaleCalc(` in `src/App.jsx` and replace the entire function through its closing `}` (line numbers will have shifted from Task 3):

```jsx
// ── Scale & Distance Component ──
function ScaleCalc({initialLat=53.9171,initialLon=-122.7497}){
  const [lat,setLat]=useState(String(initialLat));
  const [lon,setLon]=useState(String(initialLon));
  const [elev,setElev]=useState("580");
  const [groundDist,setGroundDist]=useState("");
  const [gridDist,setGridDist]=useState("");
  const [projType,setProjType]=useState("utm");
  const [lastEdited,setLastEdited]=useState("ground");
  // Zone override
  const [zoneLocked,setZoneLocked]=useState(true);
  const [zoneOverride,setZoneOverride]=useState("");

  const pLat=parseFloat(lat)||initialLat,pLon=parseFloat(lon)||initialLon,h=parseFloat(elev)||0;
  const showMtm=isMtmApplicable(pLon);
  // If MTM not applicable and projType is mtm, force to utm
  const effectiveProj=(!showMtm&&projType==="mtm")?"utm":projType;
  const autoZone=effectiveProj==="utm"?getUtmZone(pLon):getMtmZone(pLon);
  const zone=zoneLocked?autoZone:(parseInt(zoneOverride)||autoZone);
  const cm=effectiveProj==="utm"?utmCM(zone):mtmCM(zone);
  const k0=effectiveProj==="utm"?0.9996:0.9999;
  const gsf=gridScaleFactor(pLat,pLon,cm,k0);
  const ef=elevFactor(pLat,h);
  const csf=gsf*ef;

  const gd=parseFloat(groundDist),grd=parseFloat(gridDist);
  const computedGrid=gd&&lastEdited==="ground"?(gd*csf).toFixed(4):"";
  const computedGround=grd&&lastEdited==="grid"?(grd/csf).toFixed(4):"";

  const maxZone=effectiveProj==="utm"?60:17;

  const inp={background:B.bg,border:`1px solid ${B.borderHi}`,borderRadius:4,padding:"4px 8px",color:B.text,fontSize:12,outline:"none",fontFamily:B.font};
  const toggleBtn=(m)=>({padding:"4px 10px",fontSize:11,fontWeight:effectiveProj===m?700:400,fontFamily:B.font,color:effectiveProj===m?B.bg:B.textMid,background:effectiveProj===m?B.priBr:"transparent",border:`1px solid ${effectiveProj===m?B.priBr:B.border}`,borderRadius:3,cursor:"pointer"});
  const insetStyle={background:B.inset,border:`2px solid ${B.border}`,borderTopColor:B.bvD,borderLeftColor:B.bvD,borderBottomColor:B.bvL,borderRightColor:B.bvL};
  const lockBtn=(locked,onToggle)=><button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:"2px 4px",color:locked?B.textDim:B.priBr}} title={locked?"Auto-detected. Click to override.":"Manual override. Click to auto-detect."}>{locked?"\uD83D\uDD12":"\uD83D\uDD13"}</button>;

  return(<div>
    <HelpPanel text="Enter a position and elevation to compute scale factors for your projection zone. The Combined Scale Factor (CSF) converts between ground-level measurements and grid distances on the projection. Ground Distance \u00D7 CSF = Grid Distance. For precise work, ensure your elevation references CGVD2013."/>
    <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
      <label style={{fontSize:11,color:B.textMid}}>Lat</label><input value={lat} onChange={e=>setLat(e.target.value)} style={{...inp,width:100}}/>
      <label style={{fontSize:11,color:B.textMid}}>Lon</label><input value={lon} onChange={e=>setLon(e.target.value)} style={{...inp,width:100}}/>
      <label style={{fontSize:11,color:B.textMid}}>H<Tip text="Orthometric height above mean sea level (CGVD2013). Used to compute the elevation factor. Using orthometric height instead of ellipsoidal height introduces negligible error at 6 decimal places."/></label>
      <input value={elev} onChange={e=>setElev(e.target.value)} style={{...inp,width:60}}/><span style={{fontSize:10,color:B.textDim}}>m (CGVD2013)</span>
    </div>
    <div style={{display:"flex",gap:4,marginBottom:10,alignItems:"center"}}>
      <button onClick={()=>{setProjType("utm");setZoneLocked(true);}} style={toggleBtn("utm")}>UTM</button>
      {showMtm&&<button onClick={()=>{setProjType("mtm");setZoneLocked(true);}} style={toggleBtn("mtm")}>MTM</button>}
      {lockBtn(zoneLocked,()=>{if(zoneLocked)setZoneOverride(String(autoZone));setZoneLocked(l=>!l);})}
      {zoneLocked?<span style={{fontFamily:B.font,fontSize:12,color:B.text}}>{effectiveProj.toUpperCase()} {zone}{effectiveProj==="utm"?(pLat>=0?"N":"S"):""}</span>
        :<input value={zoneOverride} onChange={e=>{const v=parseInt(e.target.value);if(!e.target.value)setZoneOverride("");else if(v>=1&&v<=maxZone)setZoneOverride(String(v));}} style={{...inp,width:48,textAlign:"center"}}/>}
      <span style={{fontSize:9,color:zoneLocked?B.textDim:B.priBr}}>{zoneLocked?"Auto":"Manual"}</span>
      <span style={{fontSize:10,color:B.textDim,marginLeft:6}}>NAD83(CSRS) {"\u00B7"} GRS80</span>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
      {[
        {label:"Grid Scale",val:gsf.toFixed(6),sub:`${effectiveProj.toUpperCase()} ${zone}${effectiveProj==="utm"?(pLat>=0?"N":"S"):""}`,color:B.sec,tip:"How much the projection distorts distances at this location. Equals k\u2080 at the central meridian; increases with distance from it."},
        {label:"Elev Factor",val:ef.toFixed(6),sub:`${h}m MSL`,color:B.text,tip:"Accounts for the difference between measurements at your elevation and on the ellipsoid surface. Higher elevation = smaller factor."},
        {label:"Combined",val:csf.toFixed(6),sub:"CSF",color:B.priBr,tip:"Grid Scale \u00D7 Elevation Factor. Multiply ground distance by CSF to get grid distance."}
      ].map(x=>(
        <div key={x.label} style={{...insetStyle,padding:10,textAlign:"center"}}>
          <div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1.5,textTransform:"uppercase"}}>{x.label}<Tip text={x.tip}/></div>
          <div style={{fontFamily:B.display,fontSize:14,fontWeight:800,color:x.color,margin:"4px 0"}}>{x.val}</div>
          <div style={{fontFamily:B.font,fontSize:10,color:B.textDim}}>{x.sub}</div>
        </div>
      ))}
    </div>
    <div style={{borderTop:`1px solid ${B.border}`,paddingTop:10}}>
      <div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Distance Conversion</div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
        <label style={{fontSize:11,color:B.textMid,width:60}}>Ground</label>
        <input value={lastEdited==="ground"?groundDist:computedGround} onChange={e=>{setGroundDist(e.target.value);setLastEdited("ground");}} style={{...inp,width:120}} placeholder="0.0000"/>
        <span style={{fontSize:11,color:B.textDim}}>m</span>
        <span style={{fontSize:11,color:B.textDim}}>{"\u2192"}</span>
        <span style={{fontFamily:B.font,fontSize:12,color:B.priBr}}>{lastEdited==="ground"&&computedGrid?computedGrid+" m":"\u2014"}</span>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{fontSize:11,color:B.textMid,width:60}}>Grid</label>
        <input value={lastEdited==="grid"?gridDist:computedGrid} onChange={e=>{setGridDist(e.target.value);setLastEdited("grid");}} style={{...inp,width:120}} placeholder="0.0000"/>
        <span style={{fontSize:11,color:B.textDim}}>m</span>
        <span style={{fontSize:11,color:B.textDim}}>{"\u2192"}</span>
        <span style={{fontFamily:B.font,fontSize:12,color:B.priBr}}>{lastEdited==="grid"&&computedGround?computedGround+" m":"\u2014"}</span>
      </div>
    </div>
  </div>);
}
```

- [ ] **Step 2: Run `npm run build` — verify no build errors**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: rewrite ScaleCalc with zone override, MTM visibility, tooltips, help panel"
```

---

## Task 5: Restructure Field Tools layout

**Files:**
- Modify: `src/App.jsx:1076-1103` (Field Tools tab section)

Change from 2-column (MagPanel left, Converter+Scale right) to: full-width Converter on top, Scale+MagPanel side-by-side below, full-width disclaimer at bottom.

- [ ] **Step 1: Replace Field Tools layout**

Find the `{tab==="fieldtools"&&(` block in `src/App.jsx` and replace it entirely (the block runs from the `{tab==="fieldtools"` line through its matching closing `)}`):

```jsx
{tab==="fieldtools"&&(
  <div style={{display:"flex",flexDirection:"column",gap:12}}>
    {/* Full-width Coordinate Converter */}
    <div style={cardStyle}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span>{"\uD83D\uDCE1"}</span>
        <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Coordinate Converter</h2>
      </div>
      <CoordConverter initialLat={lat} initialLon={lon}/>
    </div>
    {/* Scale + MagPanel side by side (cmd-split collapses to 1 column at 768px) */}
    <div className="cmd-split" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={cardStyle}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span>{"\uD83D\uDCCF"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Scale & Distance</h2>
        </div>
        <ScaleCalc initialLat={lat} initialLon={lon}/>
      </div>
      <div style={cardStyle}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <span>{"\uD83E\uDDED"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Magnetic Declination</h2>
        </div>
        <MagPanel initialLat={lat} initialLon={lon}/>
      </div>
    </div>
    {/* Disclaimer */}
    <div style={{background:"#3b82f610",border:"1px solid #3b82f620",borderRadius:5,padding:"6px 8px",fontSize:10,color:B.textDim,lineHeight:1.5}}>
      Reference tool only {"\u2014"} not for legal survey or navigation use. For official work, use{" "}
      <a href="https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/trx.php" target="_blank" rel="noopener noreferrer" style={{color:"#3b82f6",textDecoration:"underline"}}>NRCan TRX</a>
      {" "}and{" "}
      <a href="https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/gpsh.php" target="_blank" rel="noopener noreferrer" style={{color:"#3b82f6",textDecoration:"underline"}}>GPS{"\u00B7"}H</a>.
      {" "}Projections computed on GRS80 ellipsoid (NAD83). Heights reference CGVD2013.
    </div>
  </div>
)}
```

- [ ] **Step 2: Run `npm run build` — verify clean build**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 3: Run `npm test` — verify all tests still pass**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: restructure Field Tools layout — full-width converter, Scale+Mag side-by-side"
```

---

## Task 6: Visual verification and final testing

- [ ] **Step 1: Start dev server and visually verify**

Run: `npm run dev`

Check:
- Field Tools tab shows Converter full-width on top
- DD input pre-populates with GPS/default coords
- Switch to DMS — values match DD
- UTM output shows correct zone and coordinates
- MTM row is hidden for Prince George (west of -103.0°)
- Click UTM lock icon → zone becomes editable → enter different zone → UTM coords update
- Enter h=620, N=16.432 → H shows 603.568
- Heights output row appears with copy button
- Scale & Distance below, side-by-side with MagPanel
- Scale calc MTM toggle not visible for western locations
- Tooltips appear on hover for ?, scale factor boxes
- Help panels expand/collapse
- Disclaimer at bottom with working NRCan links

- [ ] **Step 2: Test with eastern Canada coordinates**

Enter Ottawa coords (45.4215, -75.6972):
- MTM row should appear (east of -103.0°)
- MTM zone should show 8
- UTM zone should show 18
- Both should have lock/unlock capability

- [ ] **Step 3: Test mobile responsiveness**

Resize browser to < 768px width:
- Layout should stack vertically
- All inputs still usable
- Tooltips still visible on tap

- [ ] **Step 4: Run full test suite one final time**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 5: Run production build**

Run: `npm run build`
Expected: Clean build

- [ ] **Step 6: Final commit and push**

```bash
git add -A
git commit -m "feat: Field Tools v2 — zone override, heights, conditional MTM, inline help

Complete rewrite of CoordConverter and ScaleCalc components:
- Lock/unlock zone override for UTM (1-60) and MTM (1-17)
- Ellipsoidal height (h) + geoid undulation (N) → orthometric height (H = h - N)
- MTM hidden when west of -103.0° (zone 17 western boundary)
- Collapsible help panels and field tooltips
- Full-width converter layout with Scale + MagPanel side-by-side below
- Updated disclaimer with NRCan TRX and GPS·H links"

git push
```
