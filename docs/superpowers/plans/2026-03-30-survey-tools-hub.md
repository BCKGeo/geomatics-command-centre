# Survey Tools Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge Field Kit + Quick Calcs into a tabbed Survey Tools hub with 6 new geodetic calculators and SVG visualizers.

**Architecture:** Single `/survey-tools` route with a tab bar rendering 10 calculator components. New geodetic math (Vincenty, area, curves) added to `geo.js` with TDD. SVG visualizers are inline in each calculator component, themed with `B` colors.

**Tech Stack:** React 18, Vite 6, Vitest, GRS80 ellipsoid math, inline SVG

**Spec:** `docs/superpowers/specs/2026-03-30-survey-tools-hub-design.md`

---

## File Structure

### New Files
```
src/geo.js                              -- extend with Vincenty, area, perimeter, curves
src/components/pages/SurveyTools.jsx    -- tabbed hub page (replaces FieldKit + Calcs)
src/components/field/InverseCalc.jsx    -- bearing & distance between two points + SVG
src/components/field/ForwardCalc.jsx    -- destination from bearing + distance + SVG
src/components/field/AreaCalc.jsx       -- polygon area from vertices + SVG
src/components/field/PhotoScale.jsx     -- GSD / photo scale from camera specs
src/components/field/CurveCalc.jsx      -- horizontal curve elements + SVG
src/components/field/IntersectCalc.jsx  -- line/circle intersections + SVG
```

### Modified Files
```
src/geo.js                              -- add 5 new exported functions
src/geo.test.js                         -- add ~35 new tests
src/App.jsx                             -- swap Field Kit + Quick Calcs for Survey Tools
src/data/glossary.js                    -- rename "Field Kit" key to "Survey Tools"
src/components/pages/CommandCentre.jsx  -- update station cards
src/components/pages/MissionBrief.jsx   -- update prose references
```

### Deleted Files
```
src/components/pages/FieldKit.jsx
src/components/pages/Calcs.jsx
```

---

## Task 1: Vincenty Inverse — Tests

**Files:**
- Modify: `src/geo.test.js` (append after line 651)

- [ ] **Step 1: Write failing tests for vincentyInverse**

Append to `src/geo.test.js`:

```javascript
// ═══════════════════════════════════════════════════════════════
// 11. VINCENTY INVERSE (distance & bearing between two points)
// ═══════════════════════════════════════════════════════════════
describe('Vincenty Inverse', () => {
  it('Ottawa to Toronto: distance ~351 km', () => {
    const r = vincentyInverse(45.4215, -75.6972, 43.6532, -79.3832);
    expect(r.distance).toBeCloseTo(351634, -2); // within ~100m of published
    expect(r.converged).toBe(true);
  });

  it('Ottawa to Toronto: forward azimuth ~245°', () => {
    const r = vincentyInverse(45.4215, -75.6972, 43.6532, -79.3832);
    expect(r.fwdAzimuth).toBeGreaterThan(240);
    expect(r.fwdAzimuth).toBeLessThan(250);
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
```

- [ ] **Step 2: Add import for vincentyInverse**

At the top of `src/geo.test.js`, add `vincentyInverse` to the import from `'./geo.js'`.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run`
Expected: FAIL — `vincentyInverse` is not exported from `./geo.js`

---

## Task 2: Vincenty Inverse — Implementation

**Files:**
- Modify: `src/geo.js` (append after line 63)

- [ ] **Step 1: Implement vincentyInverse in geo.js**

Append to `src/geo.js`:

```javascript
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
  let rev = Math.atan2(cU1 * Math.sin(lam), -sU1 * cU2 + cU1 * sU2 * Math.cos(lam)) / R;
  if (fwd < 0) fwd += 360;
  if (rev < 0) rev += 360;
  return { distance: dist, fwdAzimuth: fwd, revAzimuth: rev, converged: true };
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run`
Expected: All 189 existing + 9 new Vincenty inverse tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/geo.js src/geo.test.js
git commit -m "feat: add Vincenty inverse (distance & bearing between two points)"
```

---

## Task 3: Vincenty Direct — Tests & Implementation

**Files:**
- Modify: `src/geo.test.js` (append)
- Modify: `src/geo.js` (append)

- [ ] **Step 1: Write failing tests for vincentyDirect**

Append to `src/geo.test.js`:

```javascript
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
      expect(inv.distance).toBeCloseTo(dist, 0);
      expect(inv.fwdAzimuth).toBeCloseTo(az, 1);
    });
  });

  it('returns reverse azimuth', () => {
    const r = vincentyDirect(45.0, -75.0, 0, 100000);
    expect(r.revAzimuth).toBeCloseTo(180, 0);
  });
});
```

- [ ] **Step 2: Add vincentyDirect to imports in test file**

- [ ] **Step 3: Run tests — expect FAIL**

- [ ] **Step 4: Implement vincentyDirect in geo.js**

Append to `src/geo.js`:

```javascript
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
  let rev = Math.atan2(sAlpha, -sU1 * sinS + cU1 * cosS * cAz) / R;
  if (rev < 0) rev += 360;
  return { lat: lat2 / R, lon: lon1D + L / R, revAzimuth: rev };
}
```

- [ ] **Step 5: Run tests — expect ALL PASS**

- [ ] **Step 6: Commit**

```bash
git add src/geo.js src/geo.test.js
git commit -m "feat: add Vincenty direct (destination from bearing + distance)"
```

---

## Task 4: Geodesic Area & Perimeter — Tests & Implementation

**Files:**
- Modify: `src/geo.test.js` (append)
- Modify: `src/geo.js` (append)

- [ ] **Step 1: Write failing tests for geodesicArea and geodesicPerimeter**

Append to `src/geo.test.js`:

```javascript
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
    expect(area).toBeLessThan(1e6); // less than 1 km²
  });

  it('known ~1 km² square', () => {
    // ~1 km sides at 45°N: 1km ≈ 0.009° lat, 0.0127° lon
    const pts = [
      { lat: 45.0, lon: -75.0 },
      { lat: 45.0, lon: -74.9873 },
      { lat: 45.009, lon: -74.9873 },
      { lat: 45.009, lon: -75.0 },
    ];
    const area = geodesicArea(pts);
    expect(area).toBeGreaterThan(900000);  // > 0.9 km²
    expect(area).toBeLessThan(1100000);    // < 1.1 km²
  });

  it('collinear points return area ~0', () => {
    const pts = [
      { lat: 45.0, lon: -75.0 },
      { lat: 45.5, lon: -75.0 },
      { lat: 46.0, lon: -75.0 },
    ];
    const area = geodesicArea(pts);
    expect(area).toBeLessThan(1); // effectively 0
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
```

- [ ] **Step 2: Add geodesicArea and geodesicPerimeter to imports**

- [ ] **Step 3: Run tests — expect FAIL**

- [ ] **Step 4: Implement geodesicArea and geodesicPerimeter in geo.js**

Append to `src/geo.js`:

```javascript
// GRS80 authalic sphere radius for area calculation
const AUTHALIC_R = 6371007.2;

export function geodesicArea(points) {
  const n = points.length;
  if (n < 3) return 0;
  const R = Math.PI / 180;
  // Spherical excess method on authalic sphere
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
```

- [ ] **Step 5: Run tests — expect ALL PASS**

- [ ] **Step 6: Commit**

```bash
git add src/geo.js src/geo.test.js
git commit -m "feat: add geodesic area (authalic sphere) and perimeter"
```

---

## Task 5: Curve Elements — Tests & Implementation

**Files:**
- Modify: `src/geo.test.js` (append)
- Modify: `src/geo.js` (append)

- [ ] **Step 1: Write failing tests for curveElements**

Append to `src/geo.test.js`:

```javascript
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
    expect(c.C).toBeCloseTo(200, 4); // chord = diameter
    expect(c.M).toBeCloseTo(100, 4); // middle ordinate = radius
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
    const c = curveElements({ L: 100, C: 95 }); // transcendental — unsupported
    expect(c).toBeNull();
  });
});
```

- [ ] **Step 2: Add curveElements to imports**

- [ ] **Step 3: Run tests — expect FAIL**

- [ ] **Step 4: Implement curveElements in geo.js**

Append to `src/geo.js`:

```javascript
export function curveElements(params) {
  const { stationLength = 30 } = params;
  const D2R = Math.PI / 180;
  let R = params.R, delta = params.delta, T = params.T, L = params.L, C = params.C, E = params.E, M = params.M;

  // Resolve R and delta from the two known values
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
  else { return null; } // unsupported pair

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
```

- [ ] **Step 5: Run tests — expect ALL PASS**

- [ ] **Step 6: Commit**

```bash
git add src/geo.js src/geo.test.js
git commit -m "feat: add horizontal curve elements calculator"
```

---

## Task 6: Survey Tools Hub Page

**Files:**
- Create: `src/components/pages/SurveyTools.jsx`

- [ ] **Step 1: Create SurveyTools.jsx with tab bar and existing components**

This component renders a tab bar and conditionally renders the selected calculator. Start with the 4 existing components only (new ones will be added in later tasks).

```jsx
import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useLocation } from "../../context/LocationContext.jsx";
import { CoordConverter } from "../field/CoordConverter.jsx";
import { ScaleCalc } from "../field/ScaleCalc.jsx";
import { MagPanel } from "../field/MagPanel.jsx";
import { CalcPanel } from "../field/CalcPanel.jsx";

const TABS = [
  { id: "coords", label: "Coordinates", icon: "\uD83D\uDCE1" },
  { id: "scale", label: "Scale Factors", icon: "\uD83D\uDCCF" },
  { id: "mag", label: "Mag Declination", icon: "\uD83E\uDDED" },
  { id: "units", label: "Unit Converter", icon: "\u2696\uFE0F" },
  { id: "inverse", label: "Inverse", icon: "\uD83D\uDCCD" },
  { id: "forward", label: "Forward", icon: "\u27A1\uFE0F" },
  { id: "area", label: "Area", icon: "\u2B1B" },
  { id: "photo", label: "Photo Scale", icon: "\uD83D\uDCF7" },
  { id: "curves", label: "Curves", icon: "\u27B0" },
  { id: "intersect", label: "Intersections", icon: "\u2716\uFE0F" },
];

export function SurveyTools() {
  const { B } = useTheme();
  const { lat, lon } = useLocation();
  const [tab, setTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return TABS.find(t => t.id === hash)?.id || "coords";
  });

  useEffect(() => {
    window.location.hash = tab;
  }, [tab]);

  const cardStyle = { background: `linear-gradient(135deg,${B.surface},${B.surfaceHi})`, border: `2px solid ${B.border}`, borderTopColor: B.bvL, borderLeftColor: B.bvL, borderBottomColor: B.bvD, borderRightColor: B.bvD, borderRadius: 0, padding: 16 };

  const renderTab = () => {
    switch (tab) {
      case "coords": return <CoordConverter initialLat={lat} initialLon={lon} />;
      case "scale": return <ScaleCalc initialLat={lat} initialLon={lon} />;
      case "mag": return <MagPanel initialLat={lat} initialLon={lon} />;
      case "units": return <CalcPanel />;
      case "inverse": return <div style={{ color: B.textDim, fontSize: 12 }}>Inverse calculator — coming soon</div>;
      case "forward": return <div style={{ color: B.textDim, fontSize: 12 }}>Forward calculator — coming soon</div>;
      case "area": return <div style={{ color: B.textDim, fontSize: 12 }}>Area calculator — coming soon</div>;
      case "photo": return <div style={{ color: B.textDim, fontSize: 12 }}>Photo scale calculator — coming soon</div>;
      case "curves": return <div style={{ color: B.textDim, fontSize: 12 }}>Curve calculator — coming soon</div>;
      case "intersect": return <div style={{ color: B.textDim, fontSize: 12 }}>Intersections calculator — coming soon</div>;
      default: return null;
    }
  };

  return (
    <div>
      {/* Tab Bar */}
      <div role="tablist" style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 12 }}>
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? B.surface : "transparent",
              border: tab === t.id ? `2px solid ${B.borderHi}` : "2px solid transparent",
              borderTopColor: tab === t.id ? B.bvL : "transparent",
              borderLeftColor: tab === t.id ? B.bvL : "transparent",
              borderBottomColor: tab === t.id ? B.bvD : "transparent",
              borderRightColor: tab === t.id ? B.bvD : "transparent",
              padding: "6px 12px", color: tab === t.id ? B.text : B.textDim,
              fontSize: 11, fontWeight: tab === t.id ? 700 : 500, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, fontFamily: B.font,
              letterSpacing: ".06em", transition: "all .1s",
            }}>
            <span style={{ fontSize: 11 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div role="tabpanel" style={cardStyle}>
        {renderTab()}
      </div>

      {/* Disclaimer */}
      <div style={{ background: "#3b82f610", border: "1px solid #3b82f620", borderRadius: 5, padding: "6px 8px", fontSize: 10, color: B.textDim, lineHeight: 1.5, marginTop: 12 }}>
        Reference tool only {"\u2014"} not for legal survey or navigation use. For official work, use{" "}
        <a href="https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/trx.php" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>NRCan TRX</a>
        {" "}and{" "}
        <a href="https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/gpsh.php" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "underline" }}>GPS{"\u00B7"}H</a>.
        {" "}Projections computed on NAD83(CSRS), GRS80 ellipsoid. Heights reference CGVD2013.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify file saved correctly**

Run: `npx vite build`
Expected: Build succeeds (SurveyTools not imported yet, but file is valid JSX)

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/SurveyTools.jsx
git commit -m "feat: add Survey Tools hub page with tab bar"
```

---

## Task 7: Wire Up Routes — Replace Field Kit + Quick Calcs

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/pages/CommandCentre.jsx`
- Modify: `src/components/pages/MissionBrief.jsx`
- Modify: `src/data/glossary.js`
- Delete: `src/components/pages/FieldKit.jsx`
- Delete: `src/components/pages/Calcs.jsx`

- [ ] **Step 1: Update App.jsx — imports**

Replace the FieldKit and Calcs imports with SurveyTools:
```javascript
// Remove these two lines:
import { FieldKit } from "./components/pages/FieldKit.jsx";
import { Calcs } from "./components/pages/Calcs.jsx";
// Add this line:
import { SurveyTools } from "./components/pages/SurveyTools.jsx";
```

- [ ] **Step 2: Update App.jsx — NAV array**

Replace the Field Kit and Quick Calcs nav entries with:
```javascript
  { path: "/survey-tools", label: "Survey Tools", icon: "\uD83D\uDD27" },
```
Remove:
```javascript
  { path: "/field-kit", label: "Field Kit", icon: "\u2699\uFE0F" },
  { path: "/calcs", label: "Quick Calcs", icon: "\u2797" },
```

- [ ] **Step 3: Update App.jsx — Routes**

Replace:
```jsx
<Route path="/field-kit" element={<FieldKit />} />
<Route path="/calcs" element={<Calcs />} />
```
With:
```jsx
<Route path="/survey-tools" element={<SurveyTools />} />
```

- [ ] **Step 4: Update CommandCentre.jsx — station cards**

In the `stations` array, replace the Field Kit and Quick Calcs entries with:
```javascript
  { i: "\uD83D\uDD27", t: "Survey Tools", d: "Coordinates, scale, calcs, COGO", to: "/survey-tools" },
```
Remove:
```javascript
  { i: "\u2699\uFE0F", t: "Field Kit", d: "Coordinates, scale factors, mag dec", to: "/field-kit" },
  { i: "\u2797", t: "Quick Calcs", d: "Unit, speed & temp conversions", to: "/calcs" },
```

- [ ] **Step 5: Update MissionBrief.jsx — prose**

Find the text containing "Field Kit" and "Quick Calcs" and replace with "Survey Tools":
```
<b style={{ color: B.text }}>Survey Tools</b> (coordinate converter, scale calculator, magnetic declination, unit conversions, COGO)
```
Remove the separate Quick Calcs reference.

- [ ] **Step 6: Update glossary.js — rename "Field Kit" key**

Change `"Field Kit":` to `"Survey Tools":` in the GLOSSARY object.

- [ ] **Step 7: Delete old page files**

```bash
rm src/components/pages/FieldKit.jsx src/components/pages/Calcs.jsx
```

- [ ] **Step 8: Build and test**

Run: `npx vitest run && npx vite build`
Expected: All tests pass, build succeeds (68+ modules)

- [ ] **Step 9: Commit**

```bash
git add src/App.jsx src/data/glossary.js src/components/pages/CommandCentre.jsx src/components/pages/MissionBrief.jsx src/components/pages/SurveyTools.jsx
git rm src/components/pages/FieldKit.jsx src/components/pages/Calcs.jsx
git commit -m "feat: merge Field Kit + Quick Calcs into Survey Tools hub"
```

---

## Task 8: Inverse Calculator Component + SVG Visualizer

**Files:**
- Create: `src/components/field/InverseCalc.jsx`
- Modify: `src/components/pages/SurveyTools.jsx` (import and wire up)

- [ ] **Step 1: Create InverseCalc.jsx**

The component has two coordinate input groups (A and B) with DD/DMS toggle, outputs for distance and azimuths, and an SVG visualizer showing the two points, connecting line, and azimuth arcs.

See spec for input/output details. Follow CoordConverter.jsx patterns for:
- DD/DMS toggle buttons
- Input styling (`B.bg`, `B.borderHi`, `borderRadius: 4`)
- Output rows (flex, space-between, copy buttons)
- `useTheme()` for all colors

The SVG visualizer (right side on desktop, below on mobile via `cmd-split`):
- ViewBox `0 0 200 200`
- Two points (A blue, B gold) with labels
- Dashed connecting line
- North arrow at top
- Forward azimuth arc at point A
- Distance label centered on line

Use `vincentyInverse` from `../../geo.js` for computation. When `converged` is false, display the warning: "Points are nearly antipodal -- Vincenty does not converge for this geometry." instead of outputs.

- [ ] **Step 2: Wire into SurveyTools.jsx**

Add import:
```javascript
import { InverseCalc } from "../field/InverseCalc.jsx";
```

Replace the placeholder in `renderTab`:
```javascript
case "inverse": return <InverseCalc initialLat={lat} initialLon={lon} />;
```

- [ ] **Step 3: Build and verify**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/field/InverseCalc.jsx src/components/pages/SurveyTools.jsx
git commit -m "feat: add Inverse calculator with SVG visualizer"
```

---

## Task 9: Forward Calculator Component + SVG Visualizer

**Files:**
- Create: `src/components/field/ForwardCalc.jsx`
- Modify: `src/components/pages/SurveyTools.jsx`

- [ ] **Step 1: Create ForwardCalc.jsx**

Inputs: start point (DD/DMS), azimuth, distance. Outputs: destination lat/lon (DD + DMS), UTM, reverse azimuth. SVG: origin point, bearing ray, destination point, north arrow.

Use `vincentyDirect` and `geoToUtm` from `../../geo.js`.

Follow same patterns as InverseCalc for input styling, output rows, SVG conventions.

- [ ] **Step 2: Wire into SurveyTools.jsx**

```javascript
import { ForwardCalc } from "../field/ForwardCalc.jsx";
// ...
case "forward": return <ForwardCalc initialLat={lat} initialLon={lon} />;
```

- [ ] **Step 3: Build and verify**

- [ ] **Step 4: Commit**

```bash
git add src/components/field/ForwardCalc.jsx src/components/pages/SurveyTools.jsx
git commit -m "feat: add Forward calculator with SVG visualizer"
```

---

## Task 10: Area Calculator Component + SVG Visualizer

**Files:**
- Create: `src/components/field/AreaCalc.jsx`
- Modify: `src/components/pages/SurveyTools.jsx`

- [ ] **Step 1: Create AreaCalc.jsx**

Inputs: editable table of lat/lon vertices with add/remove buttons. Outputs: area (m², ha, acres), perimeter (m, km), vertex count. SVG: polygon with numbered vertices, semi-transparent fill, closing segment dashed, area label centered.

Use `geodesicArea` and `geodesicPerimeter` from `../../geo.js`.

Vertices stored in state as array of `{lat, lon}`. Minimum 3 to compute. Add row prepopulates from location context or blank. Remove row button on each row (disabled if only 3 remain).

- [ ] **Step 2: Wire into SurveyTools.jsx**

- [ ] **Step 3: Build and verify**

- [ ] **Step 4: Commit**

```bash
git add src/components/field/AreaCalc.jsx src/components/pages/SurveyTools.jsx
git commit -m "feat: add Area calculator with SVG visualizer"
```

---

## Task 11: Photo Scale / GSD Calculator

**Files:**
- Create: `src/components/field/PhotoScale.jsx`
- Modify: `src/components/pages/SurveyTools.jsx`

- [ ] **Step 1: Create PhotoScale.jsx**

Inputs: preset dropdown (6 generic + Custom), focal length, sensor width/height, image width/height, flying height AGL. All fields editable. Outputs: GSD (cm/px, large display), photo scale (1:N), ground coverage (w x h in m), coverage area (m², ha).

Presets array:
```javascript
const PRESETS = [
  { name: "Compact 1\" (20 MP, 24 mm equiv)", focal: 8.8, sw: 13.2, sh: 8.8, iw: 5472, ih: 3648 },
  { name: "Micro 4/3 (20 MP, 24 mm)", focal: 12, sw: 17.3, sh: 13.0, iw: 5184, ih: 3888 },
  { name: "APS-C (26 MP, 35 mm equiv)", focal: 23.2, sw: 23.5, sh: 15.6, iw: 6240, ih: 4160 },
  { name: "Full Frame (45 MP, 35 mm)", focal: 35, sw: 35.9, sh: 23.9, iw: 8192, ih: 5464 },
  { name: "Full Frame (61 MP, 24 mm)", focal: 24, sw: 35.7, sh: 23.8, iw: 9504, ih: 6336 },
  { name: "1\" Telephoto (12 MP, 162 mm equiv)", focal: 46.5, sw: 13.2, sh: 8.8, iw: 4000, ih: 3000 },
  { name: "Custom", focal: 0, sw: 0, sh: 0, iw: 0, ih: 0 },
];
```

No SVG visualizer for this calculator. Pure numeric output.

All computations guard against zero/negative values — show no output if invalid.

- [ ] **Step 2: Wire into SurveyTools.jsx**

- [ ] **Step 3: Build and verify**

- [ ] **Step 4: Commit**

```bash
git add src/components/field/PhotoScale.jsx src/components/pages/SurveyTools.jsx
git commit -m "feat: add Photo Scale / GSD calculator with presets"
```

---

## Task 12: Horizontal Curve Calculator + SVG Visualizer

**Files:**
- Create: `src/components/field/CurveCalc.jsx`
- Modify: `src/components/pages/SurveyTools.jsx`

- [ ] **Step 1: Create CurveCalc.jsx**

Inputs: 8 fields (R, D, delta, L, C, T, E, M) — user fills any supported pair. Station length toggle (30 m / 100 ft). Arc/chord degree definition toggle. Unsupported pairs show guidance message.

Uses `curveElements` from `../../geo.js`.

SVG visualizer: arc path, two tangent lines meeting at PI, radius line, chord (dashed), labeled elements (R, T, L, C, E, M with leader lines). ViewBox `0 0 250 200`.

State management: track which 2 fields the user has entered (non-empty). Call `curveElements` when exactly 2 are filled. Clear computed values when user changes inputs.

- [ ] **Step 2: Wire into SurveyTools.jsx**

- [ ] **Step 3: Build and verify**

- [ ] **Step 4: Commit**

```bash
git add src/components/field/CurveCalc.jsx src/components/pages/SurveyTools.jsx
git commit -m "feat: add Horizontal Curve calculator with SVG visualizer"
```

---

## Task 13: Intersections Calculator + SVG Visualizer

**Files:**
- Create: `src/components/field/IntersectCalc.jsx`
- Modify: `src/components/pages/SurveyTools.jsx`

- [ ] **Step 1: Create IntersectCalc.jsx**

Three modes via toggle: Bearing-Bearing, Bearing-Distance, Distance-Distance.

Each mode has two point inputs (lat/lon DD) plus mode-specific inputs (azimuths and/or distances).

Both points projected into Point A's UTM zone using `geoToUtm` and `tmToGeo` from `../../geo.js`. Intersection solved in Cartesian coordinates, result converted back to geographic.

Intersection math (in-component, not geo.js):
- **Bearing-Bearing:** Line-line intersection using parametric form
- **Bearing-Distance:** Line-circle intersection (quadratic, 0 or 2 solutions)
- **Distance-Distance:** Circle-circle intersection (0 or 2 solutions)

SVG visualizer: points A and B, bearing rays (dashed) or circles (dashed), intersection point(s) in gold. "No solution" state: elements drawn but no gold point, faded styling.

- [ ] **Step 2: Wire into SurveyTools.jsx**

Remove all remaining placeholder cases in `renderTab`.

- [ ] **Step 3: Build and verify**

- [ ] **Step 4: Commit**

```bash
git add src/components/field/IntersectCalc.jsx src/components/pages/SurveyTools.jsx
git commit -m "feat: add Intersections calculator with SVG visualizer"
```

---

## Task 14: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All 189 existing + ~35 new tests PASS (total ~224)

- [ ] **Step 2: Run production build**

Run: `npx vite build`
Expected: Build succeeds, reasonable bundle size (< 400 KB gzipped)

- [ ] **Step 3: Start dev server and verify all tabs**

Run: `npx vite --host`
Verify each of the 10 tabs renders correctly at `http://localhost:5173/survey-tools`

- [ ] **Step 4: Verify URL hash navigation**

Navigate to `http://localhost:5173/survey-tools#inverse` — should open on Inverse tab.
Refresh page — should stay on Inverse tab.

- [ ] **Step 5: Verify old routes removed**

Navigate to `/field-kit` and `/calcs` — should show blank/404 (no route match).

- [ ] **Step 6: Verify nav item count is 10**

Check header nav bar has exactly 10 items (Command Centre through Mission Brief, no Field Kit or Quick Calcs).

- [ ] **Step 7: Verify station cards on Command Centre**

The station cards grid should show "Survey Tools" instead of "Field Kit" and "Quick Calcs". Clicking it should navigate to `/survey-tools`.

- [ ] **Step 8: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup after Survey Tools integration"
```
