// ── GRS80 Ellipsoid (NAD83) & Projection Math ──
// NAD83(CSRS) uses the GRS80 ellipsoid. All projections reference this datum.
// Vertical datum: CGVD2013 (Canadian Geodetic Vertical Datum of 2013)

export const GRS80_A=6378137,GRS80_F=1/298.257222101,GRS80_E2=2*GRS80_F-GRS80_F*GRS80_F,GRS80_EP2=GRS80_E2/(1-GRS80_E2);

export function ddToDms(dd){const s=dd<0?-1:1,a=Math.abs(dd),d=Math.floor(a),mr=(a-d)*60,m=Math.floor(mr),sec=Math.round((mr-m)*6000)/100;return{d,m,s:sec>=60?0:sec,sign:s,mAdj:sec>=60?m+1:m};}
export function dmsToDd(d,m,s,sign){return sign*(Math.abs(d)+m/60+s/3600);}

export function getUtmZone(lon){return Math.max(1,Math.min(60,Math.floor((lon+180)/6)+1));}
export function utmCM(z){return z*6-183;}
export function getMtmZone(lon){return Math.max(1,Math.min(32,Math.round((-lon-50.5)/3)));}
export function mtmCM(z){return-(50.5+3*z);}

export function geoToTM(latD,lonD,cm,k0,fe,fn){
  const R=Math.PI/180,p=latD*R,l=(lonD-cm)*R,sp=Math.sin(p),cp=Math.cos(p),tp=Math.tan(p);
  const e2=GRS80_E2,ep2=GRS80_EP2,a=GRS80_A;
  const N=a/Math.sqrt(1-e2*sp*sp),T=tp*tp,C=ep2*cp*cp,A=cp*l;
  const M=a*((1-e2/4-3*e2*e2/64-5*e2*e2*e2/256)*p-(3*e2/8+3*e2*e2/32+45*e2*e2*e2/1024)*Math.sin(2*p)+(15*e2*e2/256+45*e2*e2*e2/1024)*Math.sin(4*p)-(35*e2*e2*e2/3072)*Math.sin(6*p));
  const A2=A*A,A3=A2*A,A4=A3*A,A5=A4*A,A6=A5*A;
  const easting=fe+k0*N*(A+(1-T+C)*A3/6+(5-18*T+T*T+72*C-58*ep2)*A5/120);
  const northing=fn+k0*(M+N*tp*(A2/2+(5-T+9*C+4*C*C)*A4/24+(61-58*T+T*T+600*C-330*ep2)*A6/720));
  return{easting,northing};
}

export function tmToGeo(easting,northing,cm,k0,fe,fn){
  const e2=GRS80_E2,ep2=GRS80_EP2,a=GRS80_A,R=Math.PI/180;
  const M1=(northing-fn)/k0;
  const mu=M1/(a*(1-e2/4-3*e2*e2/64-5*e2*e2*e2/256));
  const e1=(1-Math.sqrt(1-e2))/(1+Math.sqrt(1-e2));
  const p1=mu+(3*e1/2-27*e1*e1*e1/32)*Math.sin(2*mu)+(21*e1*e1/16-55*e1*e1*e1*e1/32)*Math.sin(4*mu)+(151*e1*e1*e1/96)*Math.sin(6*mu)+(1097*e1*e1*e1*e1/512)*Math.sin(8*mu);
  const sp=Math.sin(p1),cp=Math.cos(p1),tp=Math.tan(p1);
  const N1=a/Math.sqrt(1-e2*sp*sp),T1=tp*tp,C1=ep2*cp*cp,R1=a*(1-e2)/Math.pow(1-e2*sp*sp,1.5);
  const D=(easting-fe)/(N1*k0),D2=D*D,D3=D2*D,D4=D3*D,D5=D4*D,D6=D5*D;
  const lat=(p1-(N1*tp/R1)*(D2/2-(5+3*T1+10*C1-4*C1*C1-9*ep2)*D4/24+(61+90*T1+298*C1+45*T1*T1-252*ep2-3*C1*C1)*D6/720))/R;
  const lon=cm+(D-(1+2*T1+C1)*D3/6+(5-2*C1+28*T1-3*C1*C1+8*ep2+24*T1*T1)*D5/120)/cp/R;
  return{lat,lon};
}

export function geoToUtm(lat,lon){const z=getUtmZone(lon),h=lat>=0?"N":"S",fn=lat>=0?0:1e7;const r=geoToTM(lat,lon,utmCM(z),0.9996,500000,fn);return{zone:z,hemi:h,...r};}
export function geoToMtm(lat,lon){const z=getMtmZone(lon);const r=geoToTM(lat,lon,mtmCM(z),0.9999,304800,0);return{zone:z,...r};}

// NAD83 EPSG codes: UTM zones 7-22 (covering Canada) = EPSG:269xx (north)
export function utmEpsg(zone,hemi){return hemi==="N"?26900+zone:32700+zone;}
// NAD83(CSRS) UTM = EPSG:22xx (e.g., zone 10 = EPSG:2956..ish, but simpler: NAD83 = 269xx)
export function utmEpsgStr(zone,hemi){return`EPSG:${utmEpsg(zone,hemi)}`;}

export function gridScaleFactor(latD,lonD,cm,k0){
  const R=Math.PI/180,p=latD*R,dl=(lonD-cm)*R,cp=Math.cos(p),sp=Math.sin(p);
  const N=GRS80_A/Math.sqrt(1-GRS80_E2*sp*sp),T=Math.tan(p)*Math.tan(p),C=GRS80_EP2*cp*cp,A=cp*dl;
  const A2=A*A,A4=A2*A2;
  return k0*(1+(1+C)*A2/2+(5-4*T+42*C+13*C*C-28*GRS80_EP2)*A4/24);
}

export function elevFactor(latD,h){
  const R=Math.PI/180,sp=Math.sin(latD*R);
  const N=GRS80_A/Math.sqrt(1-GRS80_E2*sp*sp),M=GRS80_A*(1-GRS80_E2)/Math.pow(1-GRS80_E2*sp*sp,1.5);
  const Rm=Math.sqrt(M*N);
  return Rm/(Rm+h);
}
