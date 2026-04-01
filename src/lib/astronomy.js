import { DEFAULT_LAT, DEFAULT_LON } from '../data/constants.js';

// ── Sun Position ──
export function calcSun(date, lat=DEFAULT_LAT, lon=DEFAULT_LON) {
  const r=Math.PI/180, jd=Math.floor(365.25*(date.getUTCFullYear()+4716))+Math.floor(30.6001*((date.getUTCMonth()+1<3?date.getUTCMonth()+13:date.getUTCMonth()+1)))+date.getUTCDate()+(date.getUTCHours()+date.getUTCMinutes()/60)/24-1524.5;
  const T=(jd-2451545)/36525, L0=(280.46646+T*(36000.76983+.0003032*T))%360, M=(357.52911+T*(35999.05029-.0001537*T))*r;
  const C=(1.914602-T*.004817)*Math.sin(M)+.019993*Math.sin(2*M), sL=(L0+C)*r, ob=(23.439291-.0130042*T)*r;
  const dec=Math.asin(Math.sin(ob)*Math.sin(sL)), eq=(L0-(Math.atan2(Math.cos(ob)*Math.sin(sL),Math.cos(sL))/r))*4;
  const ha=((date.getUTCHours()*60+date.getUTCMinutes()+eq+lon*4)/4-180)*r;
  const alt=Math.asin(Math.sin(lat*r)*Math.sin(dec)+Math.cos(lat*r)*Math.cos(dec)*Math.cos(ha));
  const az=Math.atan2(-Math.sin(ha),Math.tan(dec)*Math.cos(lat*r)-Math.sin(lat*r)*Math.cos(ha));
  return {altitude:alt/r, azimuth:((az/r)+360)%360};
}

// ── Moon Phase ──
export function getMoon(date) {
  const y=date.getFullYear(), m=date.getMonth()+1, d=date.getDate();
  let c2,e; if(m<3){c2=y-1;e=m+12;}else{c2=y;e=m;}
  const jd=Math.floor(365.25*(c2+4716))+Math.floor(30.6001*(e+1))+d-1524.5;
  const ds=(jd-2451550.1)%29.530588853, ph=((ds<0?ds+29.530588853:ds)/29.530588853);
  const il=Math.round((1-Math.cos(ph*2*Math.PI))/2*100);
  let nm,ic;
  if(ph<.0625){nm="New Moon";ic="\u{1F311}";}else if(ph<.1875){nm="Waxing Crescent";ic="\u{1F312}";}
  else if(ph<.3125){nm="First Quarter";ic="\u{1F313}";}else if(ph<.4375){nm="Waxing Gibbous";ic="\u{1F314}";}
  else if(ph<.5625){nm="Full Moon";ic="\u{1F315}";}else if(ph<.6875){nm="Waning Gibbous";ic="\u{1F316}";}
  else if(ph<.8125){nm="Last Quarter";ic="\u{1F317}";}else if(ph<.9375){nm="Waning Crescent";ic="\u{1F318}";}
  else{nm="New Moon";ic="\u{1F311}";}
  return {phase:ph,illum:il,name:nm,icon:ic};
}

// ── WMM2025 Magnetic Declination (degree 3) ──
export function calcMagDec(lat, lon, altKm=0, date=new Date()) {
  const DEG=Math.PI/180, a=6371.2, NMAX=3;
  const colat=(90-lat)*DEG, lonR=lon*DEG;
  const ct=Math.cos(colat), st=Math.sin(colat);
  const yr=date.getFullYear()+(date.getMonth()+date.getDate()/30)/12, dt=yr-2025.0;
  const gc=[[0],[-29351.8+dt*12,-1410.8+dt*10.4],[-2556.6+dt*-12.2,2951.1+dt*-.8,1649.3+dt*1],[1361+dt*.3,-2404.1+dt*-6.1,1243.8+dt*2.4,453.4+dt*-11.2]];
  const hc=[[0],[0,4545.4+dt*-21.5],[0,-3133.6+dt*-28.8,-815.1+dt*-18.9],[0,-56.2+dt*7.3,222.3+dt*-3.2,-584.2+dt*7.4]];
  const P=Array.from({length:NMAX+1},()=>new Float64Array(NMAX+1));
  const dP=Array.from({length:NMAX+1},()=>new Float64Array(NMAX+1));
  P[0][0]=1; P[1][0]=ct; dP[1][0]=-st; P[1][1]=st; dP[1][1]=ct;
  for(let n=2;n<=NMAX;n++){
    const fn=Math.sqrt((2*n-1)/(2*n));
    P[n][n]=st*fn*P[n-1][n-1]; dP[n][n]=fn*(ct*P[n-1][n-1]+st*dP[n-1][n-1]);
    const fn2=Math.sqrt(2*n-1);
    P[n][n-1]=ct*fn2*P[n-1][n-1]; dP[n][n-1]=fn2*(-st*P[n-1][n-1]+ct*dP[n-1][n-1]);
    for(let m=0;m<=n-2;m++){const d2=n*n-m*m,An=(2*n-1)/Math.sqrt(d2),Bn=Math.sqrt((n-1)*(n-1)-m*m)/Math.sqrt(d2);
      P[n][m]=An*ct*P[n-1][m]-Bn*P[n-2][m]; dP[n][m]=An*(-st*P[n-1][m]+ct*dP[n-1][m])-Bn*dP[n-2][m];}
  }
  let X=0,Y=0,Z=0;
  for(let n=1;n<=NMAX;n++){const rr=Math.pow(a/(a+altKm),n+2);for(let m=0;m<=n;m++){
    const cm=Math.cos(m*lonR),sm=Math.sin(m*lonR),g=gc[n][m]||0,h=hc[n][m]||0;
    X+=rr*(g*cm+h*sm)*dP[n][m]; Y+=rr*m*(g*sm-h*cm)*P[n][m]/(st||1e-10); Z+=-(n+1)*rr*(g*cm+h*sm)*P[n][m];
  }}
  return {declination:Math.atan2(Y,X)/DEG, inclination:Math.atan2(Z,Math.sqrt(X*X+Y*Y))/DEG, totalField:Math.sqrt(X*X+Y*Y+Z*Z)};
}

export function xrayClass(flux) {
  if (!flux || flux <= 0) return { cls: "--", color: "#4a5a80" };
  const log = Math.log10(flux);
  if (log >= -4) return { cls: "X" + (flux/1e-4).toFixed(1), color: "#dc2626" };
  if (log >= -5) return { cls: "M" + (flux/1e-5).toFixed(1), color: "#ef4444" };
  if (log >= -6) return { cls: "C" + (flux/1e-6).toFixed(1), color: "#eab308" };
  if (log >= -7) return { cls: "B" + (flux/1e-7).toFixed(1), color: "#22c55e" };
  return { cls: "A" + (flux/1e-8).toFixed(1), color: "#22c55e" };
}
