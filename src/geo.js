// ── GRS80 Ellipsoid (NAD83) & Projection Math ──
// NAD83(CSRS) uses the GRS80 ellipsoid. All projections reference this datum.
// Vertical datum: CGVD2013 (Canadian Geodetic Vertical Datum of 2013)

export const GRS80_A=6378137,GRS80_F=1/298.257222101,GRS80_E2=2*GRS80_F-GRS80_F*GRS80_F,GRS80_EP2=GRS80_E2/(1-GRS80_E2);

export function ddToDms(dd){const s=dd<0?-1:1,a=Math.abs(dd),d=Math.floor(a),mr=(a-d)*60,m=Math.floor(mr),sec=Math.round((mr-m)*6000)/100;return{d,m,s:sec>=60?0:sec,sign:s,mAdj:sec>=60?m+1:m};}
export function dmsToDd(d,m,s,sign){return sign*(Math.abs(d)+m/60+s/3600);}

export function getUtmZone(lon){return Math.max(1,Math.min(60,Math.floor((lon+180)/6)+1));}
export function utmCM(z){return z*6-183;}
export function getMtmZone(lon){return Math.max(1,Math.min(17,Math.round((-lon-50.5)/3)));}
export function mtmCM(z){return-(50.5+3*z);}
export const MTM_WEST_LIMIT = -103.0; // Western boundary of MTM zone 17
export function isMtmApplicable(lon) { return lon >= MTM_WEST_LIMIT; }

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

export function vincentyInverse(lat1D, lon1D, lat2D, lon2D) {
  if (lat1D === lat2D && lon1D === lon2D) return { distance: 0, fwdAzimuth: 0, revAzimuth: 0, converged: true };
  const R = Math.PI / 180, a = GRS80_A, f = GRS80_F, b = a * (1 - f);
  const U1 = Math.atan((1 - f) * Math.tan(lat1D * R)), U2 = Math.atan((1 - f) * Math.tan(lat2D * R));
  const sU1 = Math.sin(U1), cU1 = Math.cos(U1), sU2 = Math.sin(U2), cU2 = Math.cos(U2);
  let lam = (lon2D - lon1D) * R, lamPrev, its = 0;
  let sAlpha, cos2a, cosS, sinS, sig, cos2sm;
  do {
    const sL = Math.sin(lam), cL = Math.cos(lam);
    sinS = Math.sqrt((cU2 * sL) ** 2 + (cU1 * sU2 - sU1 * cU2 * cL) ** 2);
    if (sinS === 0) return { distance: 0, fwdAzimuth: 0, revAzimuth: 0, converged: true };
    cosS = sU1 * sU2 + cU1 * cU2 * cL;
    sig = Math.atan2(sinS, cosS);
    sAlpha = cU1 * cU2 * sL / sinS;
    cos2a = 1 - sAlpha * sAlpha;
    cos2sm = cos2a !== 0 ? cosS - 2 * sU1 * sU2 / cos2a : 0;
    const C = f / 16 * cos2a * (4 + f * (4 - 3 * cos2a));
    lamPrev = lam;
    lam = (lon2D - lon1D) * R + (1 - C) * f * sAlpha * (sig + C * sinS * (cos2sm + C * cosS * (-1 + 2 * cos2sm * cos2sm)));
  } while (Math.abs(lam - lamPrev) > 1e-12 && ++its < 200);
  if (its >= 200) return { distance: NaN, fwdAzimuth: NaN, revAzimuth: NaN, converged: false };
  const uSq = cos2a * (a * a - b * b) / (b * b);
  const A2 = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B2 = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const dS = B2 * sinS * (cos2sm + B2 / 4 * (cosS * (-1 + 2 * cos2sm * cos2sm) - B2 / 6 * cos2sm * (-3 + 4 * sinS * sinS) * (-3 + 4 * cos2sm * cos2sm)));
  const dist = b * A2 * (sig - dS);
  let fwd = Math.atan2(cU2 * Math.sin(lam), cU1 * sU2 - sU1 * cU2 * Math.cos(lam)) / R;
  let rev = Math.atan2(cU1 * Math.sin(lam), -sU1 * cU2 + cU1 * sU2 * Math.cos(lam)) / R + 180;
  if (fwd < 0) fwd += 360;
  rev = ((rev % 360) + 360) % 360;
  return { distance: dist, fwdAzimuth: fwd, revAzimuth: rev, converged: true };
}

export function vincentyDirect(lat1D, lon1D, azD, dist) {
  if (dist === 0) return { lat: lat1D, lon: lon1D, revAzimuth: (azD + 180) % 360 };
  const R = Math.PI / 180, a = GRS80_A, f = GRS80_F, b = a * (1 - f);
  const az = azD * R, sAz = Math.sin(az), cAz = Math.cos(az);
  const U1 = Math.atan((1 - f) * Math.tan(lat1D * R)), sU1 = Math.sin(U1), cU1 = Math.cos(U1);
  const sig1 = Math.atan2(sU1, cU1 * cAz);
  const sAlpha = cU1 * sAz, cos2a = 1 - sAlpha * sAlpha;
  const uSq = cos2a * (a * a - b * b) / (b * b);
  const A2 = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B2 = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  let sig = dist / (b * A2), sigPrev;
  let cos2sm, sinS, cosS;
  do {
    cos2sm = Math.cos(2 * sig1 + sig);
    sinS = Math.sin(sig);
    cosS = Math.cos(sig);
    const dS = B2 * sinS * (cos2sm + B2 / 4 * (cosS * (-1 + 2 * cos2sm * cos2sm) - B2 / 6 * cos2sm * (-3 + 4 * sinS * sinS) * (-3 + 4 * cos2sm * cos2sm)));
    sigPrev = sig;
    sig = dist / (b * A2) + dS;
  } while (Math.abs(sig - sigPrev) > 1e-12);
  cos2sm = Math.cos(2 * sig1 + sig);
  sinS = Math.sin(sig);
  cosS = Math.cos(sig);
  const lat2 = Math.atan2(sU1 * cosS + cU1 * sinS * cAz, (1 - f) * Math.sqrt(sAlpha * sAlpha + (sU1 * sinS - cU1 * cosS * cAz) ** 2));
  const lam = Math.atan2(sinS * sAz, cU1 * cosS - sU1 * sinS * cAz);
  const C = f / 16 * cos2a * (4 + f * (4 - 3 * cos2a));
  const L = lam - (1 - C) * f * sAlpha * (sig + C * sinS * (cos2sm + C * cosS * (-1 + 2 * cos2sm * cos2sm)));
  let rev = Math.atan2(sAlpha, sU1 * sinS - cU1 * cosS * cAz) / R;
  if (rev < 0) rev += 360;
  return { lat: lat2 / R, lon: lon1D + L / R, revAzimuth: rev };
}

const AUTHALIC_R = 6371007.2;

export function geodesicArea(points) {
  const n = points.length;
  if (n < 3) return 0;
  const R = Math.PI / 180;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += (points[j].lon - points[i].lon) * R * (2 + Math.sin(points[i].lat * R) + Math.sin(points[j].lat * R));
  }
  return Math.abs(sum * AUTHALIC_R * AUTHALIC_R / 2);
}

export function geodesicPerimeter(points) {
  const n = points.length;
  if (n < 2) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const r = vincentyInverse(points[i].lat, points[i].lon, points[j].lat, points[j].lon);
    sum += r.distance;
  }
  return sum;
}

export function curveElements(params) {
  const { stationLength = 30 } = params;
  const D2R = Math.PI / 180;
  let R = params.R, delta = params.delta, T = params.T, L = params.L, C = params.C, E = params.E, M = params.M;

  if (R != null && delta != null) { /* both known */ }
  else if (R != null && T != null) { delta = 2 * Math.atan(T / R) / D2R; }
  else if (R != null && L != null) { delta = (L / R) / D2R; }
  else if (R != null && C != null) { delta = 2 * Math.asin(C / (2 * R)) / D2R; }
  else if (R != null && E != null) { delta = 2 * Math.acos(R / (R + E)) / D2R; }
  else if (R != null && M != null) { delta = 2 * Math.acos((R - M) / R) / D2R; }
  else if (delta != null && T != null) { R = T / Math.tan(delta * D2R / 2); }
  else if (delta != null && L != null) { R = L / (delta * D2R); }
  else if (delta != null && C != null) { R = C / (2 * Math.sin(delta * D2R / 2)); }
  else if (delta != null && E != null) { R = E / (1 / Math.cos(delta * D2R / 2) - 1); }
  else if (delta != null && M != null) { R = M / (1 - Math.cos(delta * D2R / 2)); }
  else if (T != null && E != null) { delta = 4 * Math.atan(E / T) / D2R; R = T / Math.tan(delta * D2R / 2); }
  else if (E != null && M != null) { delta = 2 * Math.acos(M / E) / D2R; R = M / (1 - Math.cos(delta * D2R / 2)); }
  else { return null; }

  const dRad = delta * D2R;
  T = R * Math.tan(dRad / 2);
  L = R * dRad;
  C = 2 * R * Math.sin(dRad / 2);
  E = R * (1 / Math.cos(dRad / 2) - 1);
  M = R * (1 - Math.cos(dRad / 2));
  const D_arc = 180 * stationLength / (Math.PI * R);
  const D_chord = 2 * Math.asin(stationLength / (2 * R)) / D2R;

  return { R, delta, T, L, C, E, M, D_arc, D_chord };
}
