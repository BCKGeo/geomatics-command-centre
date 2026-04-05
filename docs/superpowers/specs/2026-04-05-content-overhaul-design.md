# Content Overhaul Design Spec

**Date:** 2026-04-05
**Scope:** Kill Regs & Standards tab, expand Jurisdictions, expand Codex, rewrite Mission Brief
**Result:** 10 tabs become 9. Jurisdictions becomes the single authoritative reference for regulatory bodies, professional associations, and geomatics data portals across all Canadian jurisdictions.

---

## Section 1: Kill Regs & Standards Tab

### Decision

Remove the "Regs & Standards" tab entirely. All regulatory and standards content migrates into an expanded Jurisdictions tab under a new "Federal / National" jurisdiction entry.

### Rationale

The Regs tab duplicates content that belongs in Jurisdictions. Federal bodies (ACLS, CBEPS, CIG, ASPRS, CSA, Engineers Canada, TAC, GoGeomatics) are cross-cutting and belong under a "Federal / National" entry alongside the 13 provincial/territorial entries.

### Changes

| File | Action |
|------|--------|
| `src/App.jsx` | Remove "Regs & Standards" from NAV array (10 tabs to 9), remove `/regs` route |
| `src/data/sections.js` | Remove "Regs & Standards" section entry |
| `src/data/provinces.js` | Absorb all federal/national bodies (see Section 2) |
| `src/data/glossary.js` | Rename "Regs & Standards" category to "Organizations" |
| `src/components/pages/Regs.jsx` | Delete file |
| `src/components/pages/Codex.jsx` | Update any hardcoded category references |
| `src/components/pages/Terms.jsx` | No change (regulatory body references stay) |

### Nav After Change (9 tabs)

1. Command Centre
2. Space Weather
3. GNSS Health
4. Mag/Dec
5. Jurisdictions
6. Survey Tools
7. Flight Ops
8. Codex
9. Mission Brief

---

## Section 2: Jurisdictions Expansion

### Goal

Every province/territory gets standardized categories populated with verified data. A new "Federal / National" entry (abbreviation: CA, position 0) holds all cross-cutting federal bodies and tools.

### Standard Category Structure (all jurisdictions)

| # | Category | Content |
|---|----------|---------|
| 1 | Professional Bodies | Land surveyor association, engineering/geoscience regulator, technologist association |
| 2 | Open Data Portal | Provincial open data hub |
| 3 | Map Viewer | Provincial web map viewer |
| 4 | Parcel / Cadastral | Parcel fabric, cadastral data |
| 5 | Base Mapping | Topographic, road network, admin boundaries |
| 6 | Imagery | Aerial/satellite imagery portals |
| 7 | LiDAR / Elevation | DEM, LiDAR data portals |
| 8 | Geodetic Control | Control monument databases, GNSS networks |
| 9 | Land Registry | Land titles, property registration |
| 10 | Geological Survey | Provincial geological survey |
| 11 | Legislation | Land Surveyors Act and relevant geomatics legislation |

### Federal / National (CA) Categories

**1. Professional Bodies**

| Organization | Abbreviation | URL |
|---|---|---|
| Association of Canada Lands Surveyors | ACLS | https://www.acls-aatc.ca/ |
| Canadian Board of Examiners for Professional Surveyors | CBEPS | https://cbeps-cceag.ca/ |
| Professional Surveyors Canada | PSC | https://psc-gpc.ca/ |
| Canadian Institute of Geomatics | CIG | https://www.cig-acsg.ca/ |
| Engineers Canada | -- | https://engineerscanada.ca/ |
| ASPRS | -- | https://www.asprs.org/ |
| GoGeomatics | -- | https://gogeomatics.ca/ |

**2. NRCan & Geodetic Services**

| Resource | URL |
|---|---|
| Canadian Geodetic Survey (CSRS) | https://www.nrcan.gc.ca/maps-tools-and-publications/tools/geodetic-reference-systems/canadian-spatial-reference-system-csrs/9052 |
| CSRS-PPP Service | https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/ppp.php |
| TRX Coordinate Transform | https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/trx.php |
| GPS-H Geoid Tool | https://webapp.csrs-scrs.nrcan-rncan.gc.ca/geod/tools-outils/gpsh.php |
| GeoBase / GeoGratis | https://natural-resources.canada.ca/science-data/data-analysis/geospatial-data-tools-services |

**3. RPAS / Aviation**

| Resource | URL |
|---|---|
| Transport Canada Drone Safety | https://tc.canada.ca/en/aviation/drone-safety |
| NAV CANADA Drone Portal | https://www.navcanada.ca/en/flight-planning/drone-flight-planning.aspx |
| Canadian Aviation Regulations Part IX | Link to CARs |

**4. Standards**

| Organization | URL |
|---|---|
| CSA Group | https://www.csagroup.org/ |
| Standards Council of Canada | https://www.scc.ca/ |
| ISO TC 211 | https://www.isotc211.org/ |

**5. Canada Lands & Indigenous Survey**

| Resource | URL |
|---|---|
| CLSR Search (Canada Lands Survey Records) | https://clss.nrcan.gc.ca/clsr-satc/ |
| Surveyor General Branch | https://natural-resources.canada.ca/maps-tools-publications/maps/boundaries-land-surveys |
| Aboriginal Lands Dataset | NRCan GeoBase |
| First Nations Land Management Resource Centre | https://labrc.com/ |
| Surveying First Nation Lands (Indian Act) | https://natural-resources.canada.ca/maps-tools-publications/maps/boundaries-land-surveys/surveying-first-nation-lands-managed-under-indian-act |
| Surveying First Nation Lands (Land Code) | https://natural-resources.canada.ca/maps-tools-publications/maps/boundaries-land-surveys/surveying-first-nation-lands-managed-under-land-code |

**6. Legislation**

| Statute | Citation |
|---|---|
| Canada Lands Surveyors Act | SC 1998, c. 14 |
| Canada Lands Surveys Act | RSC 1985, c. L-6 |
| Canadian Aviation Regulations Part IX | RPAS regulations |

### Provincial Professional Bodies and Legislation

**British Columbia**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | ABCLS | https://www.abcls.ca/ |
| Engineers/Geoscientists | EGBC | https://www.egbc.ca/ |
| Technologists | ASTTBC | https://asttbc.org/ |
| Legislation | Land Surveyors Act | RSBC 1996, c. 248 |

**Alberta**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | ALSA | https://www.alsa.ab.ca/ |
| Engineers/Geoscientists | APEGA | https://www.apega.ca/ |
| Technologists | ASET | https://www.aset.ab.ca/ |
| Legislation | Land Surveyors Act | RSA 2000, c. L-3 |

**Saskatchewan**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | SLSA | https://www.slsa.sk.ca/ |
| Engineers/Geoscientists | APEGS | https://www.apegs.ca/ |
| Technologists | TPS | https://www.tpsk.ca/ |
| Legislation | Land Surveyors and Professional Surveyors Act | SS 1995, c. L-3.1 |

**Manitoba**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | AMLS | https://amls.ca/ |
| Engineers/Geoscientists | EGM | https://www.enggeomb.ca/ |
| Technologists | CTTAM | https://cttam.com/ |
| Legislation | The Land Surveyors Act | CCSM c. L60 |

**Ontario**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | AOLS | https://www.aols.org/ |
| Engineers | PEO | https://www.peo.on.ca/ |
| Geoscientists | PGO | https://www.pgo.ca/ |
| Technologists | OACETT | https://www.oacett.org/ |
| Legislation | Surveyors Act | RSO 1990, c. S.29 |

**Quebec**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | OAGQ | https://oagq.qc.ca/ |
| Engineers | OIQ | https://www.oiq.qc.ca/ |
| Geoscientists | OGQ | https://ogq.qc.ca/ |
| Legislation | Loi sur les arpenteurs-geometres | RLRQ c. A-23 |

**New Brunswick**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | ANBLS | https://www.anbls.nb.ca/ |
| Engineers/Geoscientists | APEGNB | https://www.apegnb.com/ |
| Technologists | NBSCETT | https://www.nbscett.nb.ca/ |
| Legislation | New Brunswick Land Surveyors Act | 2017 |

**Nova Scotia**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | ANSLS | https://ansls.ca/ |
| Engineers | ENS | https://engineersnovascotia.ca/ |
| Geoscientists | APGNS | https://www.geoscientistsns.ca/ |
| Technologists | TechNova | https://technova.ca/ |
| Legislation | Land Surveyors Act | Chapter 38, Acts of 2010 |

**Prince Edward Island**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | APEILS | https://www.apeils.ca/ |
| Engineers | EPEI | https://www.engineerspei.com/ |
| Technologists | ITP | https://www.techpei.ca/ |
| Legislation | Land Surveyors Act | RSPEI 1988, c. L-3.1 |

**Newfoundland & Labrador**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | ANLS | https://anls.ca/ |
| Engineers/Geoscientists | PEGNL | https://pegnl.ca/ |
| Technologists | AETTNL | https://www.aettnl.com/ |
| Legislation | Land Surveyors Act, 1991 | SNL 1991, c. 37 |

**Yukon**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | ACLS (federal jurisdiction) | https://www.acls-aatc.ca/ |
| Engineers | APEY | https://www.apey.yk.ca/ |
| Legislation | Canada Lands Surveyors Act | Federal |

**Northwest Territories**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | ACLS (federal jurisdiction) | https://www.acls-aatc.ca/ |
| Engineers/Geoscientists | NAPEG | https://www.napeg.nt.ca/ |
| Legislation | Canada Lands Surveyors Act | Federal |

**Nunavut**

| Role | Organization | URL |
|---|---|---|
| Land Surveyors | ACLS (federal jurisdiction) | https://www.acls-aatc.ca/ |
| Engineers/Geoscientists | NAPEG | https://www.napeg.nt.ca/ |
| Legislation | Canada Lands Surveyors Act | Federal |

---

## Section 3: Codex Expansion

### Goal

Expand glossary from ~64 to ~120 terms. Rename "Regs & Standards" category to "Organizations". No other category renames.

### Category Summary

| Category | Existing | Adding | Total |
|----------|----------|--------|-------|
| Command Centre | 9 | 0 | 9 |
| Flight Ops | 10 | 5 | 15 |
| Geodesy | 14 | 8 | 22 |
| GIS | 5 | 8 | 13 |
| Remote Sensing | 6 | 10 | 16 |
| Jurisdictions | 3 | 3 | 6 |
| Survey Tools | 9 | 8 | 17 |
| Organizations (was Regs & Standards) | 8 | 10 | 18 |
| **Total** | **64** | **52** | **~116** |

### New Terms: Flight Ops (+5)

| Term | Definition |
|------|-----------|
| Remote Pilot Certificate | Transport Canada certification for RPAS operations |
| GCS (Ground Control Station) | Hardware/software used to control RPAS during flight |
| C2 Link | Command and control data link between GCS and RPAS |
| AGL | Above Ground Level, altitude reference for RPAS operations |
| Airworthiness | Compliance status of an aircraft/RPAS with regulatory requirements |

### New Terms: Geodesy (+8)

| Term | Definition |
|------|-----------|
| NRTK | Network Real-Time Kinematic, RTK corrections from a network of reference stations |
| VRS | Virtual Reference Station, computed corrections for a virtual base near the rover |
| NAD27 | North American Datum of 1927, predecessor to NAD83, still in historical records |
| WGS84 | World Geodetic System 1984, global reference frame used by GPS |
| Base Station | Fixed GNSS receiver providing corrections for RTK/differential positioning |
| Rover | Mobile GNSS receiver collecting positions relative to a base station or network |
| Static Positioning | GNSS observation mode with receiver stationary over a point for extended period |
| Convergence Time | Time required for PPP solution to reach target accuracy |

### New Terms: GIS (+8)

| Term | Definition |
|------|-----------|
| OGC | Open Geospatial Consortium, develops open standards for geospatial data |
| Shapefile | Esri vector data format, widely used legacy format with known limitations |
| GeoJSON | Open standard JSON-based vector format, WGS84 by convention |
| GeoPackage | OGC standard SQLite-based container for vector and raster data |
| GeoTIFF | Raster format embedding georeferencing metadata in TIFF files |
| CRS | Coordinate Reference System, defines how coordinates map to real-world positions |
| Georeferencing | Process of assigning real-world coordinates to an image or dataset |
| False Easting / False Northing | Offset values added to projected coordinates to avoid negatives |

### New Terms: Remote Sensing (+10)

| Term | Definition |
|------|-----------|
| GCP | Ground Control Point, surveyed point used to georeference imagery |
| GSD | Ground Sample Distance, physical size of one pixel on the ground |
| Orthorectification | Process of removing terrain and lens distortion from imagery |
| Bundle Adjustment | Simultaneous optimization of camera positions and 3D point locations |
| Point Cloud | Set of 3D points representing surface geometry, typically from LiDAR or photogrammetry |
| Intensity | LiDAR return strength, used for surface material classification |
| Classification (LiDAR) | Assigning point cloud points to categories per ASPRS LAS standard |
| Swath | Strip of terrain covered by a single pass of an airborne sensor |
| Mosaic | Composite image assembled from multiple overlapping frames |
| Spatial Resolution | Physical ground area represented by a single pixel or measurement |

### New Terms: Jurisdictions (+3)

| Term | Definition |
|------|-----------|
| CLSR | Canada Lands Survey Records, federal registry of all surveys on Canada Lands |
| FAFNLM | Framework Agreement on First Nation Land Management |
| Surveyor General | Federal official responsible for Canada Lands surveys |

### New Terms: Survey Tools (+8)

| Term | Definition |
|------|-----------|
| Monument | Physical marker (brass cap, iron post, etc.) placed to define a survey point |
| Plan of Survey | Official survey document filed with a land registry or CLSR |
| Legal Description | Written description that uniquely identifies a parcel of land |
| Right of Way | Legal right to pass through property owned by another |
| Easement | Legal right to use another's land for a specific purpose |
| Traverse | Series of connected survey lines with measured angles and distances |
| Closure | Difference between computed and known positions in a survey network |
| RMSE | Root Mean Square Error, standard measure of positional accuracy |

### New Terms: Organizations (+10)

| Term | Definition |
|------|-----------|
| NRCan | Natural Resources Canada, federal department managing geodetic, geological, and energy resources |
| Transport Canada | Federal department regulating aviation including RPAS operations |
| CBEPS | Canadian Board of Examiners for Professional Surveyors, certifies academic qualifications |
| PSC | Professional Surveyors Canada, national advocacy for the surveying profession |
| Engineers Canada | National organization of provincial/territorial engineering regulators |
| NAV CANADA | Private corporation operating Canada's civil air navigation system |
| ISPRS | International Society for Photogrammetry and Remote Sensing |
| ISO TC 211 | ISO Technical Committee for Geographic Information/Geomatics standards |
| AOLS | Association of Ontario Land Surveyors |
| OAGQ | Ordre des arpenteurs-geometres du Quebec |

---

## Section 4: Mission Brief Rewrite

### Goal

Rewrite Mission Brief to serve as practitioner tool, professional brand showcase, and community resource. Keep author anonymous (BCKGeo brand only). Tone: confident, technical, direct.

### Content Structure

**1. What This Is**

- A geomatics operations dashboard built by a working professional, for working professionals
- Consolidates the tools, feeds, and references that field geomatics technologists actually need, in one place instead of 47 browser tabs
- Built from 18+ years of survey, mapping, and remote sensing experience across western Canada

**2. Why It Exists**

- Real-time space weather affects GNSS accuracy
- Weather affects field schedules
- Magnetic declination matters for every compass-referenced survey
- Provincial data portals are scattered across 13 jurisdictions
- RPAS regs change constantly
- This dashboard puts it all in one place with no tracking, no accounts, no cookies

**3. What It Covers (9 operational domains)**

| Domain | Tab |
|--------|-----|
| Real-time space weather monitoring | Space Weather |
| GNSS constellation health and outage tracking | GNSS Health |
| Magnetic declination and geomagnetic conditions | Mag/Dec |
| Provincial/territorial geomatics data portals and professional bodies | Jurisdictions |
| Survey tools and coordinate reference utilities | Survey Tools |
| RPAS flight planning, NOTAMs, and weather | Flight Ops |
| Technical glossary of geomatics terms | Codex |
| Satellite tracking and ISS passes | Command Centre |

**4. Data Sources**

Keep existing 4 sources with live links:
- NOAA Space Weather Prediction Center
- CelesTrak (NORAD TLE data)
- Natural Resources Canada (IGRF/WMM)
- Open-Meteo weather API

**5. Privacy**

Zero-tracking statement: no cookies, no analytics, no accounts, no data collection. Everything runs client-side against public APIs.

**6. Built With**

Brief tech note: React, Vite, Tailwind CSS, Cloudflare Pages, open APIs, no backend.

### Content Rules

- Do NOT mention: Ben Koops, AScT, Prince George, or any personal identifiers
- BCKGeo is the brand identity
- Author referenced only as "a working geomatics professional" or not at all
- Canadian spelling throughout
- No fluff, no marketing language, no "empowering" or "leveraging"

---

## Files Modified

| File | Change |
|------|--------|
| `src/App.jsx` | Remove Regs from NAV array and Routes (10 tabs to 9) |
| `src/data/sections.js` | Remove "Regs & Standards" section |
| `src/data/provinces.js` | Add Federal/National (CA) at position 0, add Professional Bodies + Legislation to all provinces, add Canada Lands & Indigenous Survey to Federal |
| `src/data/glossary.js` | Add ~52 new terms, rename "Regs & Standards" category to "Organizations" |
| `src/components/pages/MissionBrief.jsx` | Full content rewrite per Section 4 structure |
| `src/components/pages/Codex.jsx` | Update category references if any hardcoded |
| `src/components/pages/Regs.jsx` | Delete |

---

## Verification Checklist

1. `npm run build` passes
2. `npm test` passes
3. All 13 provinces + Federal/National render in Jurisdictions
4. Each province shows Professional Bodies and Legislation categories
5. Federal/National shows all 6 categories including Canada Lands & Indigenous Survey
6. Codex shows ~116 terms across 8 updated categories
7. Mission Brief reads clean with no personal identifiers
8. No broken links in nav (Regs route removed, no 404s)
9. Search/filter still works in Codex with new terms
10. Mobile responsive on all new content
