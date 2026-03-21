# Dashboard Overhaul — Tab Restructure, Provincial Intel, Weather Privacy, Input Upgrades

**Date:** 2026-03-21
**Status:** Approved
**Repo:** BCKGeo/geomatics-command-centre
**Related spec:** `2026-03-21-field-tools-upgrade-design.md` (zone override, heights, MTM visibility — already implemented)

---

## Problem

The dashboard has outgrown its original BC-focused structure. Several issues:

1. **"GIS & Data" is overloaded** — mixes GIS tools, remote sensing platforms, and BC provincial data in one tab.
2. **No provincial coverage beyond BC** — a Canadian geomatics tool should cover all provinces and territories.
3. **Weather defaults expose personal location** — Prince George coordinates hardcoded as defaults.
4. **MagPanel and ScaleCalc lack DD/DMS input** — only decimal degrees, while CoordConverter already supports both.
5. **Links have no descriptors** — users unfamiliar with a service (e.g., "SPIN2", "EODMS") get no context.
6. **Color palette is rainbow** — each section has a different accent color, breaking the Slytherin (green/silver/black) theme.
7. **Tab names are generic** — don't match the command centre identity.
8. **About page is stale** — doesn't reflect expanded scope.

---

## Section 1: Tab & Navigation Restructure

### Tab Bar (11 tabs, replacing 9)

| # | Tab ID | Label | Icon | Content |
|---|---|---|---|---|
| 1 | `command` | Command Centre | 🖥️ | Dashboard home — weather, space weather, mag dec, station cards |
| 2 | `flight` | Flight Ops | ✈️ | Transport Canada RPAS, NOTAMs, airspace |
| 3 | `geodesy` | Geodesy | 🌍 | NRCan, CSRS-PPP, GNSS tools |
| 4 | `spatial` | Spatial Ops | 🗺️ | GIS tools, spatial databases, CRS tools |
| 5 | `recon` | Recon & Sensing | 👁️ | Satellite imagery, LiDAR, photogrammetry, SAR |
| 6 | `provincial` | Provincial Intel | 🏛️ | Per-province/territory geospatial portals |
| 7 | `fieldkit` | Field Kit | ⚙️ | Coordinate converter, scale calculator, mag dec |
| 8 | `calcs` | Quick Calcs | ➗ | Unit, speed, temp, area conversions |
| 9 | `regs` | Regs & Standards | 📜 | Professional organizations, CSA, regulatory bodies |
| 10 | `codex` | Codex | 🔎 | Glossary of 60+ geomatics terms |
| 11 | `brief` | Mission Brief | 📝 | Project overview, data sources, methodology |

### Icon Changes from Current

| Tab | Old Icon | New Icon |
|---|---|---|
| Command Centre | ⚡ | 🖥️ |
| Geodesy | 🌐 | 🌍 |
| Field Kit (was Field Tools) | 🔧 | ⚙️ |
| Quick Calcs (was Calculator) | 🧮 | ➗ |
| Regs & Standards (was Standards) | 📐 | 📜 |
| Codex (was Glossary) | 📚 | 🔎 |
| Mission Brief (was About) | ℹ️ | 📝 |
| Flight Ops | ✈️ | ✈️ *(unchanged)* |

### What Changes

- "GIS & Data" removed — its links split between Spatial Ops, Recon & Sensing, and Provincial Intel
- "Glossary" → "Codex"
- "About" → "Mission Brief"
- "Standards" → "Regs & Standards"
- "Calculator" → "Quick Calcs"
- "Field Tools" → "Field Kit"
- Two new tabs: Recon & Sensing, Provincial Intel

### Complete Link Migration Map

Every existing link must have a home. Current SECTIONS and their destinations:

**"Transport Canada - RPAS" → Flight Ops** (all links stay)

**"NOTAMs & Airspace" → Flight Ops** (merge with RPAS section into single Flight Ops tab)

**"NRCan - Geodetic & Geomatics" → Geodesy** (all links stay)

**"GNSS & Coordinate Tools" → Geodesy** (merge into Geodesy tab; remove NavDrone duplicate — already in Flight Ops as "NAV Drone")

**"British Columbia - Provincial" → Provincial Intel** (under BC selector)

**"GIS & Remote Sensing" → split:**
- EPSG.io → Spatial Ops
- QGIS Downloads → Spatial Ops
- Esri ArcGIS Online → Spatial Ops
- Canada Open Data Portal → Spatial Ops
- Copernicus Data Space → Recon & Sensing
- USGS EarthExplorer → Recon & Sensing
- OpenTopography → Recon & Sensing
- CloudCompare → Recon & Sensing
- PDAL → Recon & Sensing

**"Professional & Standards" → Regs & Standards** (all links stay)

**Links that need a home decision:**
- AirData (drone flight logging) → Flight Ops
- SpaceWeatherLive → stays in Command Centre (space weather section, not a SECTIONS link)

### New Links Added

**Spatial Ops** (8 new, total 12):
GEO.ca, GDAL/OGR, PostGIS, PROJ, GeoServer, MapLibre GL JS, Statistics Canada Boundaries, Nominatim

**Recon & Sensing** (10 new, total 15):
EODMS, Canada HRDEM, ESA SNAP, Google Earth Engine, Sentinel Hub EO Browser, OpenDroneMap/WebODM, LAStools, Orfeo ToolBox, Potree, NRCan Air Photo Library

### Codex (Glossary) Category Updates

The GLOSSARY object keys must be updated to match new tab names:
- "GIS & Data" → split into "Spatial Ops" and "Recon & Sensing" categories
- "Field Tools" → "Field Kit"
- "Standards" → "Regs & Standards"
- Add new category: "Provincial Intel" (terms like SDI, cadastre, open data licence)

### Station Cards (Command Centre)

- 3x3 grid layout on desktop
- 9 cards: Flight Ops, Geodesy, Spatial Ops, Recon & Sensing, Provincial Intel, Field Kit, Quick Calcs, Regs & Standards, Codex
- Excluded: Command Centre (already on it), Mission Brief (footer-style link)
- Cards match new tab names, icons, and color palette

**Card descriptors:**

| Card | Descriptor |
|---|---|
| Flight Ops | RPAS regs, NOTAMs, airspace |
| Geodesy | NRCan, CSRS-PPP, GNSS |
| Spatial Ops | GIS tools, databases, CRS |
| Recon & Sensing | Imagery, LiDAR, photogrammetry |
| Provincial Intel | Open data by province |
| Field Kit | Coordinates, scale factors, mag dec |
| Quick Calcs | Unit, speed & temp conversions |
| Regs & Standards | Professional orgs, regulations |
| Codex | Terms & acronyms by domain |

---

## Section 2: Provincial Intel

### UX Pattern

Button row selector across the top. Clicking a province/territory shows its links below, organized by standard categories. One province visible at a time.

### Province/Territory Buttons (west to east, territories last)

```
BC | AB | SK | MB | ON | QC | NB | NS | PE | NL | YT | NT | NU
```

**Mobile (< 768px):** Horizontal scroll on the button row, or abbreviations only. 13 buttons will overflow on mobile — use horizontal scroll with no wrapping.

### 10 Standard Categories

| # | Category | Coverage |
|---|---|---|
| 1 | Open Data Portal | Universal — every jurisdiction has one |
| 2 | Map Viewer | Universal — interactive web mapping |
| 3 | Parcel / Cadastral | Universal — land survey & parcel data |
| 4 | Base Mapping | Universal — topographic maps |
| 5 | Imagery (Orthophotos & Satellite) | Most provinces — renamed from "Air Photos" |
| 6 | LiDAR / Elevation | Growing — coverage varies by province |
| 7 | Geodetic Control | Universal — some defer to federal CGS |
| 8 | Land Registry | Universal — most are paid services |
| 9 | Geological Survey | Universal — every province has one |
| 10 | Hydrography | Most provinces — floodplain, watershed data |

### Behaviour

- **Default selection:** User's detected province (from geolocation reverse geocode — BigDataCloud's `principalSubdivision` field maps to province name), or BC as fallback. Note: until the geolocation refactor (Section 3) is implemented, default to BC.
- **Each link:** Name + short descriptor (pulled from the service's own description)
- **Missing categories:** Hidden entirely — no empty slots, no "N/A"
- **Paid services:** Marked with a small indicator (💲 badge or "paid" label)
- **Nunavut:** Will be thin (mostly federal portals) — show what exists

### Data Structure

All provincial data is inlined in App.jsx (consistent with the single-file architecture). Estimated data payload: ~20 KB of link definitions (13 provinces x ~8 links x ~200 bytes).

```javascript
const PROVINCES = [
  {
    id: "bc",
    name: "British Columbia",
    abbr: "BC",
    categories: [
      {
        category: "Open Data Portal",
        links: [
          {n: "BC Data Catalogue", d: "Province's open data repository", u: "https://...", paid: false}
        ]
      },
      ...
    ]
  },
  ...
]
```

### Provincial Data Coverage

All 13 provinces and territories included. Key portals per jurisdiction (from market research):

**British Columbia:** BC Data Catalogue, iMapBC, ParcelMap BC, BCGW, TRIM 1:20K, LidarBC, BC Air Photos, myLTSA, GeoBC

**Alberta:** GeoDiscover Alberta, AltaLIS, SPIN2/ARLO, Provincial Geospatial Centre

**Saskatchewan:** Saskatchewan GeoHub, ISC, FlySask2 (SGIC orthophotos — note: availability can be intermittent)

**Manitoba:** DataMB (replacing MLI), Teranet Manitoba, Manitoba GIS Map Gallery

**Ontario:** Ontario GeoHub, OnLand (Teranet), OBM, SWOOP/SCOOP imagery

**Quebec:** Donnees Quebec, Geoboutique/Geoindex, Infolot, MRNF LiDAR, Registre foncier, Geodesie Quebec III

**New Brunswick:** GeoNB (Data Catalogue, Map Viewer, LiDAR, Survey Control — best-integrated provincial SDI)

**Nova Scotia:** GeoNOVA, DataLocator, Elevation Explorer, Property Online

**Prince Edward Island:** PEI Open Data, PEI GIS Data Layers, PEI Land Online

**Newfoundland & Labrador:** Open Data NL, GeoHub NL, Land Use Atlas, CADO

**Yukon:** GeoYukon, Yukon Open Data

**Northwest Territories:** NWT Centre for Geomatics, ATLAS

**Nunavut:** Federal portals (CLSS, NTS/CanTopo, CanElevation), Nunavut Map Viewer

---

## Section 3: Weather Widget & Privacy

### Problem

Default coordinates hardcoded to Prince George, BC (53.9171, -122.7497). Personal location baked into source code. The auto-request geolocation (added same day as this spec) should be changed to opt-in.

### Hardcoded Defaults to Remove

All Prince George references in `App.jsx`:
- `DEFAULT_LAT = 53.9171` (line 10)
- `DEFAULT_LON = -122.7497` (line 11)
- `DEFAULT_CITY = "Prince George, BC"` (line 12)
- `DEFAULT_TZ = "America/Vancouver"` (line 13)
- `calcSun(date, lat=53.9171, lon=-122.7497)` (line 31) — parameter defaults
- `MagPanel({initialLat=53.9171, initialLon=-122.7497})` (line 294) — parameter defaults
- `CoordConverter({initialLat=53.9171, initialLon=-122.7497})` (line 343) — parameter defaults
- `ScaleCalc({initialLat=53.9171, initialLon=-122.7497})` (line 490) — parameter defaults

### Replacement Defaults

Replace all with Ottawa, ON:
- `DEFAULT_LAT = 45.4215`
- `DEFAULT_LON = -75.6972`
- `DEFAULT_CITY = "Ottawa, ON"`
- `DEFAULT_TZ = "America/Toronto"`
- All component parameter defaults updated to match

### Add "Use My Location" Button

- GPS/crosshair icon button next to city name in weather widget
- Uses standard `navigator.geolocation` API (works on PC, laptop, tablet, phone)
- On click: requests permission → acquires position → updates weather → reverse geocodes city name
- Loading state while acquiring (spinner or pulsing icon)
- Success: saves to localStorage, persists between sessions
- Failure/denied: stays on Ottawa default, no error spam
- "Reset" option to clear stored location

### Geolocation is Opt-In Only

- Current auto-request on page load (`useEffect` at line 811) removed
- On load: check localStorage for saved location. If found, use it. If not, use Ottawa defaults.
- Location only acquired when user clicks the "Use My Location" button
- No coordinates in source code that trace to any individual
- localStorage is local-only, never transmitted except to Open-Meteo (weather) and BigDataCloud (reverse geocoding)

### Location Feeds Other Tools

- Provincial Intel: default province selection from detected location (via BigDataCloud `principalSubdivision`)
- Field Kit tools: pre-populate lat/lon from detected location
- If no location detected, all default to Ottawa

---

## Section 4: DD/DMS Input for MagPanel & ScaleCalc

### Current State

- CoordConverter already has DD/DMS toggle with bidirectional sync
- MagPanel and ScaleCalc only accept decimal degrees
- All three tools have independent lat/lon inputs

### Changes

**MagPanel:**
- Add DD/DMS segmented toggle (same style as CoordConverter)
- DMS mode: Degrees, Minutes, Seconds fields with N/S and E/W toggle buttons
- Default coordinates: user's detected location, falling back to Ottawa

**ScaleCalc:**
- Same DD/DMS toggle added
- Same default location behaviour

**Shared location initialization:**
- On first load, all tools (CoordConverter, ScaleCalc, MagPanel) initialize from detected position
- Each tool's inputs remain independent after initialization (editing one does NOT update others)
- If no location detected, all default to Ottawa (45.4215, -75.6972)

**No other changes** to MagPanel or ScaleCalc computation logic.

---

## Section 5: Link Descriptors

### Current State

Links are `{n: "name", u: "url"}` — no context for unfamiliar users.

### Changes

**Add a `d` (descriptor) field to every link** across all tabs: Flight Ops, Geodesy, Spatial Ops, Recon & Sensing, Regs & Standards.

```javascript
// Before
{n: "PDAL", u: "https://pdal.io/"}

// After
{n: "PDAL", d: "Point Data Abstraction Library — translating, filtering, and processing point cloud data", u: "https://pdal.io/"}
```

**Descriptor source:** Pull from each service's own website description/tagline. Trim to one line. Do not editorialize.

**Display:** Link name on top (current size), descriptor below in smaller dim text (`fontSize: 10`, `color: B.textDim`). Consistent across all link sections.

**Provincial Intel** links get descriptors as part of their data structure (Section 2).

---

## Section 6: Color & Theme + Mission Brief

### Color Palette

Replace per-section rainbow colors with a cohesive Slytherin-derived palette. Green, silver, black foundation with controlled accent use.

**Dark Mode:**

| Role | Color | Use |
|---|---|---|
| Primary | `#00dd66` bright green | Active states, highlights, CTAs |
| Primary Dark | `#00aa55` | Headers, hover states |
| Secondary | `#a0aec0` silver | Labels, secondary info |
| Gold | `#d4a017` | Warnings, paid indicators, space weather |
| Steel | `#3b82f6` steel blue | Links, informational elements |
| Danger | `#ef4444` red | Alerts only (space weather Kp 5+, NOTAMs) |
| Background | `#0a0a0e` | Page background |
| Surface | `#141418` | Card backgrounds |
| Text | `#c8ccd4` | Primary text |
| Text Mid | `#707888` | Secondary text |
| Text Dim | `#555d6e` | Tertiary text, descriptors |

**Light Mode:**

All colors must pass WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text) against their background. Complete light mode palette:

| Role | Color | Use |
|---|---|---|
| Primary | `#007a3d` dark green | Active states, highlights |
| Primary Bright | `#009944` | Hover states |
| Secondary | `#4a5568` | Labels, secondary info |
| Gold | `#b8860b` | Warnings, paid indicators |
| Steel | `#2563eb` darker blue | Links (must contrast on white) |
| Danger | `#dc2626` | Alerts |
| Background | `#f0f2f5` | Page background |
| Surface | `#ffffff` | Card backgrounds |
| Text | `#1a202c` | Primary text |
| Text Mid | `#4a5568` | Secondary text |
| Text Dim | `#718096` | Tertiary text, descriptors |

**Section accent colors eliminated.** All `section.color` references in `LinkCard` replaced with primary green. Link sections no longer each have a unique color. Instead:
- Section headers use primary green
- Link hover uses primary green tint
- Section icons provide visual differentiation (already distinct per tab)
- Red reserved for genuine alerts (space weather, NOTAMs)
- Gold reserved for warnings and paid indicators

### Station Card Colors

All 9 station cards use the same color scheme:
- Border/accent: primary green
- Icon: tab's emoji (provides visual variety without color chaos)
- Hover: green tint on background

### Mission Brief (About Page)

Update copy to reflect:
- Expanded Canadian coverage (all provinces and territories)
- New tab names and purposes
- Command centre identity
- Data sources (NOAA SWPC, Open-Meteo, WMM2025, BigDataCloud)
- Privacy statement: no tracking, no analytics, geolocation opt-in only
- Keep it concise — what it is, who it's for, what powers it

---

## Implementation Order

These are independent sub-projects. Each gets its own implementation plan:

1. **Tab restructure + link split + station cards** — foundation everything else sits on
2. **Provincial Intel** — new tab with 13 jurisdictions, 10 categories
3. **Link descriptors** — add `d` field to all links, pull from service websites
4. **Weather widget privacy** — remove PG defaults, add geolocation button, opt-in only
5. **DD/DMS for MagPanel & ScaleCalc** — input toggles + location initialization
6. **Color palette + Mission Brief** — theme consolidation, about page copy

**Dependency note:** Provincial Intel (step 2) defaults to BC until the geolocation refactor (step 4) is complete. After step 4, province auto-detection is wired up using BigDataCloud's `principalSubdivision` field from the reverse geocode response.

---

## Testing

- All existing 189 tests (in `src/geo.test.js`) must continue to pass
- New tests for:
  - Province selector state management
  - Geolocation opt-in flow (mock navigator.geolocation)
  - DD/DMS toggle on MagPanel and ScaleCalc
  - Location initialization across tools
  - Light mode contrast verification (manual)
- Visual verification on mobile (375px) and desktop (1280px)
- Build should remain under 300 KB JS bundle (current: 226 KB; provincial data adds ~20 KB)
