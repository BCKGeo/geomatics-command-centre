# Content Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kill the Regs & Standards tab, rename Provincial Intel to Jurisdictions, expand all jurisdictions with professional bodies and legislation, add Federal/National entry with Indigenous survey resources, expand Codex from 64 to ~116 terms, and rewrite Mission Brief.

**Architecture:** Data-heavy content overhaul. Most changes are in data files (provinces.js, glossary.js, sections.js) with minimal component changes. The Regs tab is removed, its route deleted, and the Provincial Intel tab renamed to Jurisdictions with a new /jurisdictions route. The ProvIntel component is reused as-is.

**Tech Stack:** React 18, Vite, inline styles via ThemeContext (NOT Tailwind), data-driven components.

**Spec:** `docs/superpowers/specs/2026-04-05-content-overhaul-design.md`

---

### Task 1: Remove Regs & Standards tab, rename Provincial Intel to Jurisdictions

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/data/sections.js`
- Delete: `src/components/pages/Regs.jsx`

- [ ] **Step 1: Update NAV array in App.jsx**

Remove the Regs & Standards entry and rename Provincial Intel to Jurisdictions. The NAV array is at the top of App.jsx (~line 20-31).

Remove this entry:
```js
{ path: "/regs", label: "Regs & Standards", icon: "\uD83D\uDCDC" },
```

Change this entry:
```js
// FROM:
{ path: "/provincial", label: "Provincial Intel", icon: "\uD83C\uDFDB\uFE0F" },
// TO:
{ path: "/jurisdictions", label: "Jurisdictions", icon: "\uD83C\uDFDB\uFE0F" },
```

- [ ] **Step 2: Update Routes in App.jsx**

In the `<Routes>` block (~line 201-213):

Remove:
```jsx
<Route path="/regs" element={<Regs />} />
```

Change:
```jsx
// FROM:
<Route path="/provincial" element={<Provincial />} />
// TO:
<Route path="/jurisdictions" element={<Provincial />} />
```

- [ ] **Step 3: Remove Regs lazy import in App.jsx**

Remove (~line 15):
```js
const Regs = lazy(() => import("./components/pages/Regs.jsx").then(m => ({ default: m.Regs })));
```

- [ ] **Step 4: Remove "Regs & Standards" section from sections.js**

In `src/data/sections.js`, find and remove the entire section object with `title:"Regs & Standards"` (or similar). This is the last section in the SECTIONS array. Remove the entire object including all its links.

- [ ] **Step 5: Delete Regs.jsx**

```bash
rm src/components/pages/Regs.jsx
```

- [ ] **Step 6: Verify build**

```bash
npm run build && npm test
```

Expected: Clean build, 241 tests pass, no route to /regs.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: remove Regs tab, rename Provincial Intel to Jurisdictions"
```

---

### Task 2: Add Federal/National entry to provinces.js

**Files:**
- Modify: `src/data/provinces.js`

- [ ] **Step 1: Add Federal/National (CA) as first entry in PROVINCES array**

Insert at position 0 of the PROVINCES array (before BC). Follow the exact same data structure as existing provinces. The entry should have:

```js
{
  id: "ca",
  abbr: "CA",
  name: "Federal / National",
  categories: [
    {
      category: "Professional Bodies",
      links: [
        { n: "ACLS", d: "Association of Canada Lands Surveyors", u: "https://www.acls-aatc.ca/" },
        { n: "CBEPS", d: "Canadian Board of Examiners for Professional Surveyors", u: "https://cbeps-cceag.ca/" },
        { n: "Professional Surveyors Canada", d: "National advocacy for the surveying profession", u: "https://psc-gpc.ca/" },
        { n: "CIG", d: "Canadian Institute of Geomatics", u: "https://www.cig-acsg.ca/" },
        { n: "Engineers Canada", d: "National organization of engineering regulators", u: "https://engineerscanada.ca/" },
        { n: "ASPRS", d: "American Society for Photogrammetry and Remote Sensing", u: "https://www.asprs.org/" },
        { n: "GoGeomatics", d: "Canada's geomatics community and career hub", u: "https://gogeomatics.ca/" },
      ]
    },
    {
      category: "NRCan & Geodetic Services",
      links: [
        { n: "Canadian Geodetic Survey (CSRS)", d: "Canadian Spatial Reference System", u: "https://www.nrcan.gc.ca/maps-tools-and-publications/tools/geodetic-reference-systems/canadian-spatial-reference-system-csrs/9052" },
        { n: "CSRS-PPP Service", d: "Precise Point Positioning online processing", u: "https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/ppp.php" },
        { n: "TRX Coordinate Transform", d: "Online datum and projection transformation tool", u: "https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/trx.php" },
        { n: "GPS-H Geoid Tool", d: "Compute geoid undulation using CGG2013 or CGG2023", u: "https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/gpsh.php" },
        { n: "GeoBase / GeoGratis", d: "Federal geospatial data and tools", u: "https://natural-resources.canada.ca/science-data/data-analysis/geospatial-data-tools-services" },
      ]
    },
    {
      category: "RPAS / Aviation",
      links: [
        { n: "Transport Canada Drone Safety", d: "Federal RPAS regulations and guidance", u: "https://tc.canada.ca/en/aviation/drone-safety" },
        { n: "NAV CANADA Drone Portal", d: "Request authorization near controlled airspace", u: "https://www.navcanada.ca/en/flight-planning/drone-flight-planning.aspx" },
        { n: "CARs Part IX", d: "Canadian Aviation Regulations for RPAS", u: "https://laws-lois.justice.gc.ca/eng/regulations/sor-96-433/page-112.html" },
      ]
    },
    {
      category: "Standards",
      links: [
        { n: "CSA Group", d: "Canadian standards development organization", u: "https://www.csagroup.org/" },
        { n: "Standards Council of Canada", d: "Canada's representative to ISO and IEC", u: "https://www.scc.ca/" },
        { n: "ISO TC 211", d: "Geographic Information/Geomatics standards", u: "https://www.isotc211.org/" },
      ]
    },
    {
      category: "Canada Lands & Indigenous Survey",
      links: [
        { n: "CLSR Search", d: "Canada Lands Survey Records search", u: "https://clss.nrcan.gc.ca/clsr-satc/" },
        { n: "Surveyor General Branch", d: "Federal authority for Canada Lands surveys", u: "https://natural-resources.canada.ca/maps-tools-publications/maps/boundaries-land-surveys" },
        { n: "First Nations Land Management Resource Centre", d: "Resources for surveys under land codes", u: "https://labrc.com/" },
        { n: "Surveying First Nation Lands (Indian Act)", d: "NRCan guide for Indian Act reserve surveys", u: "https://natural-resources.canada.ca/maps-tools-publications/maps/boundaries-land-surveys/surveying-first-nation-lands-managed-under-indian-act" },
        { n: "Surveying First Nation Lands (Land Code)", d: "NRCan guide for FAFNLM land code surveys", u: "https://natural-resources.canada.ca/maps-tools-publications/maps/boundaries-land-surveys/surveying-first-nation-lands-managed-under-land-code" },
      ]
    },
    {
      category: "Legislation",
      links: [
        { n: "Canada Lands Surveyors Act", d: "SC 1998, c. 14", u: "https://laws-lois.justice.gc.ca/eng/acts/l-5.8/" },
        { n: "Canada Lands Surveys Act", d: "RSC 1985, c. L-6", u: "https://laws-lois.justice.gc.ca/eng/acts/l-6/" },
        { n: "Canadian Aviation Regulations Part IX", d: "RPAS regulations", u: "https://laws-lois.justice.gc.ca/eng/regulations/sor-96-433/page-112.html" },
      ]
    },
  ]
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/data/provinces.js && git commit -m "feat: add Federal/National entry to Jurisdictions"
```

---

### Task 3: Add Professional Bodies and Legislation to all provinces

**Files:**
- Modify: `src/data/provinces.js`

- [ ] **Step 1: Add Professional Bodies category to each province**

For each of the 13 provinces/territories, add a "Professional Bodies" category as the FIRST category in their `categories` array (so it appears at the top). Also add a "Legislation" category as the LAST category. Use the data from the spec (Section 2, Provincial Professional Bodies tables).

The links follow the same `{ n, d, u }` pattern. Example for BC:

```js
// Add as FIRST category:
{
  category: "Professional Bodies",
  links: [
    { n: "ABCLS", d: "Association of British Columbia Land Surveyors", u: "https://www.abcls.ca/" },
    { n: "EGBC", d: "Engineers and Geoscientists BC", u: "https://www.egbc.ca/" },
    { n: "ASTTBC", d: "Applied Science Technologists and Technicians of BC", u: "https://asttbc.org/" },
  ]
},

// Add as LAST category:
{
  category: "Legislation",
  links: [
    { n: "Land Surveyors Act", d: "RSBC 1996, c. 248", u: "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/96248_01" },
  ]
},
```

Repeat for ALL 13 provinces/territories using the data from the spec tables. For territories (YT, NT, NU), the Land Surveyors entry should reference ACLS with note "(federal jurisdiction)".

- [ ] **Step 2: Update ProvIntel default province**

In `src/components/pages/Provincial.jsx`, the `initialProv` is currently `"bc"`. Keep it as-is since "ca" (Federal) is the first entry but BC is a reasonable default for the user's location.

Actually, check: does the ProvIntel component default to the first item or to initialProv? If it defaults to initialProv="bc", that's fine. If it defaults to index 0, we may want to keep bc as default since that's where the user is.

- [ ] **Step 3: Verify build and manual check**

```bash
npm run build
```

Visually verify in dev server that each province shows Professional Bodies at top and Legislation at bottom.

- [ ] **Step 4: Commit**

```bash
git add src/data/provinces.js && git commit -m "feat: add professional bodies and legislation to all provinces"
```

---

### Task 4: Expand Codex glossary

**Files:**
- Modify: `src/data/glossary.js`

- [ ] **Step 1: Rename "Regs & Standards" category to "Organizations"**

In glossary.js, find the key `"Regs & Standards"` and rename it to `"Organizations"`. Keep all existing terms under it.

- [ ] **Step 2: Rename "Provincial Intel" category to "Jurisdictions"**

Find the key `"Provincial Intel"` and rename it to `"Jurisdictions"`.

- [ ] **Step 3: Add new Flight Ops terms (+5)**

Append to the `"Flight Ops"` array:

```js
{dt:"Remote Pilot Certificate",dd:"Transport Canada certification required to operate RPAS. Basic or Advanced, depending on operation type."},
{dt:"GCS",dd:"Ground Control Station. Hardware and software used to control an RPAS during flight operations."},
{dt:"C2 Link",dd:"Command and control data link between the ground control station and the RPAS."},
{dt:"AGL",dd:"Above Ground Level. Altitude reference measured from the terrain surface, standard for RPAS operations."},
{dt:"Airworthiness",dd:"Compliance status of an aircraft or RPAS with regulatory and manufacturer requirements for safe flight."},
```

- [ ] **Step 4: Add new Geodesy terms (+8)**

Append to the `"Geodesy"` array:

```js
{dt:"NRTK",dd:"Network Real-Time Kinematic. RTK corrections computed from a network of reference stations, enabling cm-level positioning without a local base."},
{dt:"VRS",dd:"Virtual Reference Station. A computed correction stream that simulates a base station near the rover's position within an RTK network."},
{dt:"NAD27",dd:"North American Datum of 1927. Predecessor to NAD83, based on the Clarke 1866 ellipsoid. Still found in historical survey records."},
{dt:"WGS84",dd:"World Geodetic System 1984. Global reference frame used by GPS. Practically coincident with ITRF/NAD83(CSRS) at metre level."},
{dt:"Base Station",dd:"Fixed GNSS receiver at a known position providing real-time corrections for RTK or differential positioning."},
{dt:"Rover",dd:"Mobile GNSS receiver collecting positions relative to a base station or network correction service."},
{dt:"Static Positioning",dd:"GNSS observation mode with the receiver stationary over a point for an extended period. Used for control surveys and PPP."},
{dt:"Convergence Time",dd:"Time required for a PPP solution to reach target accuracy, typically 20-40 minutes for cm-level with dual-frequency."},
```

- [ ] **Step 5: Add new GIS terms (+8)**

Append to the `"GIS"` array:

```js
{dt:"OGC",dd:"Open Geospatial Consortium. Develops open standards (WMS, WFS, GeoPackage, etc.) for interoperable geospatial data and services."},
{dt:"Shapefile",dd:"Esri vector data format (.shp/.dbf/.shx/.prj). Widely used legacy format with 2 GB limit and 10-character field names."},
{dt:"GeoJSON",dd:"Open standard JSON-based vector format. WGS84 by convention. Ideal for web maps and APIs."},
{dt:"GeoPackage",dd:"OGC standard SQLite-based container for vector and raster data. Recommended replacement for Shapefile."},
{dt:"GeoTIFF",dd:"Raster format embedding georeferencing metadata in TIFF files. COG (Cloud-Optimized GeoTIFF) variant supports web streaming."},
{dt:"CRS",dd:"Coordinate Reference System. Defines how coordinates map to real-world positions. Includes datum, projection, and units."},
{dt:"Georeferencing",dd:"Process of assigning real-world coordinates to an image, scan, or dataset so it aligns with other spatial data."},
{dt:"False Easting / False Northing",dd:"Offset values added to projected coordinates to avoid negative numbers. UTM uses 500,000 m false easting."},
```

- [ ] **Step 6: Add new Remote Sensing terms (+10)**

Append to the `"Remote Sensing"` array:

```js
{dt:"GCP",dd:"Ground Control Point. Surveyed point with known coordinates used to georeference imagery or calibrate photogrammetric models."},
{dt:"GSD",dd:"Ground Sample Distance. Physical size of one pixel on the ground. Determined by sensor size, focal length, and flying height."},
{dt:"Orthorectification",dd:"Process of removing terrain displacement and lens distortion from imagery to produce a geometrically correct orthophoto."},
{dt:"Bundle Adjustment",dd:"Simultaneous least-squares optimization of camera positions, orientations, and 3D tie point locations in photogrammetry."},
{dt:"Point Cloud",dd:"Set of 3D points (X, Y, Z + attributes) representing surface geometry. Produced by LiDAR or photogrammetry (SfM/MVS)."},
{dt:"Intensity",dd:"LiDAR return strength. Varies with surface reflectance, scan angle, and range. Used for surface material classification."},
{dt:"Classification (LiDAR)",dd:"Assigning each point in a point cloud to a category (ground, vegetation, building, etc.) per the ASPRS LAS standard."},
{dt:"Swath",dd:"Strip of terrain covered by a single pass of an airborne sensor. Swath width depends on flying height and sensor FOV."},
{dt:"Mosaic",dd:"Composite image assembled from multiple overlapping frames, colour-balanced and seamline-adjusted for visual continuity."},
{dt:"Spatial Resolution",dd:"Physical ground area represented by a single pixel or measurement. Finer resolution means more detail but larger data volumes."},
```

- [ ] **Step 7: Add new Jurisdictions terms (+3)**

Append to the `"Jurisdictions"` array (was "Provincial Intel"):

```js
{dt:"CLSR",dd:"Canada Lands Survey Records. Federal registry of all official surveys on Canada Lands (reserves, parks, territories, offshore)."},
{dt:"FAFNLM",dd:"Framework Agreement on First Nation Land Management. Enables First Nations to manage reserve lands under their own land codes."},
{dt:"Surveyor General",dd:"Federal official responsible for Canada Lands surveys, plan approval, and maintenance of the CLSR."},
```

- [ ] **Step 8: Add new Survey Tools terms (+8)**

Append to the `"Survey Tools"` array:

```js
{dt:"Monument",dd:"Physical marker (brass cap, iron post, wooden stake) placed to define a survey point. Legal monuments define property boundaries."},
{dt:"Plan of Survey",dd:"Official survey document showing boundaries, dimensions, and bearings. Filed with a land registry or the CLSR."},
{dt:"Legal Description",dd:"Written description that uniquely identifies a parcel of land by lot, block, plan, or metes-and-bounds."},
{dt:"Right of Way",dd:"Legal right to pass through or use a strip of land owned by another, typically for roads, utilities, or access."},
{dt:"Easement",dd:"Legal right to use another's land for a specific purpose (e.g., drainage, utilities) without owning it."},
{dt:"Traverse",dd:"Series of connected survey lines with measured angles and distances, forming the framework of a field survey."},
{dt:"Closure",dd:"Difference between the computed and known positions at the end of a traverse or network adjustment. Expressed as a ratio (e.g., 1:10,000)."},
{dt:"RMSE",dd:"Root Mean Square Error. Standard statistical measure of positional accuracy, computed from residuals against known values."},
```

- [ ] **Step 9: Add new Organizations terms (+10)**

Append to the `"Organizations"` array (was "Regs & Standards"):

```js
{dt:"NRCan",dd:"Natural Resources Canada. Federal department responsible for geodetic infrastructure, geological surveys, and energy resources."},
{dt:"Transport Canada",dd:"Federal department regulating civil aviation, including all RPAS operations under CARs Part IX."},
{dt:"CBEPS",dd:"Canadian Board of Examiners for Professional Surveyors. Certifies academic qualifications for admission to provincial surveyor associations."},
{dt:"PSC",dd:"Professional Surveyors Canada. National organization advocating for the surveying profession across all provinces and territories."},
{dt:"Engineers Canada",dd:"National organization of the 12 provincial and territorial engineering regulators. Facilitates mobility and accreditation."},
{dt:"NAV CANADA",dd:"Private corporation operating Canada's civil air navigation system, including airspace management and NOTAMs."},
{dt:"ISPRS",dd:"International Society for Photogrammetry and Remote Sensing. Global professional organization for imaging and geospatial sciences."},
{dt:"ISO TC 211",dd:"ISO Technical Committee 211: Geographic Information/Geomatics. Develops the ISO 19100 series of geospatial standards."},
{dt:"AOLS",dd:"Association of Ontario Land Surveyors. Regulatory body for licensed Ontario Land Surveyors (OLS)."},
{dt:"OAGQ",dd:"Ordre des arpenteurs-geometres du Quebec. Regulatory body for licensed land surveyors in Quebec."},
```

- [ ] **Step 10: Verify build and term count**

```bash
npm run build && npm test
```

Open the Codex tab in dev and verify ~116 terms appear, search works, and category filters show the renamed categories.

- [ ] **Step 11: Commit**

```bash
git add src/data/glossary.js && git commit -m "feat: expand Codex from 64 to 116 terms, rename categories"
```

---

### Task 5: Rewrite Mission Brief

**Files:**
- Modify: `src/components/pages/MissionBrief.jsx`

- [ ] **Step 1: Rewrite MissionBrief.jsx content**

Replace the entire content of MissionBrief.jsx with a rewrite following the spec's Section 4 structure. The component should use the same styling patterns (cardStyle, insetStyle, B theme tokens) as the current version.

Content sections:
1. **What This Is** - "A geomatics operations dashboard built by a working professional, for working professionals." Mention 18+ years experience, consolidating tools/feeds/references, no personal name.
2. **Why It Exists** - Space weather affects GNSS, weather affects field schedules, mag dec matters, portals scattered across 13 jurisdictions, RPAS regs change constantly. One place, zero tracking.
3. **What It Covers** - List the 9 tabs with brief descriptions. Update to reflect the new tab structure (no Regs, Jurisdictions instead of Provincial Intel).
4. **Data Sources** - NOAA SWPC, Open-Meteo, WMM2025, BigDataCloud (keep existing links).
5. **Privacy** - Zero tracking, no cookies, no analytics, no accounts. Client-side only.
6. **Built With** - React, Vite, Cloudflare Pages, open APIs, no backend.

Style rules: Canadian spelling. No personal identifiers. No marketing fluff. BCKGeo is the brand.

Read the existing MissionBrief.jsx first to understand the styling patterns, then rewrite.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/MissionBrief.jsx && git commit -m "feat: rewrite Mission Brief - anonymous practitioner tone"
```

---

### Task 6: Final verification

- [ ] **Step 1: Full build and test**

```bash
npm run build && npm test
```

- [ ] **Step 2: Manual verification checklist**

Start the dev server and check:

1. Nav shows 9 tabs (no Regs & Standards)
2. Clicking "Jurisdictions" opens the tab
3. Federal/National (CA) appears first in the jurisdiction selector
4. CA shows all 6 categories (Professional Bodies, NRCan, RPAS, Standards, Canada Lands, Legislation)
5. BC shows Professional Bodies at top and Legislation at bottom
6. All 13 provinces still render correctly with existing data
7. Codex shows ~116 terms
8. Codex search finds new terms (try "NRTK", "Monument", "GeoPackage")
9. Codex category filter shows "Organizations" and "Jurisdictions" (renamed)
10. Mission Brief reads clean, no personal names
11. Navigating to /regs returns 404 or redirects (no crash)
12. Mobile responsive on all new content

- [ ] **Step 3: Push**

```bash
git push origin main
```
