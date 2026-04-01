import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { Tip } from "../ui/Tip.jsx";
import { ddToDms, dmsToDd } from "../../geo.js";
import { calcMagDec } from "../../lib/astronomy.js";
import { DEFAULT_LAT, DEFAULT_LON } from "../../data/constants.js";

export function MagPanel({initialLat=DEFAULT_LAT,initialLon=DEFAULT_LON}){
  const { B } = useTheme();
  const [lat,setLat]=useState(String(initialLat)),[lon,setLon]=useState(String(initialLon));
  const [inputMode,setInputMode]=useState("dd");
  const initLatDms2=ddToDms(initialLat),initLonDms2=ddToDms(Math.abs(initialLon));
  const [dmsLatD,setDmsLatD]=useState(String(initLatDms2.d));
  const [dmsLatM,setDmsLatM]=useState(String(initLatDms2.mAdj));
  const [dmsLatS,setDmsLatS]=useState(String(initLatDms2.s));
  const [dmsLatDir,setDmsLatDir]=useState(initialLat>=0?"N":"S");
  const [dmsLonD,setDmsLonD]=useState(String(initLonDms2.d));
  const [dmsLonM,setDmsLonM]=useState(String(initLonDms2.mAdj));
  const [dmsLonS,setDmsLonS]=useState(String(initLonDms2.s));
  const [dmsLonDir,setDmsLonDir]=useState(initialLon>=0?"E":"W");
  const syncDdToDms=()=>{
    const la=ddToDms(parseFloat(lat)||0),lo=ddToDms(Math.abs(parseFloat(lon)||0));
    setDmsLatD(String(la.d));setDmsLatM(String(la.mAdj));setDmsLatS(String(la.s));setDmsLatDir((parseFloat(lat)||0)>=0?"N":"S");
    setDmsLonD(String(lo.d));setDmsLonM(String(lo.mAdj));setDmsLonS(String(lo.s));setDmsLonDir((parseFloat(lon)||0)>=0?"E":"W");
  };
  const syncDmsToDd=()=>{
    const sgnLa=dmsLatDir==="N"?1:-1,sgnLo=dmsLonDir==="E"?1:-1;
    setLat(dmsToDd(parseInt(dmsLatD)||0,parseInt(dmsLatM)||0,parseFloat(dmsLatS)||0,sgnLa).toFixed(6));
    setLon(dmsToDd(parseInt(dmsLonD)||0,parseInt(dmsLonM)||0,parseFloat(dmsLonS)||0,sgnLo).toFixed(6));
  };
  const switchMode=(m2)=>{if(m2===inputMode)return;if(m2==="dms")syncDdToDms();else syncDmsToDd();setInputMode(m2);};
  let magLat,magLon;
  if(inputMode==="dd"){
    magLat=parseFloat(lat)||initialLat; magLon=parseFloat(lon)||initialLon;
  }else{
    const sgnLa=dmsLatDir==="N"?1:-1, sgnLo=dmsLonDir==="E"?1:-1;
    magLat=dmsToDd(parseInt(dmsLatD)||0,parseInt(dmsLatM)||0,parseFloat(dmsLatS)||0,sgnLa);
    magLon=dmsToDd(parseInt(dmsLonD)||0,parseInt(dmsLonM)||0,parseFloat(dmsLonS)||0,sgnLo);
  }
  const m=calcMagDec(magLat,magLon);
  const da=Math.abs(m.declination),dd=Math.floor(da),dm=Math.round((da-dd)*60),dir=m.declination>0?"E":"W";
  const inp={background:B.bg,border:`1px solid ${B.borderHi}`,borderRadius:4,padding:"4px 8px",color:B.text,fontSize:12,width:100,outline:"none",fontFamily:B.font};
  const dmsInp={...inp,width:48,textAlign:"center"};
  const toggleBtn=(active)=>({padding:"4px 10px",fontSize:11,fontWeight:active?700:400,fontFamily:B.font,color:active?B.bg:B.textMid,background:active?B.priBr:"transparent",border:`1px solid ${active?B.priBr:B.border}`,borderRadius:3,cursor:"pointer"});
  return(<div>
    <div style={{display:"flex",gap:4,marginBottom:10}}>
      <button onClick={()=>switchMode("dd")} style={toggleBtn(inputMode==="dd")}>DD</button>
      <button onClick={()=>switchMode("dms")} style={toggleBtn(inputMode==="dms")}>DMS</button>
    </div>
    {inputMode==="dd"?(
    <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center",flexWrap:"wrap"}}>
      <label style={{fontSize:11,color:B.textMid}}>Lat</label><input value={lat} onChange={e=>setLat(e.target.value)} style={inp}/>
      <label style={{fontSize:11,color:B.textMid}}>Lon</label><input value={lon} onChange={e=>setLon(e.target.value)} style={inp}/></div>
    ):(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
        <label style={{fontSize:10,color:B.textDim,width:24}}>Lat</label>
        <input value={dmsLatD} onChange={e=>setDmsLatD(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
        <input value={dmsLatM} onChange={e=>setDmsLatM(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
        <input value={dmsLatS} onChange={e=>setDmsLatS(e.target.value)} style={{...dmsInp,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
        <button onClick={()=>setDmsLatDir(d=>d==="N"?"S":"N")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{dmsLatDir}</button></div>
      <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
        <label style={{fontSize:10,color:B.textDim,width:24}}>Lon</label>
        <input value={dmsLonD} onChange={e=>setDmsLonD(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u00B0"}</span>
        <input value={dmsLonM} onChange={e=>setDmsLonM(e.target.value)} style={dmsInp}/><span style={{fontSize:11,color:B.textDim}}>{"\u2032"}</span>
        <input value={dmsLonS} onChange={e=>setDmsLonS(e.target.value)} style={{...dmsInp,width:60}}/><span style={{fontSize:11,color:B.textDim}}>{"\u2033"}</span>
        <button onClick={()=>setDmsLonDir(d=>d==="E"?"W":"E")} style={{...inp,width:28,textAlign:"center",cursor:"pointer",fontWeight:700,color:B.priBr}}>{dmsLonDir}</button></div>
    </div>
    )}
    <div style={{display:"flex",gap:16,alignItems:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:30,fontWeight:800,color:"#f59e0b",fontFamily:B.font,lineHeight:1}}>{dd}° {dm}′</div>
        <div style={{fontSize:14,fontWeight:700,color:B.gold}}>{dir}</div></div>
      <div style={{flex:1}}>
        <svg viewBox="0 0 100 100" style={{width:80,height:80,display:"block",margin:"0 auto"}}>
          <circle cx="50" cy="50" r="40" fill="none" stroke={B.border} strokeWidth="2"/>
          {["N","E","S","W"].map((d2,i2)=><text key={d2} x={50+34*Math.sin(i2*Math.PI/2)} y={50-34*Math.cos(i2*Math.PI/2)+3} fill={B.textMid} fontSize="9" textAnchor="middle" fontWeight="600">{d2}</text>)}
          <line x1="50" y1="50" x2="50" y2="15" stroke="#3b82f6" strokeWidth="2"/>
          <line x1="50" y1="50" x2={50+33*Math.sin(m.declination*Math.PI/180)} y2={50-33*Math.cos(m.declination*Math.PI/180)} stroke="#ef4444" strokeWidth="2"/>
          <circle cx="50" cy="50" r="2" fill="#94a3b8"/></svg>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:3}}>
          {[{c:"#3b82f6",l:"True N"},{c:"#ef4444",l:"Mag N"}].map(x=><div key={x.l} style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:B.textMid}}><div style={{width:8,height:3,background:x.c,borderRadius:1}}/>{x.l}</div>)}</div></div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
      <div style={{background:B.bg,borderRadius:6,padding:8,textAlign:"center",border:`1px solid ${B.border}`}}><div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1.5,textTransform:"uppercase"}}>Inclination</div><div style={{fontSize:14,fontWeight:700,color:B.textMid,fontFamily:B.font}}>{m.inclination.toFixed(1)}°</div></div>
      <div style={{background:B.bg,borderRadius:6,padding:8,textAlign:"center",border:`1px solid ${B.border}`}}><div style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1.5,textTransform:"uppercase"}}>Total Field</div><div style={{fontSize:14,fontWeight:700,color:B.textMid,fontFamily:B.font}}>{Math.round(m.totalField)} nT</div></div></div>
    <div style={{background:"#f59e0b10",border:"1px solid #f59e0b20",borderRadius:5,padding:"6px 8px",marginTop:10,fontSize:10,color:"#b45309",lineHeight:1.4}}>Approximate only (WMM2025, n=3). Not for navigation or survey use. Always verify with <a href="https://geomag.nrcan.gc.ca/mag_fld/magdec-en.php" target="_blank" rel="noopener noreferrer" style={{color:"#f59e0b",textDecoration:"underline"}}>NRCan</a> or <a href="https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml" target="_blank" rel="noopener noreferrer" style={{color:"#f59e0b",textDecoration:"underline"}}>NOAA NCEI</a> before field use.</div></div>);
}
