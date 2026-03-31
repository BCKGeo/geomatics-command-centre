# Survey Tools Hub - Design Spec

**Date:** 2026-03-30
**Status:** Draft
**Scope:** Phase 2 of BCKGeo Dashboard v3 - Enhanced Field Tools

---

## Overview

Merge the existing Field Kit (`/field-kit`) and Quick Calcs (`/calcs`) into a single **Survey Tools** page (`/survey-tools`) with a tabbed calculator hub. Add 6 new geodetic/survey calculators. Reduce nav items from 11 to 10.

## Navigation Changes

### Before
```
Command Centre | Flight Ops | Geodesy | GIS | Remote Sensing | Provincial Intel | Field Kit | Quick Calcs | Regs & Standards | Codex | Mission Brief
```

### After
```
Command Centre | Flight Ops | Geodesy | GIS | Remote Sensing | Provincial Intel | Survey Tools | Regs & Standards | Codex | Mission Brief
```

- Route: `/survey-tools`
- Nav entry: `{ path: "/survey-tools", label: "Survey Tools", icon: "wrench emoji" }`
- `/field-kit` and `/calcs` routes removed

## Tab Layout

Horizontal tab bar at the top of the Survey Tools page, using the same beveled button style as the main navigation. Active tab stored in URL hash (e.g. `/survey-tools#inverse`, `/survey-tools#curves`) so tabs are bookmarkable and survive page refresh. Default tab (no hash): Coordinates. Tab bar uses `role="tablist"` with `role="tab"` buttons and `role="tabpanel"` on content for accessibility.

| # | Tab Label | Component | Status |
|---|-----------|-----------|--------|
| 1 | Coordinates | `CoordConverter.jsx` | Existing |
| 2 | Scale Factors | `ScaleCalc.jsx` | Existing |
| 3 | Mag Declination | `MagPanel.jsx` | Existing |
| 4 | Unit Converter | `CalcPanel.jsx` | Existing |
| 5 | Inverse | `InverseCalc.jsx` | New |
| 6 | Forward | `ForwardCalc.jsx` | New |
| 7 | Area | `AreaCalc.jsx` | New |
| 8 | Photo Scale / GSD | `PhotoScale.jsx` | New |
| 9 | Curves | `CurveCalc.jsx` | New |
| 10 | Intersections | `IntersectCalc.jsx` | New |

## New Calculator Specifications

### 1. Inverse Calculator (`InverseCalc.jsx`)

**Purpose:** Geodesic distance and bearing between two points using Vincenty inverse on GRS80.

**Inputs:**
- Point A: lat/lon (DD or DMS toggle, same input pattern as CoordConverter)
- Point B: lat/lon (same)

**Outputs:**
- Geodesic distance in metres (with km conversion if > 1000 m)
- Forward azimuth A to B (decimal degrees and DMS)
- Reverse azimuth B to A (decimal degrees and DMS)
- Copy button on each output row

**Math:** `vincentyInverse(lat1, lon1, lat2, lon2)` added to `geo.js`. Iterative solution on GRS80 ellipsoid (a = 6378137, f = 1/298.257222101). Returns `{ distance, fwdAzimuth, revAzimuth }`.

**Edge cases:** Identical points return distance 0, azimuth 0. Near-antipodal points (> 179.5 degrees apart) return `{ distance: NaN, fwdAzimuth: NaN, revAzimuth: NaN }` with a convergence flag `converged: false`. The UI displays "Points are nearly antipodal -- Vincenty does not converge for this geometry." This is a known limitation of the algorithm and is acceptable for a reference tool.

---

### 2. Forward Calculator (`ForwardCalc.jsx`)

**Purpose:** Compute destination point from a start coordinate, forward azimuth, and distance using Vincenty direct.

**Inputs:**
- Start point: lat/lon (DD or DMS)
- Forward azimuth (degrees)
- Distance (metres)

**Outputs:**
- Destination lat/lon (DD and DMS)
- Reverse azimuth at destination (degrees and DMS)
- UTM zone, easting, northing of destination
- Copy buttons

**Math:** `vincentyDirect(lat, lon, azimuth, distance)` added to `geo.js`. Returns `{ lat, lon, revAzimuth }`.

**Validation:** Round-trip test: direct then inverse should return original azimuth and distance.

---

### 3. Area Calculator (`AreaCalc.jsx`)

**Purpose:** Geodesic area of a polygon defined by coordinate vertices.

**Inputs:**
- Editable table of vertices, each row: lat (DD), lon (DD)
- Add row / remove row buttons
- Minimum 3 points required
- Polygon closure is implicit (last vertex connects to first)

**Outputs:**
- Area in m-squared, hectares, acres
- Perimeter in metres and km
- Vertex count

**Math:**
- `geodesicArea(points[])` added to `geo.js`. Uses spherical excess method on the GRS80 authalic sphere (radius 6371007.2 m). This is accurate to sub-square-metre for typical survey parcels (< 100 ha). For province-scale polygons, error grows proportional to flattening (~0.3%); this is acceptable for a reference tool.
- `geodesicPerimeter(points[])` added to `geo.js`. Sums Vincenty inverse distances for each segment including the closing segment.

**Edge cases:** Fewer than 3 points shows no result. Collinear points return area 0.

---

### 4. Photo Scale / GSD Calculator (`PhotoScale.jsx`)

**Purpose:** Ground sample distance, photo scale, and ground coverage from camera specs and flying height. Vendor-neutral with generic presets by sensor category.

**Inputs:**
- Preset selector dropdown:
  1. "Compact 1-inch (20 MP, 24 mm equiv)" -- sensor 13.2 x 8.8 mm, 5472 x 3648 px, focal 8.8 mm
  2. "Micro Four Thirds (20 MP, 24 mm)" -- sensor 17.3 x 13.0 mm, 5184 x 3888 px, focal 12 mm
  3. "APS-C (26 MP, 35 mm equiv)" -- sensor 23.5 x 15.6 mm, 6240 x 4160 px, focal 23.2 mm
  4. "Full Frame (45 MP, 35 mm)" -- sensor 35.9 x 23.9 mm, 8192 x 5464 px, focal 35 mm
  5. "Full Frame (61 MP, 24 mm)" -- sensor 35.7 x 23.8 mm, 9504 x 6336 px, focal 24 mm
  6. "1-inch Telephoto (12 MP, 162 mm equiv)" -- sensor 13.2 x 8.8 mm, 4000 x 3000 px, focal 46.5 mm
  7. "Custom" -- all fields blank, user enters everything
- Selecting a preset populates all fields below. All fields remain editable after preset selection.
- Focal length (mm) -- actual, not equivalent
- Sensor width (mm)
- Sensor height (mm)
- Image width (px)
- Image height (px)
- Flying height AGL (m) -- manual input, always required

**Outputs:**
- GSD (cm/pixel) -- primary output, large display
- Photo scale (1:N)
- Ground coverage width (m) x height (m)
- Ground coverage area (m-squared, hectares)

**Math:** Pure geometry, computed in component (not geo.js). Assumes square pixels (GSD identical in both axes). For non-square pixel sensors in Custom mode, a note is displayed.
- `GSD = (sensor_width * altitude) / (focal_length * image_width)` (in metres, display as cm)
- `scale_denominator = altitude / focal_length`
- `coverage_w = GSD * image_width`
- `coverage_h = GSD * image_height`
- `coverage_area = coverage_w * coverage_h`

**Validation:** All sensor/camera inputs must be positive. No output displayed if any required field is zero, blank, or negative.

---

### 5. Horizontal Curve Calculator (`CurveCalc.jsx`)

**Purpose:** Compute all elements of a simple circular curve from any two known values.

**Inputs (enter any 2, leave rest blank):**
- Radius R (m)
- Degree of Curve D (with toggle: arc definition vs chord definition)
- Station length toggle: 30 m (metric, default) or 100 ft (30.48 m, imperial)
- Deflection Angle / Delta (degrees)
- Arc Length L (m)
- Chord Length C (m)
- Tangent Length T (m)
- External Distance E (m)
- Middle Ordinate M (m)

**Supported input pairs:** Not all 28 combinations of 2 inputs are independently solvable. The following pairs are supported:

| Pair | Solution |
|------|----------|
| R + delta | Direct formulas for all remaining |
| R + T | delta = 2 * atan(T/R), then direct |
| R + L | delta = L/R, then direct |
| R + C | delta = 2 * asin(C/(2R)), then direct |
| R + D | delta not determined, but D gives R (or confirms it); needs a second independent value |
| delta + T | R = T / tan(delta/2), then direct |
| delta + L | R = L / delta, then direct |
| delta + C | R = C / (2 * sin(delta/2)), then direct |
| delta + E | R = E / (sec(delta/2) - 1), then direct |
| delta + M | R = M / (1 - cos(delta/2)), then direct |
| T + E | delta = 2 * acos(T / (T + E)), then R from T |
| E + M | delta = 2 * acos(1 / (E/M + 1)), then R from M (note: this pair requires iterative confirmation) |

Unsupported pairs (e.g. L + C, T + C) that require transcendental/numerical solutions are greyed out in the UI with a tooltip: "This combination requires iterative solution -- use R or delta as one input."

**Outputs:** All 8 curve properties computed and displayed in a results grid. Inputs that were entered are highlighted; computed values are shown as output rows with copy buttons.

**Math:** Standard circular curve relationships:
- `T = R * tan(delta/2)`
- `L = R * delta` (delta in radians)
- `C = 2 * R * sin(delta/2)`
- `E = R * (1/cos(delta/2) - 1)`
- `M = R * (1 - cos(delta/2))`
- `D_arc = 180 * station_length / (pi * R)` (station_length: 30 m metric or 30.48 m imperial)
- `D_chord = 2 * asin(station_length / (2 * R))`

Add `curveElements(params)` to `geo.js`. Returns all 8 properties given a supported pair. Uses metric station length (30 m) by default.

**Validation:** If fewer than 2 values provided, show prompt. If an unsupported pair is entered, show guidance. If inputs are inconsistent, show error.

---

### 6. Intersections Calculator (`IntersectCalc.jsx`)

**Purpose:** Find the intersection point(s) from two lines or circles.

**Inputs -- three modes via toggle buttons:**

1. **Bearing-Bearing:** Point A lat/lon + azimuth A, Point B lat/lon + azimuth B
2. **Bearing-Distance:** Point A lat/lon + azimuth, Point B lat/lon + distance from B
3. **Distance-Distance:** Point A lat/lon + distance from A, Point B lat/lon + distance from B

**Outputs:**
- Intersection point(s) lat/lon (DD and DMS)
- UTM coordinates of intersection(s)
- For modes 2 and 3: up to 2 solutions displayed, or "no solution" if circles/line don't intersect

**Math:** Both input points projected into the UTM zone of Point A. Solve intersection in Cartesian coordinates, convert result back to geographic. This is accurate for typical survey distances (< 50 km). Intersection math:
- Bearing-bearing: line-line intersection
- Bearing-distance: line-circle intersection (0 or 2 solutions)
- Distance-distance: circle-circle intersection (0 or 2 solutions)

Intersection logic kept in the component (not geo.js) since it uses projected coordinates and existing geo.js UTM functions.

---

## geo.js Extensions

New exported functions:

| Function | Signature | Returns |
|----------|-----------|---------|
| `vincentyInverse` | `(lat1, lon1, lat2, lon2)` | `{ distance, fwdAzimuth, revAzimuth }` |
| `vincentyDirect` | `(lat, lon, azimuth, distance)` | `{ lat, lon, revAzimuth }` |
| `geodesicArea` | `(points[{lat, lon}])` | area in m-squared |
| `geodesicPerimeter` | `(points[{lat, lon}])` | perimeter in metres |
| `curveElements` | `(params)` | `{ R, D, delta, L, C, T, E, M }` |

All functions use GRS80 ellipsoid constants already defined in geo.js.

## Test Plan

New tests added to `geo.test.js` (~30-40 tests):

**Vincenty Inverse:**
- Known baseline: Ottawa (45.4215, -75.6972) to Toronto (43.6532, -79.3832) -- verify against published distance
- Short distance (< 1 m)
- Identical points -- distance 0, azimuth 0
- Long distance (cross-continent)
- East-west line (azimuth near 90/270)
- North-south line (azimuth near 0/180)

**Vincenty Direct:**
- Forward then inverse round-trip (distance match < 0.001 m, azimuth match < 0.001 degrees)
- Known published NRCan values if available
- Zero distance -- returns input point

**Geodesic Area:**
- Known triangle area (cross-check with spherical formula)
- Known rectangle area
- Collinear points -- area 0
- Large polygon (province-scale)

**Geodesic Perimeter:**
- Sum of individual Vincenty inverse distances matches perimeter function
- Triangle perimeter cross-check

**Curve Elements:**
- Known radius + delta -- verify all 8 elements
- Known T + R -- verify delta and remaining
- Arc vs chord degree of curve consistency
- Edge cases: delta = 180 degrees (semicircle), very large radius

## File Changes

### New Files
```
src/components/field/InverseCalc.jsx
src/components/field/ForwardCalc.jsx
src/components/field/AreaCalc.jsx
src/components/field/PhotoScale.jsx
src/components/field/CurveCalc.jsx
src/components/field/IntersectCalc.jsx
src/components/pages/SurveyTools.jsx
```

### Modified Files
```
src/geo.js                              -- Vincenty, area, perimeter, curves
src/geo.test.js                         -- ~30-40 new tests
src/App.jsx                             -- replace Field Kit + Quick Calcs with Survey Tools
src/data/glossary.js                    -- rename "Field Kit" category
src/components/pages/CommandCentre.jsx  -- update station cards
src/components/pages/MissionBrief.jsx   -- update prose references
```

### Deleted Files
```
src/components/pages/FieldKit.jsx
src/components/pages/Calcs.jsx
```

## UI Patterns

All new calculator components follow the existing field component conventions:
- `useTheme()` for all styling via the `B` object
- Input style: `{ background: B.bg, border: "1px solid " + B.borderHi, borderRadius: 4, padding: "4px 8px", color: B.text, fontSize: 12, fontFamily: B.font }`
- Output rows: flex, space-between, `B.bg` background, `B.border` border
- Copy buttons: clipboard emoji, checkmark on success
- DD/DMS toggle: same pattern as CoordConverter
- Card wrapper: gradient background with beveled 3D borders
- Responsive: `cmd-split` class for two-column layouts that collapse at 768px

## Input Validation

All calculators that accept lat/lon inputs reject values outside valid ranges (lat: -90 to 90, lon: -180 to 180) with an inline error message. No output is computed until inputs are valid. Numeric fields that require positive values (distances, focal lengths, sensor dimensions) show no output if zero, blank, or negative.

## Disclaimer

All calculators include a disclaimer footer: "Reference tool only -- not for legal survey or navigation use." with links to NRCan TRX and GPS-H for official work.
