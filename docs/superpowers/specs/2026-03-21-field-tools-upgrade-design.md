# Field Tools Upgrade — Coordinate Converter & Scale Calculator v2

**Date:** 2026-03-21
**Status:** Approved
**Repo:** BCKGeo/geomatics-command-centre

---

## Problem

The current Field Tools coordinate converter and scale calculator have several limitations:

1. **No zone override** — UTM and MTM zones are auto-detected from longitude with no way to manually select a different zone.
2. **MTM shown everywhere** — MTM projections are displayed for western Canada where they don't apply. MTM (Modified Transverse Mercator) only covers eastern Canada (zones 1-17, approximately -50.5° to -103.0° longitude).
3. **No height fields** — No support for ellipsoidal height (h), geoid undulation (N), or orthometric height (H). Surveyors need all three.
4. **No inline guidance** — No help text for users unfamiliar with the tool. Should be approachable for students, field crew, and juniors — not just experienced surveyors.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Height approach | User enters h + N, we compute H = h - N | Surveyors always have N from GNSS processing. Avoids embedding a large geoid grid. |
| Zone override UX | Lock/unlock toggle (auto-detect by default) | Common case stays simple; manual override is obvious and clearly indicated. |
| MTM visibility | Hidden when longitude is west of -103.0° (zone 17 western boundary) | MTM doesn't apply to western Canada. Showing it is confusing and misleading. |
| Inline help | Tooltips on fields + collapsible overview panel | Tooltips for mid-use reference; overview panel for first-time users. Both collapse/hide for experienced users. |
| Layout | Full-width converter on top; Scale + MagPanel side-by-side below | Converter is the centerpiece tool and needs room. Scale and Mag are compact and pair well. |

## Datum & Reference Standards

- **Horizontal:** NAD83(CSRS) on GRS80 ellipsoid (a=6378137, f=1/298.257222101)
- **Vertical:** CGVD2013 (Canadian Geodetic Vertical Datum of 2013)
- **Geoid Model:** CGG2013a (user provides N value; tool does not embed geoid grid)
- **Projections:** UTM (k₀=0.9996, FE=500000) and MTM (k₀=0.9999, FE=304800)
- **EPSG Codes:** NAD83 UTM = EPSG:269xx (north), EPSG:327xx (south)

---

## Component 1: Coordinate Converter (Full Width, Top)

### Inputs

**Geographic coordinates** — toggle between DD and DMS:
- **DD mode:** Lat and Lon as editable decimal degree fields
- **DMS mode:** Degrees, Minutes, Seconds fields with N/S and E/W toggle buttons

**Height row:**
- `Ellipsoidal Height (h)`: editable, metres
- `Geoid Undulation (N)`: editable, metres
- `Orthometric Height (H)`: read-only computed field, `H = h - N`, metres
- Tooltip on N: "The separation between the GRS80 ellipsoid and the geoid at your location. Get this from your GNSS processing software or NRCan's GPS-H tool."
- Tooltip on H: "Height above mean sea level (CGVD2013). Computed as H = h - N."

**Zone controls:**
- **UTM:** Auto-detected zone displayed with lock/unlock toggle icon. When unlocked, zone becomes an editable number field (1-60). Label shows "Auto" or "Manual" state.
- **MTM:** Same lock/unlock pattern, editable range 1-17. **Only visible when longitude is east of -103.0°** (western boundary of MTM zone 17; CM of zone 17 is -101.5°, boundary extends 1.5° further west). Hidden entirely for western Canada — no placeholder, no "N/A" message.

### Outputs (always visible, read-only)

All outputs shown simultaneously with individual copy-to-clipboard buttons:

- **DD:** `53.917100°, -122.749700°`
- **DMS:** `53° 55' 01.56" N, 122° 44' 58.92" W`
- **UTM:** `10N 516,842.00 E 5,977,431.00 N` | `EPSG:26910`
- **MTM:** *(only when applicable)* `Zone 24 xxx,xxx.xx E x,xxx,xxx.xx N`
- **Heights:** `h: 620.000 m | N: 16.432 m | H: 603.568 m (CGVD2013)`

### Collapsible Help Panel (top, collapsed by default)

> "Enter geographic coordinates in Decimal Degrees (DD) or Degrees-Minutes-Seconds (DMS). UTM and MTM projections are computed automatically for your location. To override the auto-detected zone, click the lock icon. For heights, enter your ellipsoidal height from GNSS and geoid undulation (N) from NRCan's GPS-H tool — orthometric height is computed as H = h - N. All coordinates reference NAD83(CSRS) on the GRS80 ellipsoid. Heights reference CGVD2013."

### Datum Label

`NAD83(CSRS) · GRS80 · CGVD2013`

---

## Component 2: Scale & Distance Calculator (Bottom Left)

### Inputs

- **Lat / Lon:** editable fields (independent from converter)
- **Orthometric Height (H):** editable, metres, labeled `(CGVD2013)`. Note: `elevFactor()` in geo.js technically expects ellipsoidal height (h), but using orthometric height (H) introduces an error of ~N/Rm² per metre (~0.000002), which is below the 6th decimal place displayed. This approximation is acceptable for this tool's precision.
- **Projection toggle:** `UTM | MTM` — MTM option hidden when west of -103.0° (same logic as converter)
- **Zone:** lock/unlock override, same pattern as converter

### Three-Box Display (inset style)

| Grid Scale Factor | Elevation Factor | Combined Scale Factor |
|---|---|---|
| 6 decimal places | 6 decimal places | 6 decimal places |
| Zone info sub-label | Elevation sub-label | "CSF" sub-label |

### Tooltips

- **Grid Scale Factor:** "How much the projection distorts distances at this location. Closer to the central meridian = closer to k₀."
- **Elevation Factor:** "Accounts for the difference between measurements at your elevation and on the ellipsoid surface. Higher elevation = smaller factor."
- **Combined Scale Factor:** "Grid Scale x Elevation Factor. Multiply ground distance by CSF to get grid distance."

### Distance Conversion

Bidirectional:
- Ground Distance → Grid Distance (ground × CSF)
- Grid Distance → Ground Distance (grid / CSF)

### Collapsible Help Panel (collapsed by default)

> "Enter a position and elevation to compute scale factors for your projection zone. The Combined Scale Factor (CSF) converts between ground-level measurements and grid distances on the projection. Ground Distance x CSF = Grid Distance. For precise work, ensure your elevation references CGVD2013."

---

## Component 3: MagPanel (Bottom Right, Unchanged)

No changes to the existing Magnetic Declination panel. It remains as-is in the bottom-right position.

---

## Layout

### Desktop (>= 768px)

```
┌─────────────────────────────────────────────────────────┐
│  Coordinate Converter (full width)                      │
│  [Collapsible Help]                                     │
│  [DD|DMS] [Lat] [Lon]                                  │
│  [h] [N] [H = computed]                                │
│  ─────────────────────────                              │
│  DD / DMS / UTM / MTM(conditional) / Heights outputs    │
│  NAD83(CSRS) · GRS80 · CGVD2013                        │
└─────────────────────────────────────────────────────────┘

┌────────────────────────────────┐ ┌──────────────────────┐
│  Scale & Distance              │ │  Magnetic Declination │
│  [Collapsible Help]            │ │  (MagPanel, unchanged)│
│  Lat / Lon / H                 │ │                       │
│  [UTM|MTM] Lock/Unlock Zone    │ │                       │
│  [GSF] [EF] [CSF]             │ │                       │
│  Ground <-> Grid conversion    │ │                       │
└────────────────────────────────┘ └──────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Reference tool disclaimer + NRCan TRX / GPS-H links    │
└─────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)

Everything stacks vertically: Converter → Scale → MagPanel → Disclaimer.

---

## Reference Disclaimer (Full Width, Bottom)

> "This is a reference tool for quick coordinate checks. For legal surveys, datum transformations, and official submissions, use NRCan TRX and GPS-H."

With links to:
- https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/trx.php
- https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/gpsh.php

---

## MTM Visibility Logic

MTM is shown only when the input longitude is east of -103.0° (the western boundary of MTM zone 17). Zone 17 has CM at -101.5°; its coverage extends 1.5° on each side to -100.0° (east) and -103.0° (west). The -103.0° cutoff sits near the Saskatchewan/Alberta border.

When hidden:
- No MTM output row in the converter
- No MTM option in the Scale & Distance projection toggle (defaults to UTM only)
- No "N/A" message — MTM simply doesn't appear

When visible:
- Full MTM output with zone, easting, northing, and copy button
- MTM available as projection option in Scale & Distance toggle

---

## Changes to geo.js

- Add `MTM_WEST_LIMIT` constant (-103.0°, western boundary of zone 17)
- `isMtmApplicable(lon)` helper function
- No other math changes needed — existing projection functions already support all zones

---

## Testing

- All existing tests must continue to pass (verify count with `vitest --reporter=verbose`)
- New tests for:
  - Zone override: verify projection with manually specified zone vs auto-detected
  - MTM visibility: verify `isMtmApplicable()` boundary logic at -103.0° boundary
  - Height computation: `H = h - N` for various inputs including edge cases (N=0, negative N, N > h producing negative H)
  - Lock/unlock state doesn't affect computation accuracy

---

## Validation Reference Values

**Prince George, BC (53.9171, -122.7497):**
- UTM Zone 10N: ~516,842 E, ~5,977,431 N | EPSG:26910
- MTM: hidden (west of -103.0°)

**Ottawa, ON (45.4215, -75.6972):**
- UTM Zone 18N: visible
- MTM Zone 8 (CM -74.5°): visible (east of -103.0°)

**Calgary, AB (51.0447, -114.0719):**
- UTM Zone 11N: visible
- MTM: hidden (west of -103.0°)

**Halifax, NS (44.6488, -63.5752):**
- UTM Zone 20N: visible
- MTM Zone 4 (CM -62.5°): visible
