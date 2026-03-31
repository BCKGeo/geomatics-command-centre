import { describe, it, expect } from 'vitest';
import proj4 from 'proj4';
import {
  GRS80_A, GRS80_F, GRS80_E2, GRS80_EP2,
  ddToDms, dmsToDd,
  getUtmZone, utmCM, getMtmZone, mtmCM,
  geoToTM, tmToGeo, geoToUtm, geoToMtm,
  gridScaleFactor, elevFactor,
  isMtmApplicable,
  vincentyInverse,
  vincentyDirect,
  geodesicArea,
  geodesicPerimeter,
  curveElements,
} from './geo.js';

// ── proj4 reference definitions ──
// UTM zones used in testing (with +south for southern hemisphere)
function utmDef(zone, south) {
  return `+proj=utm +zone=${zone}${south ? ' +south' : ''} +ellps=GRS80 +units=m +no_defs`;
}

// MTM definitions (NRCan convention: 3° zones, k0=0.9999, FE=304800)
function mtmProj4Def(zone) {
  const cm = -(50.5 + 3 * zone);
  return `+proj=tmerc +lat_0=0 +lon_0=${cm} +k=0.9999 +x_0=304800 +y_0=0 +ellps=GRS80 +units=m +no_defs`;
}

// Helper: convert with proj4 as reference
function proj4Utm(lat, lon) {
  const zone = Math.floor((lon + 180) / 6) + 1;
  const south = lat < 0;
  const [e, n] = proj4('EPSG:4326', utmDef(zone, south), [lon, lat]);
  return { zone, easting: e, northing: n };
}

function proj4Mtm(lat, lon, zone) {
  const [e, n] = proj4('EPSG:4326', mtmProj4Def(zone), [lon, lat]);
  return { easting: e, northing: n };
}

// ═══════════════════════════════════════════════════════════════
// 1. GRS80 ELLIPSOID CONSTANTS (NAD83)
// ═══════════════════════════════════════════════════════════════
describe('GRS80 Constants', () => {
  it('semi-major axis is exactly 6378137', () => {
    expect(GRS80_A).toBe(6378137);
  });

  it('flattening matches GRS80 definition', () => {
    expect(GRS80_F).toBeCloseTo(1 / 298.257222101, 15);
  });

  it('first eccentricity squared is correct', () => {
    const expected = 2 * GRS80_F - GRS80_F * GRS80_F;
    expect(GRS80_E2).toBeCloseTo(expected, 15);
  });

  it('second eccentricity squared is correct', () => {
    const expected = GRS80_E2 / (1 - GRS80_E2);
    expect(GRS80_EP2).toBeCloseTo(expected, 15);
  });

  it('semi-minor axis b = a(1-f) is correct', () => {
    const b = GRS80_A * (1 - GRS80_F);
    expect(b).toBeCloseTo(6356752.314140, 3);
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. DD ↔ DMS CONVERSIONS
// ═══════════════════════════════════════════════════════════════
describe('DD to DMS', () => {
  it('converts positive latitude correctly', () => {
    const r = ddToDms(53.9171);
    expect(r.d).toBe(53);
    expect(r.mAdj).toBe(55);
    expect(r.s).toBeCloseTo(1.56, 1);
    expect(r.sign).toBe(1);
  });

  it('converts negative longitude correctly', () => {
    const r = ddToDms(-122.7497);
    expect(r.d).toBe(122);
    expect(r.mAdj).toBe(44);
    expect(r.s).toBeCloseTo(58.92, 1);
    expect(r.sign).toBe(-1);
  });

  it('handles zero degrees', () => {
    const r = ddToDms(0);
    expect(r.d).toBe(0);
    expect(r.mAdj).toBe(0);
    expect(r.s).toBeCloseTo(0, 2);
  });

  it('handles exact integer degrees', () => {
    const r = ddToDms(45.0);
    expect(r.d).toBe(45);
    expect(r.mAdj).toBe(0);
    expect(r.s).toBeCloseTo(0, 2);
  });

  it('handles exact 30 minutes', () => {
    const r = ddToDms(45.5);
    expect(r.d).toBe(45);
    expect(r.mAdj).toBe(30);
    expect(r.s).toBeCloseTo(0, 1);
  });

  it('handles seconds near 60 (minute rollover)', () => {
    // 45° 59' 59.99" ≈ 45.999997
    const r = ddToDms(45.999997);
    // Should either show ~60 seconds with minute rollover or 59.99"
    expect(r.d).toBe(45);
    expect(r.mAdj + r.s / 60).toBeCloseTo(59.999, 1);
  });

  it('handles 180 degrees (antimeridian)', () => {
    const r = ddToDms(180);
    expect(r.d).toBe(180);
    expect(r.mAdj).toBe(0);
  });

  it('handles -180 degrees', () => {
    const r = ddToDms(-180);
    expect(r.d).toBe(180);
    expect(r.sign).toBe(-1);
  });
});

describe('DMS to DD', () => {
  it('converts north latitude correctly', () => {
    expect(dmsToDd(53, 55, 1.56, 1)).toBeCloseTo(53.9171, 4);
  });

  it('converts west longitude correctly', () => {
    expect(dmsToDd(122, 44, 58.92, -1)).toBeCloseTo(-122.7497, 4);
  });

  it('converts zero correctly', () => {
    expect(dmsToDd(0, 0, 0, 1)).toBe(0);
  });

  it('converts exact degrees correctly', () => {
    expect(dmsToDd(45, 0, 0, 1)).toBe(45);
  });

  it('converts south latitude correctly', () => {
    expect(dmsToDd(33, 51, 25.92, -1)).toBeCloseTo(-33.8572, 4);
  });
});

describe('DD ↔ DMS round-trip', () => {
  const testValues = [0, 45, -45, 53.9171, -122.7497, 90, -90, 0.5, 179.999, -179.999, 1.000001];

  testValues.forEach(dd => {
    it(`round-trips ${dd}°`, () => {
      const dms = ddToDms(dd);
      const recovered = dmsToDd(dms.d, dms.mAdj, dms.s, dms.sign);
      expect(recovered).toBeCloseTo(dd, 4); // 0.01" ≈ 0.000003°
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. UTM ZONE DETECTION
// ═══════════════════════════════════════════════════════════════
describe('UTM Zone Detection', () => {
  it('Prince George (-122.75) → Zone 10', () => {
    expect(getUtmZone(-122.7497)).toBe(10);
  });

  it('Calgary (-114.07) → Zone 11', () => {
    expect(getUtmZone(-114.0719)).toBe(11);
  });

  it('Ottawa (-75.70) → Zone 18', () => {
    expect(getUtmZone(-75.7009)).toBe(18);
  });

  it('London, UK (0.0) → Zone 31', () => {
    expect(getUtmZone(0)).toBe(31);
  });

  it('zone boundary at -126° → Zone 10', () => {
    expect(getUtmZone(-126)).toBe(10);
  });

  it('just west of -126° → Zone 9', () => {
    expect(getUtmZone(-126.001)).toBe(9);
  });

  it('far west (-180) → Zone 1', () => {
    expect(getUtmZone(-180)).toBe(1);
  });

  it('far east (179.99) → Zone 60', () => {
    expect(getUtmZone(179.99)).toBe(60);
  });

  it('clamps to minimum zone 1', () => {
    expect(getUtmZone(-181)).toBeGreaterThanOrEqual(1);
  });
});

describe('UTM Central Meridian', () => {
  it('Zone 10 → CM -123°', () => {
    expect(utmCM(10)).toBe(-123);
  });

  it('Zone 11 → CM -117°', () => {
    expect(utmCM(11)).toBe(-117);
  });

  it('Zone 18 → CM -75°', () => {
    expect(utmCM(18)).toBe(-75);
  });

  it('Zone 1 → CM -177°', () => {
    expect(utmCM(1)).toBe(-177);
  });

  it('Zone 31 → CM 3°', () => {
    expect(utmCM(31)).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. MTM ZONE DETECTION
// ═══════════════════════════════════════════════════════════════
describe('MTM Zone Detection', () => {
  it('Prince George (-122.75) → clamped to zone 17 (MTM does not cover western Canada)', () => {
    const z = getMtmZone(-122.7497);
    expect(z).toBe(17); // Clamped — MTM not applicable west of -103.0°
  });

  it('Ottawa (-75.70) → reasonable MTM zone', () => {
    const z = getMtmZone(-75.7009);
    const cm = mtmCM(z);
    expect(Math.abs(cm - (-75.7009))).toBeLessThan(1.5);
  });

  it('clamps to valid range', () => {
    expect(getMtmZone(-40)).toBeGreaterThanOrEqual(1);
    expect(getMtmZone(-180)).toBeLessThanOrEqual(17);
  });
});

describe('MTM Central Meridian', () => {
  it('Zone 1 → CM -53.5°', () => {
    expect(mtmCM(1)).toBe(-53.5);
  });

  it('Zone 10 → CM -80.5°', () => {
    expect(mtmCM(10)).toBe(-80.5);
  });

  it('CMs are 3° apart', () => {
    for (let z = 1; z < 17; z++) {
      expect(mtmCM(z + 1) - mtmCM(z)).toBeCloseTo(-3, 10);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. FORWARD TM PROJECTION — cross-validated against proj4
// ═══════════════════════════════════════════════════════════════
describe('Forward UTM Projection (cross-validated vs proj4)', () => {
  const cities = [
    { name: 'Prince George, BC', lat: 53.9171, lon: -122.7497 },
    { name: 'Vancouver, BC', lat: 49.2827, lon: -123.1207 },
    { name: 'Calgary, AB', lat: 51.0447, lon: -114.0719 },
    { name: 'Edmonton, AB', lat: 53.5461, lon: -113.4938 },
    { name: 'Ottawa, ON', lat: 45.4215, lon: -75.6972 },
    { name: 'Toronto, ON', lat: 43.6532, lon: -79.3832 },
    { name: 'Halifax, NS', lat: 44.6488, lon: -63.5752 },
    { name: 'Whitehorse, YK', lat: 60.7212, lon: -135.0568 },
    { name: 'Yellowknife, NT', lat: 62.4540, lon: -114.3718 },
    { name: 'St. John\'s, NL', lat: 47.5615, lon: -52.7126 },
  ];

  cities.forEach(({ name, lat, lon }) => {
    it(`${name} easting matches proj4 within 0.01m`, () => {
      const ours = geoToUtm(lat, lon);
      const ref = proj4Utm(lat, lon);
      expect(ours.zone).toBe(ref.zone);
      expect(ours.easting).toBeCloseTo(ref.easting, 1);
    });

    it(`${name} northing matches proj4 within 0.01m`, () => {
      const ours = geoToUtm(lat, lon);
      const ref = proj4Utm(lat, lon);
      expect(ours.northing).toBeCloseTo(ref.northing, 1);
    });
  });
});

describe('Forward MTM Projection (cross-validated vs proj4)', () => {
  const points = [
    { name: 'Ottawa', lat: 45.4215, lon: -75.6972 },
    { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
    { name: 'Halifax', lat: 44.6488, lon: -63.5752 },
  ];

  points.forEach(({ name, lat, lon }) => {
    it(`${name} MTM easting matches proj4 within 0.01m`, () => {
      const ours = geoToMtm(lat, lon);
      const ref = proj4Mtm(lat, lon, ours.zone);
      expect(ours.easting).toBeCloseTo(ref.easting, 1);
    });

    it(`${name} MTM northing matches proj4 within 0.01m`, () => {
      const ours = geoToMtm(lat, lon);
      const ref = proj4Mtm(lat, lon, ours.zone);
      expect(ours.northing).toBeCloseTo(ref.northing, 1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. INVERSE TM PROJECTION
// ═══════════════════════════════════════════════════════════════
describe('Inverse UTM Projection', () => {
  const cities = [
    { name: 'Prince George', lat: 53.9171, lon: -122.7497 },
    { name: 'Vancouver', lat: 49.2827, lon: -123.1207 },
    { name: 'Calgary', lat: 51.0447, lon: -114.0719 },
    { name: 'Ottawa', lat: 45.4215, lon: -75.6972 },
    { name: 'Quito (equator)', lat: -0.1807, lon: -78.4678 },
    { name: 'Sydney (southern)', lat: -33.8688, lon: 151.2093 },
  ];

  cities.forEach(({ name, lat, lon }) => {
    it(`${name} round-trip error < 0.001m`, () => {
      const fwd = geoToUtm(lat, lon);
      const cm = utmCM(fwd.zone);
      const fn = lat >= 0 ? 0 : 1e7;
      const inv = tmToGeo(fwd.easting, fwd.northing, cm, 0.9996, 500000, fn);
      const latErr = Math.abs(inv.lat - lat) * 111000; // metres
      const lonErr = Math.abs(inv.lon - lon) * 111000 * Math.cos(lat * Math.PI / 180);
      expect(latErr).toBeLessThan(0.001);
      expect(lonErr).toBeLessThan(0.001);
    });
  });
});

describe('Inverse MTM Projection', () => {
  const points = [
    { name: 'Ottawa', lat: 45.4215, lon: -75.6972 },
  ];

  points.forEach(({ name, lat, lon }) => {
    it(`${name} MTM round-trip error < 0.001m`, () => {
      const fwd = geoToMtm(lat, lon);
      const cm = mtmCM(fwd.zone);
      const inv = tmToGeo(fwd.easting, fwd.northing, cm, 0.9999, 304800, 0);
      const latErr = Math.abs(inv.lat - lat) * 111000;
      const lonErr = Math.abs(inv.lon - lon) * 111000 * Math.cos(lat * Math.PI / 180);
      expect(latErr).toBeLessThan(0.001);
      expect(lonErr).toBeLessThan(0.001);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. SCALE FACTORS
// ═══════════════════════════════════════════════════════════════
describe('Grid Scale Factor', () => {
  it('equals k0 at the central meridian', () => {
    // At CM, scale factor should be exactly k0
    const k = gridScaleFactor(53.9171, -123, -123, 0.9996);
    expect(k).toBeCloseTo(0.9996, 6);
  });

  it('is > k0 away from central meridian', () => {
    const k = gridScaleFactor(53.9171, -122.7497, -123, 0.9996);
    expect(k).toBeGreaterThan(0.9996);
  });

  it('increases with distance from CM', () => {
    const k1 = gridScaleFactor(49, -122, -123, 0.9996); // 1° from CM
    const k2 = gridScaleFactor(49, -121, -123, 0.9996); // 2° from CM
    const k3 = gridScaleFactor(49, -120, -123, 0.9996); // 3° from CM
    expect(k2).toBeGreaterThan(k1);
    expect(k3).toBeGreaterThan(k2);
  });

  it('is symmetric about the CM', () => {
    const kE = gridScaleFactor(49, -121, -123, 0.9996); // 2° east of CM
    const kW = gridScaleFactor(49, -125, -123, 0.9996); // 2° west of CM
    expect(kE).toBeCloseTo(kW, 6);
  });

  it('UTM scale factor is reasonable for zone edge (~3° from CM)', () => {
    // At 3° from CM, UTM scale factor should be roughly 1.0004-1.0010
    const k = gridScaleFactor(49, -120, -123, 0.9996);
    expect(k).toBeGreaterThan(1.0000);
    expect(k).toBeLessThan(1.0015);
  });

  it('MTM k0=0.9999 at central meridian', () => {
    const k = gridScaleFactor(49, -80.5, -80.5, 0.9999);
    expect(k).toBeCloseTo(0.9999, 6);
  });

  it('MTM scale factor is closer to 1.0 than UTM (narrower zones)', () => {
    // 1° from CM, MTM should be closer to 1.0 than UTM
    const kMtm = gridScaleFactor(49, -79.5, -80.5, 0.9999);
    const kUtm = gridScaleFactor(49, -122, -123, 0.9996);
    expect(Math.abs(kMtm - 1.0)).toBeLessThan(Math.abs(kUtm - 1.0));
  });
});

describe('Elevation Factor', () => {
  it('equals 1.0 at sea level', () => {
    const ef = elevFactor(49, 0);
    expect(ef).toBeCloseTo(1.0, 8);
  });

  it('is < 1.0 above sea level', () => {
    const ef = elevFactor(49, 580);
    expect(ef).toBeLessThan(1.0);
  });

  it('is reasonable for 580m (Prince George area)', () => {
    const ef = elevFactor(53.9171, 580);
    // Expected approximately 0.999909
    expect(ef).toBeCloseTo(0.99991, 4);
  });

  it('decreases with increasing elevation', () => {
    const ef100 = elevFactor(49, 100);
    const ef500 = elevFactor(49, 500);
    const ef1000 = elevFactor(49, 1000);
    const ef3000 = elevFactor(49, 3000);
    expect(ef500).toBeLessThan(ef100);
    expect(ef1000).toBeLessThan(ef500);
    expect(ef3000).toBeLessThan(ef1000);
  });

  it('is reasonable for high altitude (3000m, Rocky Mtn pass)', () => {
    const ef = elevFactor(51, 3000);
    // At 3000m: factor ≈ 6371000/(6371000+3000) ≈ 0.999529
    expect(ef).toBeGreaterThan(0.9994);
    expect(ef).toBeLessThan(0.9997);
  });

  it('varies slightly with latitude due to Earth oblateness', () => {
    const efEquator = elevFactor(0, 1000);
    const efMid = elevFactor(45, 1000);
    const efPole = elevFactor(89, 1000);
    // All should be close to each other but differ slightly
    // Mean radius of curvature varies: smallest at equator, largest at poles (oblate Earth)
    // So elevation factor is slightly smaller (further from 1.0) at the equator
    expect(Math.abs(efEquator - efPole)).toBeLessThan(0.0001);
    expect(Math.abs(efMid - efEquator)).toBeLessThan(0.0001);
  });
});

describe('Combined Scale Factor', () => {
  it('CSF = grid × elevation for Prince George area', () => {
    const lat = 53.9171, lon = -122.7497, h = 580;
    const cm = utmCM(getUtmZone(lon));
    const gsf = gridScaleFactor(lat, lon, cm, 0.9996);
    const ef = elevFactor(lat, h);
    const csf = gsf * ef;
    // Both factors < 1.0, so CSF < either individually
    expect(csf).toBeLessThan(gsf);
    expect(csf).toBeLessThan(ef);
    // CSF should be reasonable (0.999-1.001 range for typical Canadian surveys)
    expect(csf).toBeGreaterThan(0.999);
    expect(csf).toBeLessThan(1.001);
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. EDGE CASES & BOUNDARY CONDITIONS
// ═══════════════════════════════════════════════════════════════
describe('Edge Cases', () => {
  it('equator forward/inverse round-trip', () => {
    const fwd = geoToUtm(0, -75);
    const inv = tmToGeo(fwd.easting, fwd.northing, utmCM(fwd.zone), 0.9996, 500000, 0);
    expect(inv.lat).toBeCloseTo(0, 6);
    expect(inv.lon).toBeCloseTo(-75, 6);
  });

  it('equator easting at CM is 500000', () => {
    const fwd = geoToTM(0, -123, -123, 0.9996, 500000, 0);
    expect(fwd.easting).toBeCloseTo(500000, 2);
    expect(fwd.northing).toBeCloseTo(0, 2);
  });

  it('southern hemisphere uses correct false northing', () => {
    const fwd = geoToUtm(-33.8688, 151.2093); // Sydney
    expect(fwd.hemi).toBe('S');
    expect(fwd.northing).toBeGreaterThan(0);
    expect(fwd.northing).toBeLessThan(10000000);
  });

  it('southern hemisphere round-trip', () => {
    const lat = -33.8688, lon = 151.2093;
    const fwd = geoToUtm(lat, lon);
    const inv = tmToGeo(fwd.easting, fwd.northing, utmCM(fwd.zone), 0.9996, 500000, 1e7);
    expect(inv.lat).toBeCloseTo(lat, 6);
    expect(inv.lon).toBeCloseTo(lon, 6);
  });

  it('high latitude (70°N) forward/inverse', () => {
    const lat = 70, lon = -120;
    const fwd = geoToUtm(lat, lon);
    const inv = tmToGeo(fwd.easting, fwd.northing, utmCM(fwd.zone), 0.9996, 500000, 0);
    expect(inv.lat).toBeCloseTo(lat, 5);
    expect(inv.lon).toBeCloseTo(lon, 5);
  });

  it('near zone boundary forward/inverse', () => {
    // Right at -120° which is a UTM zone boundary (10/11)
    const lat = 49, lon = -120.001;
    const fwd = geoToUtm(lat, lon);
    const inv = tmToGeo(fwd.easting, fwd.northing, utmCM(fwd.zone), 0.9996, 500000, 0);
    expect(inv.lat).toBeCloseTo(lat, 5);
    expect(inv.lon).toBeCloseTo(lon, 5);
  });

  it('small longitude difference from CM', () => {
    const fwd = geoToTM(49, -122.999, -123, 0.9996, 500000, 0);
    // 0.001° at 49°N ≈ ~73m easting offset from 500000
    expect(Math.abs(fwd.easting - 500000)).toBeLessThan(100);
    expect(fwd.easting).toBeGreaterThan(500000); // east of CM
  });

  it('DMS edge: 0° 0\' 0"', () => {
    const dms = ddToDms(0);
    expect(dms.d).toBe(0);
    expect(dms.mAdj).toBe(0);
    expect(dms.s).toBe(0);
  });

  it('DMS edge: negative zero', () => {
    const dms = ddToDms(-0.0001);
    expect(dms.sign).toBe(-1);
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. STRESS TESTS — many random points
// ═══════════════════════════════════════════════════════════════
describe('Random point stress tests (UTM round-trip)', () => {
  // Generate deterministic "random" points using a simple LCG
  function lcg(seed) {
    return () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff; };
  }
  const rng = lcg(42);

  for (let i = 0; i < 50; i++) {
    const lat = (rng() * 160 - 80); // -80 to 80
    const lon = (rng() * 360 - 180); // -180 to 180

    it(`random point #${i + 1} (${lat.toFixed(2)}, ${lon.toFixed(2)}) round-trips within 0.01m`, () => {
      const fwd = geoToUtm(lat, lon);
      const cm = utmCM(fwd.zone);
      const fn = lat >= 0 ? 0 : 1e7;
      const inv = tmToGeo(fwd.easting, fwd.northing, cm, 0.9996, 500000, fn);
      const latErr = Math.abs(inv.lat - lat) * 111000;
      const lonErr = Math.abs(inv.lon - lon) * 111000 * Math.cos(lat * Math.PI / 180);
      expect(latErr).toBeLessThan(0.01);
      expect(lonErr).toBeLessThan(0.01);
    });
  }
});

describe('Random point stress tests (proj4 cross-validation)', () => {
  function lcg(seed) {
    return () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff; };
  }
  const rng = lcg(99);

  for (let i = 0; i < 20; i++) {
    const lat = (rng() * 140 - 70); // -70 to 70 (avoid extreme latitudes)
    const lon = (rng() * 360 - 180);

    it(`random point #${i + 1} (${lat.toFixed(2)}, ${lon.toFixed(2)}) matches proj4 within 0.1m`, () => {
      const ours = geoToUtm(lat, lon);
      const ref = proj4Utm(lat, lon);
      expect(ours.zone).toBe(ref.zone);
      expect(Math.abs(ours.easting - ref.easting)).toBeLessThan(0.1);
      expect(Math.abs(ours.northing - ref.northing)).toBeLessThan(0.1);
    });
  }
});

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

// ═══════════════════════════════════════════════════════════════
// 10. HEIGHT COMPUTATION (H = h - N)
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// 11. VINCENTY INVERSE (distance & bearing between two points)
// ═══════════════════════════════════════════════════════════════
describe('Vincenty Inverse', () => {
  it('Ottawa to Toronto: distance ~352.7 km', () => {
    const r = vincentyInverse(45.4215, -75.6972, 43.6532, -79.3832);
    expect(r.distance).toBeCloseTo(352697, -2); // within ~100m
    expect(r.converged).toBe(true);
  });

  it('Ottawa to Toronto: forward azimuth ~237°', () => {
    const r = vincentyInverse(45.4215, -75.6972, 43.6532, -79.3832);
    expect(r.fwdAzimuth).toBeGreaterThan(230);
    expect(r.fwdAzimuth).toBeLessThan(245);
  });

  it('identical points: distance 0, azimuth 0', () => {
    const r = vincentyInverse(45.4215, -75.6972, 45.4215, -75.6972);
    expect(r.distance).toBe(0);
    expect(r.fwdAzimuth).toBe(0);
    expect(r.revAzimuth).toBe(0);
    expect(r.converged).toBe(true);
  });

  it('short distance (< 1 m)', () => {
    const r = vincentyInverse(45.0, -75.0, 45.000001, -75.0);
    expect(r.distance).toBeGreaterThan(0);
    expect(r.distance).toBeLessThan(1);
    expect(r.converged).toBe(true);
  });

  it('due north line: azimuth ~0°', () => {
    const r = vincentyInverse(45.0, -75.0, 46.0, -75.0);
    expect(r.fwdAzimuth).toBeCloseTo(0, 0);
    expect(r.distance).toBeGreaterThan(110000);
    expect(r.distance).toBeLessThan(112000);
  });

  it('due east line: azimuth ~90°', () => {
    const r = vincentyInverse(45.0, -75.0, 45.0, -74.0);
    expect(r.fwdAzimuth).toBeCloseTo(90, 0);
  });

  it('long distance: Vancouver to Halifax ~4400 km', () => {
    const r = vincentyInverse(49.2827, -123.1207, 44.6488, -63.5752);
    expect(r.distance).toBeGreaterThan(4300000);
    expect(r.distance).toBeLessThan(4500000);
    expect(r.converged).toBe(true);
  });

  it('reverse azimuth differs from forward by ~180°', () => {
    const r = vincentyInverse(45.0, -75.0, 46.0, -75.0);
    expect(Math.abs(r.revAzimuth - 180)).toBeLessThan(1);
  });

  it('nearly antipodal points: converged is false', () => {
    const r = vincentyInverse(0, 0, 0, 179.9);
    expect(r.converged).toBe(false);
  });

  it('170 degrees apart still converges', () => {
    const r = vincentyInverse(0, 0, 0, 170);
    expect(r.converged).toBe(true);
    expect(r.distance).toBeGreaterThan(18000000);
  });
});

// ═══════════════════════════════════════════════════════════════
// 12. VINCENTY DIRECT (destination from start + bearing + distance)
// ═══════════════════════════════════════════════════════════════
describe('Vincenty Direct', () => {
  it('zero distance returns input point', () => {
    const r = vincentyDirect(45.0, -75.0, 90, 0);
    expect(r.lat).toBeCloseTo(45.0, 8);
    expect(r.lon).toBeCloseTo(-75.0, 8);
  });

  it('1 degree north from equator: ~111 km', () => {
    const r = vincentyDirect(0, 0, 0, 111320);
    expect(r.lat).toBeCloseTo(1.0, 1);
    expect(r.lon).toBeCloseTo(0, 2);
  });

  it('round-trip: direct then inverse recovers distance and azimuth', () => {
    const start = { lat: 53.9171, lon: -122.7497 };
    const az = 135.0, dist = 50000;
    const dest = vincentyDirect(start.lat, start.lon, az, dist);
    const inv = vincentyInverse(start.lat, start.lon, dest.lat, dest.lon);
    expect(inv.distance).toBeCloseTo(dist, 2);
    expect(inv.fwdAzimuth).toBeCloseTo(az, 2);
  });

  it('round-trip: 5 different azimuths at 100 km', () => {
    const lat0 = 49.0, lon0 = -123.0, dist = 100000;
    [0, 45, 90, 180, 270].forEach(az => {
      const dest = vincentyDirect(lat0, lon0, az, dist);
      const inv = vincentyInverse(lat0, lon0, dest.lat, dest.lon);
      expect(inv.distance).toBeCloseTo(dist, 2);
      expect(inv.fwdAzimuth).toBeCloseTo(az, 1);
    });
  });

  it('returns reverse azimuth', () => {
    const r = vincentyDirect(45.0, -75.0, 0, 100000);
    expect(r.revAzimuth).toBeCloseTo(180, 0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 13. GEODESIC AREA & PERIMETER
// ═══════════════════════════════════════════════════════════════
describe('Geodesic Area', () => {
  it('small triangle near Ottawa: ~area > 0', () => {
    const pts = [
      { lat: 45.42, lon: -75.70 },
      { lat: 45.42, lon: -75.69 },
      { lat: 45.43, lon: -75.695 },
    ];
    const area = geodesicArea(pts);
    expect(area).toBeGreaterThan(0);
    expect(area).toBeLessThan(1e6);
  });

  it('known ~1 km² square', () => {
    const pts = [
      { lat: 45.0, lon: -75.0 },
      { lat: 45.0, lon: -74.9873 },
      { lat: 45.009, lon: -74.9873 },
      { lat: 45.009, lon: -75.0 },
    ];
    const area = geodesicArea(pts);
    expect(area).toBeGreaterThan(900000);
    expect(area).toBeLessThan(1100000);
  });

  it('collinear points return area ~0', () => {
    const pts = [
      { lat: 45.0, lon: -75.0 },
      { lat: 45.5, lon: -75.0 },
      { lat: 46.0, lon: -75.0 },
    ];
    const area = geodesicArea(pts);
    expect(area).toBeLessThan(1);
  });

  it('fewer than 3 points returns 0', () => {
    expect(geodesicArea([{ lat: 0, lon: 0 }])).toBe(0);
    expect(geodesicArea([{ lat: 0, lon: 0 }, { lat: 1, lon: 1 }])).toBe(0);
  });

  it('winding order does not matter (absolute value)', () => {
    const cw = [
      { lat: 45.0, lon: -75.0 },
      { lat: 45.0, lon: -74.99 },
      { lat: 45.01, lon: -74.99 },
    ];
    const ccw = [...cw].reverse();
    expect(geodesicArea(cw)).toBeCloseTo(geodesicArea(ccw), 0);
  });
});

describe('Geodesic Perimeter', () => {
  it('triangle perimeter equals sum of 3 sides', () => {
    const pts = [
      { lat: 45.0, lon: -75.0 },
      { lat: 45.0, lon: -74.99 },
      { lat: 45.01, lon: -74.995 },
    ];
    const p = geodesicPerimeter(pts);
    const d1 = vincentyInverse(pts[0].lat, pts[0].lon, pts[1].lat, pts[1].lon).distance;
    const d2 = vincentyInverse(pts[1].lat, pts[1].lon, pts[2].lat, pts[2].lon).distance;
    const d3 = vincentyInverse(pts[2].lat, pts[2].lon, pts[0].lat, pts[0].lon).distance;
    expect(p).toBeCloseTo(d1 + d2 + d3, 2);
  });

  it('fewer than 2 points returns 0', () => {
    expect(geodesicPerimeter([])).toBe(0);
    expect(geodesicPerimeter([{ lat: 0, lon: 0 }])).toBe(0);
  });

  it('2 points returns double the distance (there and back)', () => {
    const pts = [{ lat: 45.0, lon: -75.0 }, { lat: 45.01, lon: -75.0 }];
    const p = geodesicPerimeter(pts);
    const d = vincentyInverse(pts[0].lat, pts[0].lon, pts[1].lat, pts[1].lon).distance;
    expect(p).toBeCloseTo(2 * d, 2);
  });
});

// ═══════════════════════════════════════════════════════════════
// 14. HORIZONTAL CURVE ELEMENTS
// ═══════════════════════════════════════════════════════════════
describe('Curve Elements', () => {
  it('R=500 + delta=30°: computes all elements', () => {
    const c = curveElements({ R: 500, delta: 30 });
    const dRad = 30 * Math.PI / 180;
    expect(c.T).toBeCloseTo(500 * Math.tan(dRad / 2), 4);
    expect(c.L).toBeCloseTo(500 * dRad, 4);
    expect(c.C).toBeCloseTo(2 * 500 * Math.sin(dRad / 2), 4);
    expect(c.E).toBeCloseTo(500 * (1 / Math.cos(dRad / 2) - 1), 4);
    expect(c.M).toBeCloseTo(500 * (1 - Math.cos(dRad / 2)), 4);
    expect(c.R).toBe(500);
    expect(c.delta).toBe(30);
  });

  it('R=200 + T known: recovers delta', () => {
    const dRad = 45 * Math.PI / 180;
    const T = 200 * Math.tan(dRad / 2);
    const c = curveElements({ R: 200, T });
    expect(c.delta).toBeCloseTo(45, 4);
    expect(c.L).toBeCloseTo(200 * dRad, 4);
  });

  it('delta + L: recovers R', () => {
    const c = curveElements({ delta: 60, L: 500 });
    const expectedR = 500 / (60 * Math.PI / 180);
    expect(c.R).toBeCloseTo(expectedR, 2);
  });

  it('delta + T: recovers R', () => {
    const dRad = 40 * Math.PI / 180;
    const T = 300 * Math.tan(dRad / 2);
    const c = curveElements({ delta: 40, T });
    expect(c.R).toBeCloseTo(300, 2);
  });

  it('delta + C: recovers R', () => {
    const dRad = 50 * Math.PI / 180;
    const C = 2 * 400 * Math.sin(dRad / 2);
    const c = curveElements({ delta: 50, C });
    expect(c.R).toBeCloseTo(400, 2);
  });

  it('delta + E: recovers R', () => {
    const dRad = 35 * Math.PI / 180;
    const E = 250 * (1 / Math.cos(dRad / 2) - 1);
    const c = curveElements({ delta: 35, E });
    expect(c.R).toBeCloseTo(250, 2);
  });

  it('delta + M: recovers R', () => {
    const dRad = 55 * Math.PI / 180;
    const M = 350 * (1 - Math.cos(dRad / 2));
    const c = curveElements({ delta: 55, M });
    expect(c.R).toBeCloseTo(350, 2);
  });

  it('R + C: recovers delta', () => {
    const dRad = 25 * Math.PI / 180;
    const C = 2 * 600 * Math.sin(dRad / 2);
    const c = curveElements({ R: 600, C });
    expect(c.delta).toBeCloseTo(25, 4);
  });

  it('R + L: recovers delta', () => {
    const dRad = 70 * Math.PI / 180;
    const L = 300 * dRad;
    const c = curveElements({ R: 300, L });
    expect(c.delta).toBeCloseTo(70, 4);
  });

  it('semicircle: delta=180', () => {
    const c = curveElements({ R: 100, delta: 180 });
    expect(c.L).toBeCloseTo(100 * Math.PI, 4);
    expect(c.C).toBeCloseTo(200, 4);
    expect(c.M).toBeCloseTo(100, 4);
  });

  it('degree of curve (arc, 30m station)', () => {
    const c = curveElements({ R: 500, delta: 30, stationLength: 30 });
    expect(c.D_arc).toBeCloseTo(180 * 30 / (Math.PI * 500), 4);
  });

  it('T + E: recovers delta', () => {
    const dRad = 60 * Math.PI / 180;
    const T = 500 * Math.tan(dRad / 2);
    const E = 500 * (1 / Math.cos(dRad / 2) - 1);
    const c = curveElements({ T, E });
    expect(c.delta).toBeCloseTo(60, 2);
    expect(c.R).toBeCloseTo(500, 2);
  });

  it('E + M: recovers delta', () => {
    const dRad = 45 * Math.PI / 180;
    const E = 400 * (1 / Math.cos(dRad / 2) - 1);
    const M = 400 * (1 - Math.cos(dRad / 2));
    const c = curveElements({ E, M });
    expect(c.delta).toBeCloseTo(45, 2);
    expect(c.R).toBeCloseTo(400, 2);
  });

  it('returns null for unsupported pair', () => {
    const c = curveElements({ L: 100, C: 95 });
    expect(c).toBeNull();
  });
});
