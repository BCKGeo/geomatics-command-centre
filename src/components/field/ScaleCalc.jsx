import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Tip } from "../ui/Tip.jsx";
import { HelpPanel } from "../ui/HelpPanel.jsx";
import { ddToDms, dmsToDd, getUtmZone, utmCM, getMtmZone, mtmCM, isMtmApplicable, gridScaleFactor, elevFactor } from "../../geo.js";
import { DEFAULT_LAT, DEFAULT_LON } from "../../data/constants.js";

export function ScaleCalc({initialLat=DEFAULT_LAT,initialLon=DEFAULT_LON}){
  const { B } = useTheme();
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
  // DD/DMS toggle
  const [coordMode,setCoordMode]=useState("dd");
  const initLatDms3=ddToDms(initialLat),initLonDms3=ddToDms(Math.abs(initialLon));
  const [scDmsLatD,setScDmsLatD]=useState(String(initLatDms3.d));
  const [scDmsLatM,setScDmsLatM]=useState(String(initLatDms3.mAdj));
  const [scDmsLatS,setScDmsLatS]=useState(String(initLatDms3.s));
  const [scDmsLatDir,setScDmsLatDir]=useState(initialLat>=0?"N":"S");
  const [scDmsLonD,setScDmsLonD]=useState(String(initLonDms3.d));
  const [scDmsLonM,setScDmsLonM]=useState(String(initLonDms3.mAdj));
  const [scDmsLonS,setScDmsLonS]=useState(String(initLonDms3.s));
  const [scDmsLonDir,setScDmsLonDir]=useState(initialLon>=0?"E":"W");
  const scSyncDdToDms=()=>{
    const la=ddToDms(parseFloat(lat)||0),lo=ddToDms(Math.abs(parseFloat(lon)||0));
    setScDmsLatD(String(la.d));setScDmsLatM(String(la.mAdj));setScDmsLatS(String(la.s));setScDmsLatDir((parseFloat(lat)||0)>=0?"N":"S");
    setScDmsLonD(String(lo.d));setScDmsLonM(String(lo.mAdj));setScDmsLonS(String(lo.s));setScDmsLonDir((parseFloat(lon)||0)>=0?"E":"W");
  };
  const scSyncDmsToDd=()=>{
    const sgnLa=scDmsLatDir==="N"?1:-1,sgnLo=scDmsLonDir==="E"?1:-1;
    setLat(dmsToDd(parseInt(scDmsLatD)||0,parseInt(scDmsLatM)||0,parseFloat(scDmsLatS)||0,sgnLa).toFixed(6));
    setLon(dmsToDd(parseInt(scDmsLonD)||0,parseInt(scDmsLonM)||0,parseFloat(scDmsLonS)||0,sgnLo).toFixed(6));
  };
  const switchCoordMode=(m2)=>{if(m2===coordMode)return;if(m2==="dms")scSyncDdToDms();else scSyncDmsToDd();setCoordMode(m2);};

  let pLat,pLon;
  if(coordMode==="dd"){
    pLat=parseFloat(lat)||initialLat; pLon=parseFloat(lon)||initialLon;
  }else{
    const sgnLat=scDmsLatDir==="N"?1:-1, sgnLon=scDmsLonDir==="E"?1:-1;
    pLat=dmsToDd(parseInt(scDmsLatD)||0,parseInt(scDmsLatM)||0,parseFloat(scDmsLatS)||0,sgnLat);
    pLon=dmsToDd(parseInt(scDmsLonD)||0,parseInt(scDmsLonM)||0,parseFloat(scDmsLonS)||0,sgnLon);
  }
  const h=parseFloat(elev)||0;
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

  const inp={background:B.bg,border:`1px solid ${B.borderHi}`,borderRadius:4,padding:"4px 8px",color:B.text,fontSize:16,outline:"none",fontFamily:B.font,boxSizing:"border-box"};
  const dmsInpSc={...inp,width:"100%",maxWidth:48,textAlign:"center"};
  const coordToggleBtn=(active)=>({padding:"4px 10px",fontSize:11,fontWeight:active?700:400,fontFamily:B.font,color:active?B.bg:B.textMid,background:active?B.priBr:"transparent",border:`1px solid ${active?B.priBr:B.border}`,borderRadius:3,cursor:"pointer"});
  const toggleBtn=(m)=>({padding:"4px 10px",fontSize:11,fontWeight:effectiveProj===m?700:400,fontFamily:B.font,color:effectiveProj===m?B.bg:B.textMid,background:effectiveProj===m?B.priBr:"transparent",border:`1px solid ${effectiveProj===m?B.priBr:B.border}`,borderRadius:3,cursor:"pointer"});
  const insetStyle={background:B.inset,border:`2px solid ${B.border}`,borderTopColor:B.bvD,borderLeftColor:B.bvD,borderBottomColor:B.bvL,borderRightColor:B.bvL};
  const lockBtn=(locked,onToggle)=><button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,padding:"2px 4px",color:locked?B.textDim:B.priBr}} title={locked?"Auto-detected. Click to override.":"Manual override. Click to auto-detect."}>{locked?"\uD83D\uDD12":"\uD83D\uDD13"}</button>;

  return(<div>
    <HelpPanel text={"Enter a position and elevation to compute scale factors for your projection zone. The Combined Scale Factor (CSF) converts between ground-level measurements and grid distances on the projection. Ground Distance \u00D7 CSF = Grid Distance. For precise work, ensure your elevation references CGVD2013."}/>
    <div style={{display:"flex",gap:4,marginBottom:10}}>
      <button onClick={()=>switchCoordMode("dd")} style={coordToggleBtn(coordMode==="dd")}>DD</button>
      <button onClick={()=>switchCoordMode("dms")} style={coordToggleBtn(coordMode==="dms")}>DMS</button>
    </div>
    {coordMode==="dd"?(
    <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
      <label style={{fontSize:11,color:B.textMid}}>Lat</label><input value={lat} onChange={e=>setLat(e.target.value)} style={{...inp,width:100}}/>
      <label style={{fontSize:11,color:B.textMid}}>Lon</label><input value={lon} onChange={e=>setLon(e.target.value)} style={{...inp,width:100}}/>
      <label style={{fontSize:11,color:B.textMid}}>H<Tip text="Orthometric height above mean sea level (CGVD2013). Used to compute the elevation factor. Using orthometric height instead of ellipsoidal height introduces negligible error at 6 decimal places."/></label>
      <input value={elev} onChange={e=>setElev(e.target.value)} style={{...inp,width:60}}/><span style={{fontSize:10,color:B.textDim}}>m (CGVD2013)</span>
    </div>
    ):(
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
        <label style={{fontSize:10,color:B.textDim,width:24}}>Lat</label>
        <input value={scDmsLatD} onChange={e=>setScDmsLatD(e.target.value)} style={dmsInpSc}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
        <input value={scDmsLatM} onChange={e=>setScDmsLatM(e.target.value)} style={dmsInpSc}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
        <input value={scDmsLatS} onChange={e=>setScDmsLatS(e.target.value)} style={{...dmsInpSc,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
        <button onClick={()=>setScDmsLatDir(d=>d==="N"?"S":"N")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{scDmsLatDir}</button></div>
      <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
        <label style={{fontSize:10,color:B.textDim,width:24}}>Lon</label>
        <input value={scDmsLonD} onChange={e=>setScDmsLonD(e.target.value)} style={dmsInpSc}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
        <input value={scDmsLonM} onChange={e=>setScDmsLonM(e.target.value)} style={dmsInpSc}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
        <input value={scDmsLonS} onChange={e=>setScDmsLonS(e.target.value)} style={{...dmsInpSc,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
        <button onClick={()=>setScDmsLonDir(d=>d==="E"?"W":"E")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{scDmsLonDir}</button></div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{fontSize:11,color:B.textMid}}>H<Tip text="Orthometric height above mean sea level (CGVD2013). Used to compute the elevation factor. Using orthometric height instead of ellipsoidal height introduces negligible error at 6 decimal places."/></label>
        <input value={elev} onChange={e=>setElev(e.target.value)} style={{...inp,width:60}}/><span style={{fontSize:10,color:B.textDim}}>m (CGVD2013)</span>
      </div>
    </div>
    )}
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
        {label:"Elev Factor",val:ef.toFixed(6),sub:`${elev||0}m`,color:B.text,tip:"Accounts for the difference between measurements at your elevation and on the ellipsoid surface. Higher elevation = smaller factor."},
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
        <input value={lastEdited==="ground"?groundDist:computedGround} onChange={e=>{setGroundDist(e.target.value);setLastEdited("ground");}} inputMode="decimal" style={{...inp,width:"100%",maxWidth:120,flex:1,minWidth:70}} placeholder="0.0000"/>
        <span style={{fontSize:11,color:B.textDim}}>m</span>
        <span style={{fontSize:11,color:B.textDim}}>{"\u2192"}</span>
        <span style={{fontFamily:B.font,fontSize:12,color:B.priBr}}>{lastEdited==="ground"&&computedGrid?computedGrid+" m":"\u2014"}</span>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{fontSize:11,color:B.textMid,width:60}}>Grid</label>
        <input value={lastEdited==="grid"?gridDist:computedGrid} onChange={e=>{setGridDist(e.target.value);setLastEdited("grid");}} inputMode="decimal" style={{...inp,width:"100%",maxWidth:120,flex:1,minWidth:70}} placeholder="0.0000"/>
        <span style={{fontSize:11,color:B.textDim}}>m</span>
        <span style={{fontSize:11,color:B.textDim}}>{"\u2192"}</span>
        <span style={{fontFamily:B.font,fontSize:12,color:B.priBr}}>{lastEdited==="grid"&&computedGround?computedGround+" m":"\u2014"}</span>
      </div>
    </div>
  </div>);
}
