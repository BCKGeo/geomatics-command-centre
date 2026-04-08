# Canadian Open Data Portals Research — Design Spec

**Date:** 2026-04-07
**Author:** Ben Koops / Claude
**Status:** Draft

## Context

The BCKGeo Dashboard includes a Canadian geospatial resource hub with per-province jurisdiction data and a municipal map. BC has been researched deeply (201 entries, 27-column standalone Excel), but the remaining 12 provinces/territories have only provincial-level links and ~32 major city entries in municipalities.js. The goal is to expand coverage to every incorporated municipality in Canada (~3,500+), produce a standalone BC-style Excel per province, update the dashboard's JS source files, and upgrade the map component to handle the scale.

## Deliverables

1. **Per-province standalone Excel files** (27-column schema, same format as BC)
2. **Updated JS source files** (jurisdictions/*.js and municipalities.js)
3. **Upgraded MunicipalMap component** (clustering, province colors, heatmap, enhanced filters)
4. **Research pipeline scripts** (automated baseline generation + URL discovery)

## Data Architecture

### Tiered Research Model

| Tier | Population | Count (est.) | Research Depth |
|------|-----------|-------------|----------------|
| 1 | >50,000 | ~150 | Full 27-field verification, agent-researched |
| 2 | 10,000-50,000 | ~250 | Core fields, pattern-matched URLs, agent spot-checks |
| 3 | <10,000 | ~3,000+ | Entity info, council URL, portal flagging |

### Authoritative Field Mapping (JSON -> Excel -> municipalities.js)

This is the single source of truth for field names across all three representations.

| # | Excel Column | JSON Entity Field | municipalities.js Field | Notes |
|---|-------------|-------------------|------------------------|-------|
| 1 | Province/Territory | (parent object `province`) | `province` | 2-letter code |
| 2 | Entity Name | `name` | `name` | |
| 3 | Entity Type | `entityType` | `entityType` | See CSD mapping table |
| 4 | Population (2021) | `population` | `population` | |
| 5 | Parent Geography | `parentGeography` | `parentGeography` | RD (BC), County (AB), RM (SK), District (ON), MRC (QC), etc. |
| 6 | Open Data Portal Name | `openDataPortalName` | -- | |
| 7 | Open Data Portal URL | `openDataPortalUrl` | `portalUrl` | replaces ambiguous `gisPortal` |
| 8 | Portal Platform | `portalPlatform` | -- | ArcGIS Hub, CKAN, Socrata, etc. |
| 9 | GIS/Map Viewer Name | `gisViewerName` | -- | |
| 10 | GIS/Map Viewer URL | `gisViewerUrl` | -- | |
| 11 | Council Meetings Portal Name | `councilPortalName` | -- | e.g. "CivicWeb", "eScribe" |
| 12 | Council Meetings URL | `councilUrl` | `councilUrl` | |
| 13 | Council Platform | `councilPlatform` | -- | CivicWeb, eScribe, Granicus, Custom |
| 14 | Engineering Standards URL | `engineeringStandardsUrl` | `surveyStandards` | keep legacy field name in JS |
| 15 | CAD/Design Standards URL | `cadStandardsUrl` | -- | |
| 16 | Construction Standards | `constructionStandards` | -- | MMCD, etc. |
| 17 | Data Formats Available | `dataFormats` | -- | SHP, GeoJSON, CSV, etc. |
| 18 | Coordinate System / Datum | `coordinateSystem` | -- | |
| 19 | LiDAR/Point Cloud Available | `lidarAvailable` | -- | boolean |
| 20 | Orthophoto/Imagery Available | `orthophotoAvailable` | -- | boolean |
| 21 | WMS/WFS/REST Endpoints | `wmsWfsEndpoints` | -- | |
| 22 | API Endpoint | `apiEndpoint` | -- | |
| 23 | Data Licence | `dataLicence` | -- | |
| 24 | Contact Department | `contactDepartment` | -- | |
| 25 | Industry Focus | `industryFocus` | -- | |
| 26 | Description / Notes | `description` | -- | |
| 27 | Last Verified | `lastVerified` | -- | YYYY-MM-DD |

**municipalities.js-only fields** (not in Excel, derived for map rendering):
- `lat`, `lon` -- from StatsCan centroid
- `tier` -- 1/2/3 based on population
- `hasPortal` -- boolean, true if `openDataPortalUrl` is non-null

**Migration note:** The existing `gisPortal` field in municipalities.js is ambiguous (it stores open data portal URLs, not GIS viewer URLs). It will be renamed to `portalUrl` during sync. Existing dashboard code that references `gisPortal` will be updated in the MunicipalMap rewrite.

### Per-Province JSON Schema

Each province produces `data/open-data-portals/{prov}_research.json`:

```json
{
  "province": "AB",
  "provinceName": "Alberta",
  "lastUpdated": "2026-04-07",
  "entities": [
    {
      "name": "Calgary",
      "entityType": "City",
      "population": 1306784,
      "tier": 1,
      "lat": 51.0447,
      "lon": -114.0719,
      "parentGeography": null,
      "openDataPortalName": "Calgary Open Data",
      "openDataPortalUrl": "https://data.calgary.ca/",
      "portalPlatform": "Socrata",
      "gisViewerName": "Calgary Map Gallery",
      "gisViewerUrl": "https://maps.calgary.ca/",
      "councilPortalName": null,
      "councilUrl": "https://www.calgary.ca/council/meetings/...",
      "councilPlatform": "Custom",
      "engineeringStandardsUrl": "...",
      "cadStandardsUrl": null,
      "constructionStandards": "MMCD",
      "dataFormats": "SHP, GeoJSON, CSV, KML",
      "coordinateSystem": "NAD83(CSRS) UTM Zone 11N",
      "lidarAvailable": false,
      "orthophotoAvailable": false,
      "wmsWfsEndpoints": null,
      "apiEndpoint": "Socrata SODA API",
      "dataLicence": "OGL-Calgary",
      "contactDepartment": "IT/GIS",
      "industryFocus": "Geospatial",
      "description": "City of Calgary open data portal...",
      "lastVerified": "2026-04-07"
    }
  ],
  "standards": [
    {
      "name": "Alberta Transportation Design Standards",
      "organization": "Alberta Transportation",
      "scope": "Provincial",
      "url": "...",
      "version": "Current",
      "applicableTo": "Highway, bridge, road design",
      "industry": "Civil Engineering, Transportation",
      "costAccess": "Free",
      "description": "...",
      "lastVerified": "2026-04-07"
    }
  ]
}
```

**Standards -> jurisdictions/*.js mapping:** Standards entries do NOT sync back to jurisdictions files. The jurisdictions files are the dashboard's curated provincial resource links (maintained manually). The `standards` array in the JSON feeds only into the Excel's "Standards & Reference" sheet.

### municipalities.js Schema (Map Data)

Expand from 7 to 11 fields per entry:

```javascript
{
  name: "Calgary",
  province: "AB",
  lat: 51.0447,
  lon: -114.0719,
  population: 1306784,
  entityType: "City",       // NEW
  tier: 1,                  // NEW
  hasPortal: true,          // NEW
  regionalDistrict: null,   // NEW
  gisPortal: "https://data.calgary.ca/",
  councilUrl: "https://...",
  surveyStandards: "https://...",
}
```

## Research Pipeline

### scripts/research_pipeline.py

**Phase 1: Baseline Generation**

**Data source:** StatsCan 2021 Census, Census Subdivision (CSD) population and dwelling counts.
- Table: 98-10-0002-01 (Population and dwelling counts by CSD)
- Download: https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/dt-td/Index-eng.cfm
- Format: CSV, ~5,500 rows (one per CSD)
- Fields used: CSDNAME, CSDTYPE, PRNAME/PRUID, POP2021
- **Centroid coordinates:** Use the Census Subdivision Boundary File (product 92-160-X, Shapefile format). Compute centroids using `shapely` (centroid of polygon geometry). Alternatively, use the Representative Point file from StatsCan if available. Store as `data/open-data-portals/baseline/statscan_csd_2021.csv` after processing.
- **Additional Python dependency:** `geopandas` and `shapely` for centroid computation from boundary Shapefiles.

**CSD Type to Entity Type mapping (complete):**

| CSD Code | Entity Type | Provinces |
|----------|-----------|-----------|
| C | City | All |
| CY | City | ON |
| T | Town | All |
| VL | Village | All |
| DM | District Municipality | BC |
| RM | Rural Municipality | SK, MB |
| CT | County | AB, ON, NB |
| RD | Regional District | BC |
| SM | Specialized Municipality | AB |
| MD | Municipal District | AB |
| SV | Summer Village | AB |
| ID | Improvement District | AB |
| P | Parish | NB |
| TP | Township | ON, QC |
| MU | Municipality | QC, ON |
| CU | Canton Unite | QC |
| V | Ville | QC |
| PE | Paroisse | QC |
| CT (QC) | Canton | QC |
| TV | Town/Ville | QC |
| RGM | Regional Municipality | ON |
| IRI | Indian Reserve | All |
| S-E | Indian Settlement | All |
| NH | Northern Hamlet | SK, NT |
| NV | Northern Village | SK |
| NO | Unorganized Territory | ON |
| SET | Settlement | NT, NU |
| CC | Chartered Community | NT |
| HAM | Hamlet | NT, NU |
| RV | Resort Village | SK |
| IM | Island Municipality | BC |
| IGD | Indian Government District | BC |
| **Fallback** | **Other Municipal** | **Any unmatched code** |

- Assign tiers (1/2/3) by population: Tier 1 >50k, Tier 2 10k-50k, Tier 3 <10k
- Output: `data/open-data-portals/baseline/{prov}_baseline.json`

**Phase 2: URL Pattern Discovery**
Automated HTTP HEAD checks against known templates:
- ArcGIS Hub: `https://data-{slug}.opendata.arcgis.com/`
- ArcGIS Hub v2: `https://{slug}.hub.arcgis.com/`
- CivicWeb: `https://{slug}.civicweb.net/Portal/`
- eScribe: `https://pub-{slug}.escribemeetings.com/`
- CKAN: `https://data.{slug}.ca/`
- Rate limit: 2 requests/sec, respect robots.txt

**Phase 3: Tavily Research (Tier 1 + 2)**
For municipalities without pattern-matched portals:
- Query: `"{name}" open data portal OR GIS map viewer site:.ca`
- Query: `"{name}" engineering design standards subdivision`
- Query: `"{name}" council meetings agendas minutes`
- Rate limit: Tavily free tier aware (1000 credits/mo)

**Phase 4: CRS Assignment**
Automated by longitude:
- UTM Zone 7N through 22N based on 6-degree bands
- Provincial overrides: BC Albers (EPSG:3005), Alberta 10-TM (EPSG:3402), Ontario MNR Lambert (EPSG:3161), Quebec MTM zones, Maritime NBDS (EPSG:2953)

**Phase 5: Output**
Merge phases 1-4 into per-province JSON files.

### scripts/build_province_excel.py

- Input: `data/open-data-portals/{prov}_research.json`
- Output: `data/open-data-portals/{Province}_Open_Data_Portals_Research.xlsx`
- 27-column schema matching BC file format
- 3 sheets: Open Data Portals, Standards & Reference, Metadata & Legend
- Same styling: frozen panes, auto-filters, color-coded headers, provincial rows highlighted

### scripts/sync_municipalities_js.py

- Reads all `data/open-data-portals/{prov}_research.json` files
- Generates updated `src/data/municipalities.js` with 11-field lean schema
- Preserves manually-curated entries where they have richer data
- Also updates `src/data/jurisdictions/*.js` if new provincial-level links found

## Map Component Upgrades

### MunicipalMap.jsx Changes

**1. Marker Clustering**
- Add `@changey/react-leaflet-markercluster` (compatible with react-leaflet v4)
- Cluster at zoom levels 4-8, individual markers at zoom 9+
- Cluster circles colored by dominant province in cluster
- Cluster count displayed in center

**2. Marker Differentiation**
- Size by tier: Tier 1 = 8px, Tier 2 = 6px, Tier 3 = 4px
- Color by province using IBM Design colorblind-safe palette (13 colors):

| Province | Color | Hex |
|----------|-------|-----|
| BC | Ultramarine | #648FFF |
| AB | Red | #DC267F |
| SK | Gold | #FFB000 |
| MB | Teal | #009E73 |
| ON | Purple | #785EF0 |
| QC | Orange | #FE6100 |
| NB | Cyan | #0CB4CE |
| NS | Magenta | #D55E00 |
| PE | Lime | #56B4E9 |
| NL | Coral | #E69F00 |
| YT | Slate | #999999 |
| NT | Forest | #117733 |
| NU | Indigo | #332288 |

- Fill: solid for municipalities WITH a portal, outline-only for those without
- This highlights "diamonds in the rough" -- small municipalities with open data

**3. Enhanced Filters**
- Province dropdown (existing, keep)
- Name search (existing, keep)
- Entity type multi-select: City / Town / Village / RM / County / RD
- "Has Portal" toggle button
- Tier selector: 1 / 1+2 / All
- Population range: slider or preset bands (<1k, 1k-10k, 10k-50k, 50k+)

**4. Heatmap Toggle**
- Toggle button: Markers view vs Heatmap view
- Heatmap shows density of open data availability
- Uses `leaflet.heat` or `leaflet-heatmap`
- Weight by: portal availability (has portal = hot, no portal = cold)
- Reveals geographic patterns in data availability

**5. Enhanced Popups**
- Entity type badge (colored pill)
- Regional district/county name
- Portal platform tag
- All available links as icon buttons (portal, GIS, council, standards)
- Population with comma formatting

**6. Performance**
- Single `municipalities.js` file (~350 KB for 3,500 entries) -- acceptable bundle size, no dynamic imports needed
- Use Leaflet's Canvas renderer (`preferCanvas: true` on MapContainer) for 3,500+ markers
- MarkerClusterGroup handles the visual density at low zoom levels
- Debounce search input (300ms)

**7. Existing Bug Fix**
- Current `MunicipalMap.jsx` references `m.council` (line ~86) but the data field is `councilUrl` -- this link never renders. Fix during rewrite by referencing `m.councilUrl`.
- Rename `m.gisPortal` references to `m.portalUrl` throughout the component.

## Execution Plan

| Session | Scope | Est. Entities | Deliverables |
|---------|-------|--------------|-------------|
| 1 | Build pipeline + Alberta | ~340 | Pipeline scripts, AB Excel, AB JSON |
| 2 | Saskatchewan + Manitoba | ~920 | SK Excel, MB Excel |
| 3 | Ontario | ~444 | ON Excel |
| 4 | Quebec (part 1: Tier 1+2) | ~150 | QC JSON (major municipalities) |
| 5 | Quebec (part 2: Tier 3) | ~950+ | QC Excel (complete) |
| 6 | NB + NS + PE + NL | ~200 | 4 province Excels |
| 7 | YT + NT + NU + Federal | ~50 | 3 territory Excels, federal update |
| 8 | BC gap-fill + Map upgrades | 201 | BC Excel v2, MunicipalMap.jsx rewrite |
| 9 | National QA + sync | All | municipalities.js sync, national Excel rebuild |

### Session 1 Detail (This Session)

1. Build `scripts/research_pipeline.py`
   - StatsCan data ingestion
   - URL pattern discovery
   - CRS assignment logic
2. Build `scripts/build_province_excel.py`
3. Build `scripts/sync_municipalities_js.py`
4. Run pipeline for Alberta
5. Dispatch parallel agents for Alberta Tier 1 verification
6. Generate `Alberta_Open_Data_Portals_Research.xlsx`
7. Update `src/data/jurisdictions/ab.js` and `src/data/municipalities.js`

## Verification

- Pipeline scripts run without errors on Windows 11 / Python 3.x
- Alberta Excel opens in Excel with correct formatting, frozen panes, filters
- Alberta JSON validates against schema
- municipalities.js imports without errors in Vite dev server
- MunicipalMap renders Alberta municipalities on the map
- Map clustering works at national zoom level
- Heatmap toggle switches view correctly

## Script Lifecycle

- `scripts/build_excel.py` (existing) -- generates national Excel from JS source files. **Kept as-is** for the dashboard's Canadian overview Excel. Updated in Session 8 to also pull from province JSONs.
- `scripts/research_pipeline.py` (new) -- generates baseline JSON per province from StatsCan + URL pattern matching
- `scripts/build_province_excel.py` (new) -- generates BC-style standalone Excel per province from JSON
- `scripts/sync_municipalities_js.py` (new) -- syncs all province JSONs into municipalities.js for the map

### Pipeline Error Handling

- **Checkpoint files:** Each phase writes intermediate output. If the pipeline crashes in Phase 3 (Tavily), Phase 1-2 results are already saved in `{prov}_baseline.json`. Re-running skips completed phases.
- **Idempotent re-runs:** The pipeline checks for existing JSON and only overwrites fields that are null or outdated.
- **Rate limit backoff:** If Tavily returns 429, the pipeline sleeps with exponential backoff (5s, 15s, 45s) and resumes.
- **HTTP timeout:** URL pattern checks use 5-second timeout. Failed URLs logged but don't halt the pipeline.

### BC Data Migration

The existing BC Excel (201 entries) has no corresponding `bc_research.json`. In Session 7:
1. Reverse-engineer `bc_research.json` from the existing Excel using a one-off script
2. Merge with any new research
3. Rebuild BC Excel from JSON (ensuring no data loss)

## Dependencies

- Python: openpyxl, requests, geopandas, shapely, json
- Tavily API: via MCP tools (already configured)
- npm: @changey/react-leaflet-markercluster, leaflet.heat (new dependencies)
- StatsCan Census 2021 CSD population table (98-10-0002-01) + boundary Shapefile (92-160-X)

## Risks

- **Tavily rate limits**: Free tier is 1000 credits/mo. Heavy research sessions may exhaust credits. Mitigation: pattern matching first, Tavily only for gaps.
- **Municipality count**: Some provinces (QC, SK) have 700-1100+ municipalities. Many will be Tier 3 with minimal data. This is expected.
- **French-language portals**: Quebec municipalities often have French-only websites. Agents can handle this but verification is harder.
- **Map performance**: 3,500+ markers needs canvas renderer or clustering. Leaflet handles this well with MarkerClusterGroup.
- **Data staleness**: Municipality websites change. The "Last Verified" field tracks this. Plan for annual refresh.
