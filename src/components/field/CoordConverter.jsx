import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Tip } from "../ui/Tip.jsx";
import { HelpPanel } from "../ui/HelpPanel.jsx";
import { ddToDms, dmsToDd, getUtmZone, utmCM, getMtmZone, mtmCM, geoToTM, isMtmApplicable, utmEpsgStr } from "../../geo.js";
import { DEFAULT_LAT, DEFAULT_LON } from "../../data/constants.js";

export function CoordConverter({initialLat=DEFAULT_LAT,initialLon=DEFAULT_LON}){
  const { B } = useTheme();
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
    <HelpPanel text={"Enter geographic coordinates in Decimal Degrees (DD) or Degrees-Minutes-Seconds (DMS). UTM and MTM projections are computed automatically for your location. To override the auto-detected zone, click the lock icon. For heights, enter your ellipsoidal height from GNSS and geoid undulation (N) from NRCan\u2019s GPS\u00B7H tool \u2014 orthometric height is computed as H = h \u2212 N. All coordinates reference NAD83(CSRS) on the GRS80 ellipsoid. Heights reference CGVD2013."}/>
    <div style={{fontSize:11,color:B.textMid,marginBottom:4}}>Convert between geographic coordinates (DD/DMS) and projected coordinates (UTM, MTM).</div>
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
      <label style={{fontSize:11,color:B.textMid}}>h<Tip text={"Ellipsoidal height \u2014 the height above the GRS80 ellipsoid as measured by GNSS. This is NOT the same as elevation above sea level."}/></label>
      <input value={hElip} onChange={e=>setHElip(e.target.value)} placeholder="Ellipsoidal" style={{...inp,width:100}}/>
      <label style={{fontSize:11,color:B.textMid}}>N<Tip text={"Geoid undulation \u2014 the separation between the GRS80 ellipsoid and the geoid at your location. Get this from your GNSS processing software or NRCan\u2019s GPS\u00B7H tool. In most of Canada, N is positive (geoid above ellipsoid)."}/></label>
      <input value={nGeoid} onChange={e=>setNGeoid(e.target.value)} placeholder="Geoid Und." style={{...inp,width:100}}/>
      <span style={{fontSize:11,color:B.textMid}}>H<Tip text={"Orthometric height \u2014 height above mean sea level (CGVD2013). Computed as H = h \u2212 N."}/></span>
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
