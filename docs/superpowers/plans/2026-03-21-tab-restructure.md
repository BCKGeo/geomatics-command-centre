# Tab Restructure + Link Split + Station Cards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the dashboard from 9 tabs to 11 tabs with renamed navigation, split "GIS & Data" into Spatial Ops and Recon & Sensing, add Provincial Intel placeholder, update station cards to 3x3 grid, and update Codex (glossary) categories to match.

**Architecture:** All changes are in `src/App.jsx` (single-file architecture). The SECTIONS data array is restructured, tab definitions are updated, station cards are rewritten, and glossary categories are renamed. No new files created. Provincial Intel data will be added in a follow-up plan — this plan only creates the empty tab with a "Coming soon" placeholder.

**Tech Stack:** React 18, Vite, inline styles, no external CSS

**Spec:** `docs/superpowers/specs/2026-03-21-dashboard-overhaul-design.md` — Section 1

---

### Task 1: Update Tab Definitions

**Files:**
- Modify: `src/App.jsx` — the tab button array (line 968)

- [ ] **Step 1: Replace the tab button array**

Find the array at line 968 (inside the `.map(t=>` call):
```javascript
{[{id:"command",l:"Command Centre",ic:"\u26A1"},{id:"flight",l:"Flight Ops",ic:"\u2708\uFE0F"},{id:"geodesy",l:"Geodesy",ic:"\uD83C\uDF10"},{id:"gis",l:"GIS & Data",ic:"\uD83D\uDEF0\uFE0F"},{id:"fieldtools",l:"Field Tools",ic:"\uD83D\uDD27"},{id:"calculator",l:"Calculator",ic:"\uD83E\uDDEE"},{id:"standards",l:"Standards",ic:"\uD83D\uDCD0"},{id:"glossary",l:"Glossary",ic:"\uD83D\uDCDA"},{id:"about",l:"About",ic:"\u24D8"}]
```

Replace with:
```javascript
{[{id:"command",l:"Command Centre",ic:"\uD83D\uDDA5\uFE0F"},{id:"flight",l:"Flight Ops",ic:"\u2708\uFE0F"},{id:"geodesy",l:"Geodesy",ic:"\uD83C\uDF0D"},{id:"spatial",l:"Spatial Ops",ic:"\uD83D\uDDFA\uFE0F"},{id:"recon",l:"Recon & Sensing",ic:"\uD83D\uDC41\uFE0F"},{id:"provincial",l:"Provincial Intel",ic:"\uD83C\uDFDB\uFE0F"},{id:"fieldkit",l:"Field Kit",ic:"\u2699\uFE0F"},{id:"calcs",l:"Quick Calcs",ic:"\u2797"},{id:"regs",l:"Regs & Standards",ic:"\uD83D\uDCDC"},{id:"codex",l:"Codex",ic:"\uD83D\uDD0E"},{id:"brief",l:"Mission Brief",ic:"\uD83D\uDCDD"}]
```

- [ ] **Step 2: Update all tab ID references**

Search for every `tab===` comparison and `setTab(` call in App.jsx. Update these mappings:
- `"gis"` → `"spatial"` (for the existing GIS content, temporarily — will be split in Task 5)
- `"fieldtools"` → `"fieldkit"`
- `"calculator"` → `"calcs"`
- `"standards"` → `"regs"`
- `"glossary"` → `"codex"`
- `"about"` → `"brief"`

Specifically, find and update these sections:
- `{tab==="gis"&&(` → `{tab==="spatial"&&(`
- `{tab==="fieldtools"&&(` → `{tab==="fieldkit"&&(`
- `{tab==="calculator"&&(` → `{tab==="calcs"&&(`
- `{tab==="standards"&&(` → `{tab==="regs"&&(`
- `{tab==="glossary"&&(` → `{tab==="codex"&&(`
- `{tab==="about"&&(` → `{tab==="brief"&&(`

Also update any `setTab("gis")`, `setTab("fieldtools")`, etc. calls (including in station cards — but those are updated in Task 3).

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: rename tabs — Field Kit, Quick Calcs, Codex, Mission Brief, Spatial Ops, Regs & Standards"
```

---

### Task 2: Restructure SECTIONS Data

**Depends on:** Task 1 (tab IDs must already be renamed — e.g. `tab==="spatial"` not `tab==="gis"`)

**Files:**
- Modify: `src/App.jsx` — the SECTIONS array (lines 122-197)

- [ ] **Step 1: Restructure the SECTIONS array**

Replace the entire SECTIONS array (lines 122-197) with the new structure. Key changes:
- "Transport Canada - RPAS" stays, renamed to "Transport Canada — RPAS"
- "NOTAMs & Airspace" stays (Flight Ops renders both)
- "NRCan - Geodetic & Geomatics" stays
- "GNSS & Coordinate Tools" stays but remove the NavDrone duplicate (already in Transport Canada section as "NAV Drone") and move AirData to Flight Ops section
- "British Columbia - Provincial" removed entirely (moves to Provincial Intel in future plan)
- "GIS & Remote Sensing" split into "Spatial Ops" and "Recon & Sensing"
- "Professional & Standards" renamed to "Regs & Standards"

New SECTIONS array:
```javascript
const SECTIONS = [
  { title:"Transport Canada — RPAS", color:"#00dd66", icon:"✈️", links:[
    {n:"CARs Part IX (Full Regulations)",u:"https://laws-lois.justice.gc.ca/eng/regulations/sor-96-433/page-112.html"},
    {n:"Flying Your Drone Safely & Legally",u:"https://tc.canada.ca/en/aviation/drone-safety/learn-rules-you-fly-your-drone/flying-your-drone-safely-legally"},
    {n:"2025 Regulation Changes Summary",u:"https://tc.canada.ca/en/aviation/drone-safety/2025-summary-changes-canada-drone-regulations"},
    {n:"Drone Management Portal",u:"https://tc.canada.ca/en/aviation/drone-safety/drone-management-portal"},
    {n:"RPAS Safety Assurance (Std 922)",u:"https://tc.canada.ca/en/corporate-services/acts-regulations/list-regulations/canadian-aviation-regulations-sor-96-433/standards/standard-922-rpas-safety-assurance"},
    {n:"SFOC Application Guide",u:"https://tc.canada.ca/en/aviation/drone-safety/drone-pilot-licensing/get-permission-special-drone-operations"},
    {n:"NAV Drone (NAVCANADA)",u:"https://www.navcanada.ca/en/flight-planning/drone-flight-planning.aspx"},
    {n:"Drone Site Selection Tool",u:"https://nrc.canada.ca/en/drone-tool/"},
    {n:"AirData (Flight Logging)",u:"https://app.airdata.com/"},
  ]},
  { title:"NOTAMs & Airspace", color:"#00dd66", icon:"🚨", links:[
    {n:"CFPS NOTAMs (NAV CANADA)",u:"https://plan.navcanada.ca/wxrecall/"},
    {n:"NAV CANADA Flight Planning",u:"https://plan.navcanada.ca/"},
    {n:"Aviation Weather (AWWS)",u:"https://plan.navcanada.ca/wxrecall/"},
    {n:"Designated Airspace Handbook",u:"https://www.navcanada.ca/en/aeronautical-information/operational-guides.aspx"},
    {n:"Canada Flight Supplement",u:"https://products.navcanada.ca/shop-vfr/Canada-Flight-Supplement/"},
    {n:"TC Airspace Classifications",u:"https://tc.canada.ca/en/aviation/publications/transport-canada-aeronautical-information-manual-tc-aim-tp-14371"},
    {n:"Aurora Forecast (NOAA)",u:"https://www.swpc.noaa.gov/products/aurora-30-minute-forecast"},
    {n:"NOAA SWPC Dashboard",u:"https://www.swpc.noaa.gov/"},
  ]},
  { title:"NRCan — Geodetic & Geomatics", color:"#00dd66", icon:"🌍", links:[
    {n:"CSRS-PPP Online Service",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/ppp.php"},
    {n:"CSRS-PPP Updates & Info",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/ppp-info.php?locale=en"},
    {n:"About CSRS",u:"https://natural-resources.canada.ca/science-data/science-research/geomatics/geodetic-reference-systems/canadian-spatial-reference-system-csrs"},
    {n:"Geodetic Reference Systems",u:"https://natural-resources.canada.ca/science-data/science-research/geomatics/geodetic-reference-systems"},
    {n:"Geodetic Tools & Desktop Apps",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/applications.php"},
    {n:"TRX Coordinate Transform",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/trx.php"},
    {n:"NRCan Mag Declination Calc",u:"https://geomag.nrcan.gc.ca/mag_fld/magdec-en.php"},
    {n:"NRCan Geomagnetism",u:"https://geomag.nrcan.gc.ca/index-en.php"},
    {n:"Space Weather Canada",u:"https://spaceweather.gc.ca/"},
    {n:"CACS Station Map",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/data-donnees/cacs-scca.php"},
    {n:"GPS-H (Geoid Height)",u:"https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/gpsh.php"},
  ]},
  { title:"GNSS & Coordinate Tools", color:"#00dd66", icon:"📡", links:[
    {n:"GNSS Planning (Trimble)",u:"https://www.gnssplanning.com/"},
    {n:"IGS Network",u:"https://igs.org/network/"},
    {n:"UNAVCO GNSS Data",u:"https://www.unavco.org/"},
    {n:"NOAA NCEI Mag Calc",u:"https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml"},
    {n:"WMM (NOAA/BGS)",u:"https://www.ncei.noaa.gov/products/world-magnetic-model"},
    {n:"NGS Coord Converter",u:"https://www.ngs.noaa.gov/NCAT/"},
    {n:"SpaceWeatherLive",u:"https://www.spaceweatherlive.com/"},
  ]},
  { title:"Spatial Ops", color:"#00dd66", icon:"🗺️", links:[
    {n:"EPSG.io (CRS Lookup)",u:"https://epsg.io/"},
    {n:"QGIS Downloads",u:"https://qgis.org/download/"},
    {n:"Esri ArcGIS Online",u:"https://www.arcgis.com/index.html"},
    {n:"Canada Open Data Portal",u:"https://open.canada.ca/data/en/dataset"},
    {n:"GEO.ca",u:"https://geo.ca/"},
    {n:"GDAL/OGR",u:"https://gdal.org/"},
    {n:"PostGIS",u:"https://postgis.net/"},
    {n:"PROJ",u:"https://proj.org/"},
    {n:"GeoServer",u:"https://geoserver.org/"},
    {n:"MapLibre GL JS",u:"https://maplibre.org/"},
    {n:"Statistics Canada Boundaries",u:"https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/index-eng.cfm"},
    {n:"Nominatim (Geocoder)",u:"https://nominatim.org/"},
  ]},
  { title:"Recon & Sensing", color:"#00dd66", icon:"👁️", links:[
    {n:"Copernicus Data Space",u:"https://dataspace.copernicus.eu/"},
    {n:"USGS EarthExplorer",u:"https://earthexplorer.usgs.gov/"},
    {n:"OpenTopography (LiDAR)",u:"https://opentopography.org/"},
    {n:"CloudCompare",u:"https://www.danielgm.net/cc/"},
    {n:"PDAL",u:"https://pdal.io/"},
    {n:"EODMS (NRCan Satellite Imagery)",u:"https://www.eodms-sgdot.nrcan-rncan.gc.ca/"},
    {n:"Canada HRDEM (CanElevation)",u:"https://open.canada.ca/data/en/dataset/957782bf-847c-4644-a757-e383c0057995"},
    {n:"ESA SNAP (SAR Processing)",u:"https://step.esa.int/main/toolboxes/snap/"},
    {n:"Google Earth Engine",u:"https://earthengine.google.com/"},
    {n:"Sentinel Hub EO Browser",u:"https://apps.sentinel-hub.com/eo-browser/"},
    {n:"OpenDroneMap / WebODM",u:"https://opendronemap.org/"},
    {n:"LAStools",u:"https://lastools.github.io/"},
    {n:"Orfeo ToolBox",u:"https://www.orfeo-toolbox.org/"},
    {n:"Potree (Point Cloud Viewer)",u:"https://potree.github.io/"},
    {n:"NRCan Air Photo Library",u:"https://natural-resources.canada.ca/maps-tools-publications/satellite-elevation-air-photos/air-photos-library"},
  ]},
  { title:"Regs & Standards", color:"#00dd66", icon:"📜", links:[
    {n:"ASTTBC",u:"https://asttbc.org/"},{n:"ABCLS",u:"https://www.abcls.ca/"},
    {n:"ACLS",u:"https://www.acls-aatc.ca/"},{n:"GoGeomatics",u:"https://gogeomatics.ca/"},
    {n:"CIG",u:"https://www.cig-acsg.ca/"},{n:"ASPRS",u:"https://www.asprs.org/"},
    {n:"ACEC-BC",u:"https://www.acec-bc.ca/"},{n:"TAC",u:"https://www.tac-atc.ca/"},
    {n:"CSA Group",u:"https://www.csagroup.org/"},
  ]},
];
```

Note: All section colors are now `#00dd66` (primary green) — the rainbow colors are eliminated per the spec. The `LinkCard` component uses `section.color` for hover styling, so this unifies the palette.

- [ ] **Step 2: Update tab content renderers**

Update the tab content filter logic for tabs that changed:

**Flight Ops** (line ~1141-1147) — already correct, filters by "Transport Canada" and "NOTAMs"

**Geodesy** (line ~1150-1156) — already correct, filters by "NRCan" and "GNSS"

**Spatial Ops** — replace the old GIS tab content. Note: this is a single section, so use full-width layout (not 2-column grid which would leave an empty column):
```javascript
{tab==="spatial"&&(
  <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
    {SECTIONS.filter(s=>s.title==="Spatial Ops").map(s=>(
      <LinkCard key={s.title} section={s}/>
    ))}
  </div>
)}
```

**Recon & Sensing** — add new tab content (also single section, full-width):
```javascript
{tab==="recon"&&(
  <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12}}>
    {SECTIONS.filter(s=>s.title==="Recon & Sensing").map(s=>(
      <LinkCard key={s.title} section={s}/>
    ))}
  </div>
)}
```

**Regs & Standards** — update the existing Standards tab renderer. The current code at line ~1217 uses `SECTIONS.find(s=>s.title.includes("Professional"))` which will break after renaming. Update to:
```javascript
{tab==="regs"&&(
  <div style={{...cardStyle,maxWidth:580}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
      <span>📜</span>
      <h3 style={{margin:0,fontSize:13,fontWeight:700,color:B.sec}}>Regs & Standards</h3>
    </div>
    <div style={{display:"grid",gap:2}}>
      {(SECTIONS.find(s=>s.title==="Regs & Standards")?.links||[]).map(l=>(
```
This replaces both the heading text ("Professional & Standards" → "Regs & Standards"), the icon, and the filter logic.

**Mission Brief** — update the About tab heading at line ~1256:
```javascript
<h2 style={{margin:0,fontSize:14,fontWeight:700,color:B.priBr}}>Mission Brief</h2>
```
This renames "About BCKGeo" to "Mission Brief". Full content rewrite is deferred to Sub-project 6 (Color & Mission Brief).

**Provincial Intel** — add placeholder:
```javascript
{tab==="provincial"&&(
  <div style={{...cardStyle,textAlign:"center",padding:40}}>
    <span style={{fontSize:32}}>🏛️</span>
    <h2 style={{fontFamily:B.font,fontSize:14,color:B.text,margin:"12px 0 4px"}}>Provincial Intel</h2>
    <p style={{fontSize:11,color:B.textMid}}>Geospatial data portals for all 13 Canadian provinces and territories. Coming soon.</p>
  </div>
)}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Clean build. Navigate to each tab — no crashes, correct content.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: restructure SECTIONS data — split GIS into Spatial Ops + Recon & Sensing, unify colors"
```

---

### Task 3: Update Station Cards

**Files:**
- Modify: `src/App.jsx` — station cards array (lines 1112-1134)

- [ ] **Step 1: Replace station cards**

Find the station cards section (starts with `STATIONS` label, contains the `.map(s=>` array). Replace the card array and change grid to 3 columns:

Change grid from:
```javascript
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
```
To:
```javascript
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
```

Replace the card data array:
```javascript
{[
  {i:"✈️",t:"Flight Ops",d:"RPAS regs, NOTAMs, airspace",g:"flight"},
  {i:"🌍",t:"Geodesy",d:"NRCan, CSRS-PPP, GNSS",g:"geodesy"},
  {i:"🗺️",t:"Spatial Ops",d:"GIS tools, databases, CRS",g:"spatial"},
  {i:"👁️",t:"Recon & Sensing",d:"Imagery, LiDAR, photogrammetry",g:"recon"},
  {i:"🏛️",t:"Provincial Intel",d:"Open data by province",g:"provincial"},
  {i:"⚙️",t:"Field Kit",d:"Coordinates, scale factors, mag dec",g:"fieldkit"},
  {i:"➗",t:"Quick Calcs",d:"Unit, speed & temp conversions",g:"calcs"},
  {i:"📜",t:"Regs & Standards",d:"Professional orgs, regulations",g:"regs"},
  {i:"🔎",t:"Codex",d:"Terms & acronyms by domain",g:"codex"},
]
```

Remove the per-card `c` (color) property. Update the card `h3` style to use `B.priBr` instead of `s.c`:
```javascript
<h3 style={{fontFamily:B.font,fontSize:12,fontWeight:700,letterSpacing:".06em",margin:0,color:B.priBr}}>{s.t}</h3>
```

- [ ] **Step 2: Add responsive breakpoint for 3-column grid**

The station cards grid needs to collapse on mobile. Add a CSS class `cmd-stations` to the grid div and add a media query. Since the app uses inline styles, use the existing pattern from `cmd-split` and `cmd-hero`.

In the `<style>` tag inside `src/App.jsx` (line ~905, the existing `@media` rule block), append:
```css
@media(max-width:768px){
  .cmd-stations{grid-template-columns:1fr 1fr !important;}
}
@media(max-width:480px){
  .cmd-stations{grid-template-columns:1fr !important;}
}
```

Apply the className to the stations grid:
```javascript
<div className="cmd-stations" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Clean build. Command Centre shows 3x3 station card grid. Each card navigates to correct tab.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: update station cards — 3x3 grid, new names/icons, unified green accent"
```

---

### Task 4: Update Codex (Glossary) Categories

**Files:**
- Modify: `src/App.jsx` — the GLOSSARY object (lines 200-274)

- [ ] **Step 1: Replace the entire GLOSSARY object**

Replace the GLOSSARY object (lines 200-274) with the complete replacement below. Changes: `"GIS & Data"` split into `"Spatial Ops"` (EPSG, WFS/WMS, BCGW, TRIM, PID/PIN) and `"Recon & Sensing"` (LiDAR, DEM/DSM/DTM, PDAL, Sentinel-1/2, SAR, LTSA), `"Field Tools"` → `"Field Kit"`, `"Standards"` → `"Regs & Standards"`, new `"Provincial Intel"` category added.

```javascript
const GLOSSARY = {
  "Command Centre": [
    {dt:"Kp Index",dd:"Planetary geomagnetic activity index (0-9). Kp 5+ is a geomagnetic storm that degrades GNSS."},
    {dt:"Solar Wind",dd:"Stream of charged particles from the sun. High speeds (>500 km/s) can trigger geomagnetic storms."},
    {dt:"Mag BT",dd:"Interplanetary magnetic field total strength in nanotesla. Higher values correlate with storm potential."},
    {dt:"10.7cm Flux",dd:"Solar radio flux at 10.7 cm wavelength (F10.7), measured in solar flux units. Proxy for solar activity."},
    {dt:"G/S/R Scales",dd:"NOAA space weather scales: Geomagnetic (G0-G5), Solar Radiation (S0-S5), Radio Blackout (R0-R5)."},
    {dt:"Declination",dd:"Angle between true north and magnetic north at a given location. Essential for compass/bearing corrections."},
    {dt:"Grid Convergence",dd:"Angle between true north and grid north on a map projection (e.g. UTM). Varies with longitude from central meridian."},
    {dt:"Dip Angle",dd:"Magnetic inclination: angle of the Earth's magnetic field relative to horizontal. ~73° in northern BC."},
    {dt:"Zulu Time",dd:"UTC (Coordinated Universal Time). Standard time reference in aviation and military operations."},
  ],
  "Flight Ops": [
    {dt:"RPAS",dd:"Remotely Piloted Aircraft System. The Canadian regulatory term for drones, including the aircraft, control station, and C2 link."},
    {dt:"CARs Part IX",dd:"Canadian Aviation Regulations Part IX, governing RPAS operations in Canadian airspace."},
    {dt:"NOTAM",dd:"Notice to Airmen. Advisories about hazards, restrictions, or changes to airspace/facilities."},
    {dt:"SFOC",dd:"Special Flight Operations Certificate. Required for RPAS operations beyond standard rules (e.g. BVLOS, over people)."},
    {dt:"BVLOS",dd:"Beyond Visual Line of Sight. Drone operations where the pilot cannot see the aircraft directly."},
    {dt:"Class D Airspace",dd:"Controlled airspace around smaller airports (like CYXS). Requires ATC contact and authorization for RPAS."},
    {dt:"NAV Drone",dd:"NAV CANADA's drone airspace authorization portal for operations near controlled airspace."},
    {dt:"METAR / TAF",dd:"Aviation weather reports (current observations) and Terminal Aerodrome Forecasts (predicted conditions)."},
    {dt:"SIGMET",dd:"Significant Meteorological Information. Warnings for severe weather hazards to aviation."},
    {dt:"CYA / CYR",dd:"Canadian advisory (CYA) and restricted (CYR) airspace designations."},
  ],
  "Geodesy": [
    {dt:"CSRS-PPP",dd:"Canadian Spatial Reference System Precise Point Positioning. NRCan's free GNSS post-processing service."},
    {dt:"PPP-AR",dd:"Precise Point Positioning with Ambiguity Resolution. Resolves carrier phase ambiguities for cm-level accuracy."},
    {dt:"NAD83(CSRS)",dd:"North American Datum 1983, Canadian Spatial Reference System realization. Canada's official geodetic datum."},
    {dt:"ITRF",dd:"International Terrestrial Reference Frame. The global standard geodetic reference frame, updated periodically."},
    {dt:"Epoch",dd:"A specific point in time to which coordinates are referenced. Needed because tectonic plates move ~2 cm/yr."},
    {dt:"TRX",dd:"NRCan's online coordinate transformation tool for converting between datums, epochs, and projections."},
    {dt:"Geoid Height",dd:"Separation between the geoid (mean sea level surface) and the ellipsoid. Needed to convert ellipsoidal to orthometric heights."},
    {dt:"CGG2023",dd:"Canadian Gravimetric Geoid 2023. Latest NRCan geoid model for height conversions in Canada."},
    {dt:"CACS",dd:"Canadian Active Control System. Network of permanent GNSS tracking stations operated by NRCan."},
    {dt:"GNSS",dd:"Global Navigation Satellite Systems. Umbrella term for GPS (US), GLONASS (RU), Galileo (EU), BeiDou (CN)."},
    {dt:"DOP",dd:"Dilution of Precision. Geometric quality metric for satellite constellation. Lower is better (PDOP <3 ideal)."},
    {dt:"RTK",dd:"Real-Time Kinematic. GNSS technique using a base station to achieve cm-level positioning in real time."},
    {dt:"RINEX",dd:"Receiver Independent Exchange Format. Standard file format for GNSS observation and navigation data."},
    {dt:"IGS",dd:"International GNSS Service. Global network providing precise satellite orbits, clocks, and station coordinates."},
  ],
  "Spatial Ops": [
    {dt:"EPSG",dd:"European Petroleum Survey Group codes. Numeric identifiers for coordinate reference systems (e.g. EPSG:26910 = UTM 10N NAD83)."},
    {dt:"WFS / WMS",dd:"Web Feature Service / Web Map Service. OGC standards for serving vector features and rendered map tiles over HTTP."},
    {dt:"BCGW",dd:"BC Geographic Warehouse. Provincial spatial data repository accessible via WFS/WMS and direct download."},
    {dt:"TRIM",dd:"Terrain Resource Information Management. BC's 1:20,000 base mapping program (contours, hydro, roads)."},
    {dt:"PID / PIN",dd:"Parcel Identifier / Parcel Identification Number. Unique identifiers for land parcels in BC's cadastral system."},
  ],
  "Recon & Sensing": [
    {dt:"LiDAR",dd:"Light Detection and Ranging. Laser-based remote sensing for high-density 3D point cloud capture."},
    {dt:"DEM / DSM / DTM",dd:"Digital Elevation/Surface/Terrain Model. Raster representations of ground (DTM), surface (DSM), or general elevation (DEM)."},
    {dt:"PDAL",dd:"Point Data Abstraction Library. Open-source C++ library for point cloud processing pipelines."},
    {dt:"Sentinel-1/2",dd:"ESA Copernicus satellites. S-1 is C-band SAR (all-weather), S-2 is multispectral optical (13 bands, 10m)."},
    {dt:"SAR",dd:"Synthetic Aperture Radar. Active microwave sensor that works through clouds, rain, and at night."},
    {dt:"LTSA",dd:"Land Title and Survey Authority of BC. Manages land title and survey systems for the province."},
  ],
  "Provincial Intel": [
    {dt:"SDI",dd:"Spatial Data Infrastructure. Framework of policies, standards, and technology for sharing geospatial data across jurisdictions."},
    {dt:"Cadastre",dd:"Official register of land parcels. Provincial cadastral systems map parcel boundaries, ownership, and legal descriptions."},
    {dt:"OGL",dd:"Open Government Licence. Licence under which most provincial open data is published. Permits free use with attribution."},
  ],
  "Field Kit": [
    {dt:"WMM2025",dd:"World Magnetic Model 2025. Current-epoch global geomagnetic model, valid 2025-2030. Joint NOAA/BGS product."},
    {dt:"Inclination",dd:"Magnetic dip angle. The angle between the magnetic field vector and the horizontal plane at a location."},
    {dt:"Total Field",dd:"Total intensity of Earth's magnetic field at a location, measured in nanotesla (nT). ~58,000 nT in northern BC."},
    {dt:"UTM",dd:"Universal Transverse Mercator. Global map projection system divided into 60 zones, each 6° wide."},
    {dt:"MTM",dd:"Modified Transverse Mercator. Canadian 3°-wide projection zones used in some provincial systems."},
    {dt:"Grid Scale Factor",dd:"Ratio of distance on the projection grid to distance on the ellipsoid. Varies with distance from central meridian."},
    {dt:"Elevation Factor",dd:"Ratio correcting for height above the ellipsoid. Ground distances are slightly longer than ellipsoid distances."},
    {dt:"CSF",dd:"Combined Scale Factor. Product of grid scale factor and elevation factor. Applied to convert ground to grid distances."},
    {dt:"DD / DMS",dd:"Decimal Degrees / Degrees Minutes Seconds. Two common formats for expressing geographic coordinates."},
  ],
  "Regs & Standards": [
    {dt:"ASTTBC",dd:"Applied Science Technologists and Technicians of BC. Regulatory body for AScT, CTech, and RFT designations."},
    {dt:"AScT",dd:"Applied Science Technologist. Professional designation granted by ASTTBC for engineering/geomatics technologists."},
    {dt:"ABCLS",dd:"Association of British Columbia Land Surveyors. Regulatory body for BCLS (licensed land surveyors) in BC."},
    {dt:"ACLS",dd:"Association of Canada Lands Surveyors. Federal regulatory body for surveys on Canada Lands (Indigenous, federal, offshore)."},
    {dt:"CIG",dd:"Canadian Institute of Geomatics. Professional association for geomatics in Canada, publishes Geomatica journal."},
    {dt:"ASPRS",dd:"American Society for Photogrammetry and Remote Sensing. International professional org, publishes PE&RS journal."},
    {dt:"CSA Group",dd:"Canadian Standards Association. Develops national standards for engineering, construction, and technology."},
    {dt:"TAC",dd:"Transportation Association of Canada. Develops guidelines and standards for road/transportation infrastructure."},
  ],
};
```

- [ ] **Step 2: Update glossary rendering if needed**

Check the glossary/codex tab renderer — it iterates over `Object.entries(GLOSSARY)`. Since we only renamed keys, no rendering changes needed. Verify the tab content section uses `tab==="codex"` (updated in Task 1).

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Clean build. Codex tab shows updated categories with correct terms.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: update Codex categories — split GIS terms, rename Field Kit + Regs, add Provincial Intel"
```

---

### Task 5: Final Verification & Link Validation

**Files:**
- No code changes — validation only

- [ ] **Step 1: Run test suite**

Run: `npx vitest run --reporter=verbose`
Expected: All 189 tests pass

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Clean build under 250 KB JS bundle

- [ ] **Step 3: Start dev server and verify every tab**

Run: `npm run dev`

Check each tab loads without errors:
1. Command Centre — 3x3 station cards with new names/icons
2. Flight Ops — Transport Canada + NOTAMs sections
3. Geodesy — NRCan + GNSS sections
4. Spatial Ops — 12 links (EPSG.io through Nominatim)
5. Recon & Sensing — 15 links (Copernicus through NRCan Air Photo Library)
6. Provincial Intel — placeholder "Coming soon" message
7. Field Kit — Coordinate converter, scale calc, mag dec (unchanged)
8. Quick Calcs — Calculator panel (unchanged)
9. Regs & Standards — Professional orgs
10. Codex — Glossary with updated categories
11. Mission Brief — About page (unchanged content for now)

- [ ] **Step 4: Validate all links**

Run a link check on every URL in the SECTIONS array. Use curl to check each link returns HTTP 200 (or 301/302 redirect):

```bash
# Extract all URLs from SECTIONS and check each one
grep -oP 'u:"(https?://[^"]+)"' src/App.jsx | sed 's/u:"//;s/"//' | sort -u | while read url; do
  code=$(curl -o /dev/null -s -w "%{http_code}" -L --max-time 10 "$url")
  echo "$code $url"
done
```

Expected: All links return 200 (or 3xx redirect to valid page). Flag any 404s or timeouts for investigation.

- [ ] **Step 5: Verify station card navigation**

Click each of the 9 station cards and verify they navigate to the correct tab.

- [ ] **Step 6: Test mobile layout**

Resize to 375px width. Verify:
- Tab bar wraps without overflow
- Station cards collapse to 2-column then 1-column
- All tabs render correctly

- [ ] **Step 7: Push**

```bash
git push
```
