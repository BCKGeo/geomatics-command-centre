import { useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";

export function CalcPanel(){
  const { B } = useTheme();
  const [unitVal,setUnitVal]=useState("1");
  const [unitFrom,setUnitFrom]=useState("m");
  const [speedVal,setSpeedVal]=useState("10");
  const [speedFrom,setSpeedFrom]=useState("ms");
  const [tempC,setTempC]=useState("20");

  const inp={background:B.bg,border:`1px solid ${B.borderHi}`,borderRadius:4,padding:"6px 10px",color:B.text,fontSize:13,width:110,outline:"none",fontFamily:B.font};
  const sel={...inp,width:140,cursor:"pointer",WebkitAppearance:"none",appearance:"none"};
  const cardS={background:`linear-gradient(135deg,${B.surface},${B.surfaceHi})`,border:`2px solid ${B.border}`,borderTopColor:B.bvL,borderLeftColor:B.bvL,borderBottomColor:B.bvD,borderRightColor:B.bvD,borderRadius:0,padding:16};
  const inS={background:B.inset,border:`2px solid ${B.border}`,borderTopColor:B.bvD,borderLeftColor:B.bvD,borderBottomColor:B.bvL,borderRightColor:B.bvL};

  // Distance conversions
  const distUnits={
    m:{name:"Metres",toM:1},ft:{name:"Feet (Int'l)",toM:0.3048},ftUS:{name:"Feet (US Survey)",toM:0.3048006096},
    ch:{name:"Chains (Gunter)",toM:20.1168},link:{name:"Links",toM:0.201168},rod:{name:"Rods / Perches",toM:5.0292},
    km:{name:"Kilometres",toM:1000},mi:{name:"Miles",toM:1609.344},nmi:{name:"Nautical Miles",toM:1852},
    yd:{name:"Yards",toM:0.9144},in:{name:"Inches",toM:0.0254},cm:{name:"Centimetres",toM:0.01},mm:{name:"Millimetres",toM:0.001},
    fathom:{name:"Fathoms",toM:1.8288},
  };
  const v=parseFloat(unitVal)||0;
  const metres=v*distUnits[unitFrom].toM;

  // Speed conversions
  const speedUnits={
    ms:{name:"m/s",toMs:1},kph:{name:"km/h",toMs:1/3.6},mph:{name:"mph",toMs:0.44704},
    kn:{name:"Knots",toMs:0.514444},fts:{name:"ft/s",toMs:0.3048},
  };
  const sv=parseFloat(speedVal)||0;
  const ms=sv*speedUnits[speedFrom].toMs;

  // Area conversions from sq metres
  const areaPairs=[
    {l:"1 acre",v:"4,046.86 m\u00B2",v2:"0.4047 ha"},
    {l:"1 hectare",v:"10,000 m\u00B2",v2:"2.471 ac"},
    {l:"1 sq ft",v:"0.0929 m\u00B2",v2:"929.03 cm\u00B2"},
    {l:"1 sq yd",v:"0.8361 m\u00B2",v2:"9 sq ft"},
    {l:"1 sq mi",v:"2.59 km\u00B2",v2:"640 ac"},
    {l:"1 sq ch",v:"404.686 m\u00B2",v2:"0.1 ac"},
  ];

  // Survey-specific
  const surveyPairs=[
    {l:"Chain (Gunter)",v:"20.1168 m",v2:"66 ft / 100 links"},
    {l:"Link",v:"0.201168 m",v2:"7.92 in"},
    {l:"Rod / Perch",v:"5.0292 m",v2:"16.5 ft / 25 links"},
    {l:"Furlong",v:"201.168 m",v2:"10 chains / 660 ft"},
    {l:"Fathom",v:"1.8288 m",v2:"6 ft"},
    {l:"US Survey Foot",v:"0.3048006 m",v2:"1200/3937 m exactly"},
    {l:"Int'l Foot",v:"0.3048 m",v2:"Adopted by Canada/US"},
    {l:"Vara (Texas)",v:"0.8467 m",v2:"33\u2153 in"},
  ];

  // Temp table
  const tc=parseFloat(tempC)||0;
  const tempTable=[-40,-30,-20,-10,0,5,10,15,20,25,30,35,40].map(c=>({c,f:c*9/5+32}));

  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="cmd-split">

      {/* -- Distance Converter -- */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\uD83D\uDCCF"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Distance Converter</h2>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
          <input value={unitVal} onChange={e=>setUnitVal(e.target.value)} style={inp} type="number" step="any"/>
          <select value={unitFrom} onChange={e=>setUnitFrom(e.target.value)} style={sel}>
            {Object.entries(distUnits).map(([k,u])=><option key={k} value={k}>{u.name}</option>)}
          </select>
        </div>
        <div className="calc-results" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          {Object.entries(distUnits).filter(([k])=>k!==unitFrom).map(([k,u])=>{
            const converted=metres/u.toM;
            const display=converted>=1e6||converted<0.001&&converted!==0?converted.toExponential(4):converted<1?converted.toPrecision(6):converted.toLocaleString("en-CA",{maximumFractionDigits:4});
            return(
              <div key={k} style={{...inS,padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1,textTransform:"uppercase"}}>{u.name}</span>
                <span style={{fontFamily:B.font,fontSize:13,fontWeight:700,color:B.text}}>{display}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* -- Speed Converter -- */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\uD83D\uDCA8"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Speed Converter</h2>
          <span style={{fontSize:10,color:B.textDim,marginLeft:"auto"}}>RPAS / Aviation</span>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
          <input value={speedVal} onChange={e=>setSpeedVal(e.target.value)} style={inp} type="number" step="any"/>
          <select value={speedFrom} onChange={e=>setSpeedFrom(e.target.value)} style={sel}>
            {Object.entries(speedUnits).map(([k,u])=><option key={k} value={k}>{u.name}</option>)}
          </select>
        </div>
        <div className="calc-results" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:16}}>
          {Object.entries(speedUnits).filter(([k])=>k!==speedFrom).map(([k,u])=>{
            const converted=ms/u.toMs;
            return(
              <div key={k} style={{...inS,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontFamily:B.font,fontSize:10,color:B.textDim,letterSpacing:1,textTransform:"uppercase"}}>{u.name}</span>
                <span style={{fontFamily:B.display,fontSize:18,fontWeight:800,color:B.text}}>{converted.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
        <div style={{background:B.inset+"80",border:`1px solid ${B.border}`,borderRadius:4,padding:"8px 10px",fontSize:10,color:B.textMid,lineHeight:1.5}}>
          <b style={{color:B.text}}>Quick ref:</b> TC max RPAS speed: 25 kn (46.3 km/h) in controlled airspace {"\u00B7"} Typical mapping flight: 8-15 m/s {"\u00B7"} Max wind for small RPAS: ~35 km/h
        </div>
      </div>

      {/* -- Temperature -- */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\uD83C\uDF21\uFE0F"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Temperature</h2>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
          <input value={tempC} onChange={e=>setTempC(e.target.value)} style={inp} type="number" step="any"/>
          <span style={{fontFamily:B.font,fontSize:12,color:B.textMid}}>{"\u00B0"}C</span>
          <span style={{fontFamily:B.font,fontSize:14,color:B.textDim}}>=</span>
          <div style={{...inS,padding:"6px 12px"}}>
            <span style={{fontFamily:B.display,fontSize:18,fontWeight:800,color:B.gold}}>{(tc*9/5+32).toFixed(1)}</span>
            <span style={{fontFamily:B.font,fontSize:12,color:B.textMid,marginLeft:4}}>{"\u00B0"}F</span>
          </div>
          <span style={{fontFamily:B.font,fontSize:14,color:B.textDim}}>=</span>
          <div style={{...inS,padding:"6px 12px"}}>
            <span style={{fontFamily:B.display,fontSize:18,fontWeight:800,color:B.sec}}>{(tc+273.15).toFixed(1)}</span>
            <span style={{fontFamily:B.font,fontSize:12,color:B.textMid,marginLeft:4}}>K</span>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(70px,1fr))",gap:3}}>
          {tempTable.map(t=>{
            const isClose=Math.abs(t.c-tc)<2.5;
            return(
              <div key={t.c} style={{...inS,padding:"6px 4px",textAlign:"center",borderColor:isClose?B.gold+"60":B.border}}>
                <div style={{fontFamily:B.display,fontSize:13,fontWeight:800,color:t.c<=0?"#60a5fa":t.c>=30?"#ef4444":B.text}}>{t.c}{"\u00B0"}</div>
                <div style={{fontFamily:B.font,fontSize:11,color:B.textDim}}>{t.f}{"\u00B0"}F</div>
              </div>
            );
          })}
        </div>
        <div style={{background:B.inset+"80",border:`1px solid ${B.border}`,borderRadius:4,padding:"8px 10px",marginTop:10,fontSize:10,color:B.textMid,lineHeight:1.5}}>
          <b style={{color:B.text}}>Field notes:</b> LiPo batteries degrade below 10{"\u00B0"}C {"\u00B7"} Most RPAS rated 0-40{"\u00B0"}C {"\u00B7"} Frost point affects scanner optics {"\u00B7"} -32.8{"\u00B0"}F = -36{"\u00B0"}C spray foam threshold
        </div>
      </div>

      {/* -- Survey Conversions -- */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\uD83D\uDCD0"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Survey Measures</h2>
        </div>
        <div style={{display:"grid",gap:3}}>
          {surveyPairs.map(x=>(
            <div key={x.l} style={{...inS,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:B.font,fontSize:11,fontWeight:700,color:B.text,minWidth:80}}>{x.l}</span>
              <span style={{fontFamily:B.font,fontSize:12,color:B.priBr,flex:1}}>{x.v}</span>
              <span style={{fontFamily:B.font,fontSize:10,color:B.textDim}}>{x.v2}</span>
            </div>
          ))}
        </div>
      </div>

      {/* -- Area Conversions -- */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\u2B1C"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Area Conversions</h2>
        </div>
        <div style={{display:"grid",gap:3}}>
          {areaPairs.map(x=>(
            <div key={x.l} style={{...inS,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:B.font,fontSize:11,fontWeight:700,color:B.text,minWidth:90}}>{x.l}</span>
              <span style={{fontFamily:B.font,fontSize:12,color:B.priBr,flex:1}}>{x.v}</span>
              <span style={{fontFamily:B.font,fontSize:10,color:B.textDim}}>{x.v2}</span>
            </div>
          ))}
        </div>
      </div>

      {/* -- Volume & Weight -- */}
      <div style={cardS}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:15}}>{"\u2696\uFE0F"}</span>
          <h2 style={{margin:0,fontSize:13,fontWeight:700,color:B.text}}>Volume & Weight</h2>
        </div>
        <div style={{display:"grid",gap:3}}>
          {[
            {l:"1 cubic yard",v:"0.7646 m\u00B3",v2:"27 cu ft"},
            {l:"1 cubic foot",v:"0.02832 m\u00B3",v2:"28.317 L"},
            {l:"1 US gallon",v:"3.7854 L",v2:"0.8327 imp gal"},
            {l:"1 imp gallon",v:"4.5461 L",v2:"1.201 US gal"},
            {l:"1 pound (lb)",v:"0.4536 kg",v2:"453.6 g"},
            {l:"1 short ton",v:"907.185 kg",v2:"2,000 lb"},
            {l:"1 metric tonne",v:"1,000 kg",v2:"2,204.6 lb"},
          ].map(x=>(
            <div key={x.l} style={{...inS,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:B.font,fontSize:11,fontWeight:700,color:B.text,minWidth:110}}>{x.l}</span>
              <span style={{fontFamily:B.font,fontSize:12,color:B.priBr,flex:1}}>{x.v}</span>
              <span style={{fontFamily:B.font,fontSize:10,color:B.textDim}}>{x.v2}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
