# Canadian Open Data Portals Research Project

## Status: BC Complete | AB Baseline | MB Baseline | NB/NS/PE/NL/YT/NT/NU Baseline

Last updated: 2026-04-07

## Project Goal

Comprehensive spreadsheet of every open data portal, GIS map viewer, council meeting repo, and geospatial/engineering standards link for every municipality, regional district, and relevant organization across all Canadian provinces and territories. Targeted at geospatial, geomatics, GIS, remote sensing, geodesy, and design/engineering standards (CAD, Civil 3D, MicroStation, MMCD, CCDC).

## File Locations

- Spreadsheet: `data/open-data-portals/BC_Open_Data_Portals_Research.xlsx`
- Build script: `/sessions/eloquent-affectionate-cerf/build_bc_complete.py` (session temp, copy if needed)
- First Nations research notes: `/sessions/eloquent-affectionate-cerf/bc_first_nations_research.txt`
- This file: `data/open-data-portals/OPEN_DATA_RESEARCH_STATUS.md`

## Spreadsheet Schema (27 columns)

1. Province/Territory
2. Entity Name
3. Entity Type (City, District Municipality, Town, Village, Island Municipality, Resort Municipality, Mountain Resort Municipality, Regional District, Provincial Government, Provincial Agency, Standards Body, Indigenous Organization, First Nation, Special Governance, Electoral Area)
4. Population (2021 Census)
5. Regional District
6. Open Data Portal Name
7. Open Data Portal URL
8. Portal Platform (ArcGIS Hub, CKAN, OpenDataSoft, Socrata, Custom)
9. GIS/Map Viewer Name
10. GIS/Map Viewer URL
11. Council Meetings Portal Name
12. Council Meetings URL
13. Council Platform (CivicWeb, eScribe, iCompass, Granicus, Custom)
14. Engineering Standards URL
15. CAD/Design Standards URL
16. Construction Standards (MMCD etc.)
17. Data Formats Available (SHP, GeoJSON, KML, CSV, DWG, LAS/LAZ, GeoTIFF, etc.)
18. Coordinate System / Datum
19. LiDAR/Point Cloud Available
20. Orthophoto/Imagery Available
21. WMS/WFS/REST Endpoints
22. API Endpoint
23. Data Licence
24. Contact Department
25. Industry Focus
26. Description / Notes
27. Last Verified

## BC Status: 201 Entries

### Entity Breakdown

| Type | Count |
|------|-------|
| City | 51 |
| District Municipality | 46 |
| Village | 44 |
| Regional District | 28 |
| Town | 13 |
| Indigenous (various) | 9 |
| Standards Body | 2 |
| Provincial Gov/Agency | 2 |
| Special Governance (Islands Trust) | 1 |
| Other (Island Muni, Resort, Electoral) | 5 |
| **Total** | **201** |

### Field Completeness

| Field | Filled | % | Priority |
|-------|--------|---|----------|
| Entity Name/Type/Population/RD | 201 | ~100% | Done |
| Council Meetings URL | 162 | 81% | Good |
| Description/Notes | 178 | 89% | Good |
| Open Data Portal URL | 77 | 38% | Reality check (most small munis don't have one) |
| GIS/Map Viewer URL | 60 | 30% | Needs research for mid-size munis |
| Portal Platform | 71 | 35% | Fill from known ArcGIS Hub patterns |
| Council Platform | 53 | 26% | **Needs work**: identify CivicWeb vs eScribe for remaining |
| Data Licence | 65 | 32% | Fill OGL for all ArcGIS Hub portals |
| Contact Department | 68 | 34% | Fill "IT/GIS" for portal municipalities |
| Industry Focus | 75 | 37% | Fill for all |
| Data Formats | 37 | 18% | **Needs work**: standardize for ArcGIS Hub portals |
| Coordinate System | 35 | 17% | **Quick win**: UTM 10N west of ~120W, UTM 11N east |
| API Endpoint | 29 | 14% | Fill "ArcGIS REST" for all Hub portals |
| Engineering Standards URL | 7 | 3.5% | **Gap**: only Province, MOTI, Kelowna, Maple Ridge, Surrey |
| CAD/Design Standards URL | 3 | 1.5% | **Gap**: only Province/MOTI and Kelowna |
| WMS/WFS/REST Endpoints | 8 | 4% | **Gap**: needs portal-by-portal verification |
| LiDAR/Point Cloud Available | 5 | 2.5% | **Gap**: needs portal-by-portal verification |
| Orthophoto/Imagery Available | 4 | 2% | **Gap**: needs portal-by-portal verification |

### Portal Platforms Identified

- ArcGIS Hub: 29
- Custom/Municipal website: 27
- Custom: 9
- CKAN: 2 (Vancouver uses OpenDataSoft, Surrey uses CKAN)
- OpenDataSoft: 1

### Council Platforms Identified

- CivicWeb: 38
- eScribe: 11
- Custom: 4

### Known Gaps to Fix (Priority Order)

#### 1. Quick Wins (no research needed, pattern-based)

- [ ] Fill CRS for all municipalities: UTM Zone 10N for everything west of ~120deg W (Metro Van, Island, Sunshine Coast, northern BC), UTM Zone 11N for Okanagan/Kootenays. BC Albers (EPSG:3005) for provincial data.
- [ ] Fill "Data Formats: SHP, GeoJSON, CSV" for all ArcGIS Hub portals (they all support these)
- [ ] Fill "API Endpoint: ArcGIS REST" for all ArcGIS Hub portals
- [ ] Fill "Data Licence: OGL" for all ArcGIS Hub portals
- [ ] Fill "Contact Department: IT/GIS" for all municipalities with portals
- [ ] Fill "Industry Focus: Geospatial" for all municipalities with portals

#### 2. Medium Effort (targeted research)

- [ ] 16 cities with no portal and no GIS viewer need research: Dawson Creek, Duncan, Enderby, Fort St. John, Grand Forks, Greenwood, Kimberley, Merritt, Parksville, Powell River, Prince Rupert, Quesnel, Rossland, Terrace, Trail, Williams Lake
- [ ] Verify council platform (CivicWeb vs eScribe vs other) for remaining ~100 municipalities
- [ ] Check which regional districts serve as open data proxies for their member municipalities (e.g., RDCO covers Peachland via ArcGIS Hub)
- [ ] Research which municipalities have adopted MMCD and fill Construction Standards column

#### 3. Longer Term (portal-by-portal verification, needs web scraping)

- [ ] LiDAR/Point Cloud availability for each municipality with a portal
- [ ] Orthophoto/Imagery availability
- [ ] WMS/WFS/REST service endpoint URLs for each portal
- [ ] Engineering Standards URLs for municipalities that publish design guides
- [ ] Identify municipalities with CAD submission requirements (Civil 3D templates, DWG standards)

### Standards Sheet (12 entries)

- MMCD 2019 Edition
- MMCD Infrastructure Data Standards (IDS)
- BC Supplement to TAC Geometric Design Guide
- BC MOTI Civil 3D Resources
- BC MOTI AutoCAD Drafting Standards
- BC MOTI General Survey Guide
- BC MOTI Construction Supervision Survey Guide
- CCDC 2 (Stipulated Price Contract, 2020)
- CCDC 5A/5B/17/30 (2025 Updates)
- BC Land Surveyors Act
- ABCLS Standards
- EGBC Guidelines

## Next Provinces (Not Started)

### Alberta
- ~340 municipalities
- Key portals to research: Calgary, Edmonton, Red Deer, Lethbridge, Medicine Hat, Grande Prairie, Airdrie, Spruce Grove, St. Albert, Strathcona County, Rocky View County
- Provincial: Alberta Open Data, AltaLIS, Alberta Geomatics, AEMA
- Standards: Alberta Transportation design standards, APEGA

### Saskatchewan -- Baseline Complete (2026-04-07)
- ~780 municipalities: 16 cities (incl. Flin Flon SK portion), ~147 towns, ~250 villages, 41 resort villages, 296 RMs, 2 northern towns, 11 northern villages, 11+ northern hamlets
- Baseline JSON: `data/open-data-portals/baseline/sk_municipalities.json` (500+ entries with pop, lat/lon, parentGeography)
- Tier 1 research: `data/open-data-portals/baseline/sk_tier1.json` (top 10 cities + provincial portals)
- Open data portals confirmed: Regina (open.regina.ca, CKAN), Saskatoon (ArcGIS Hub), Provincial GeoHub (geohub.saskatchewan.ca, ArcGIS Hub)
- ISC (Information Services Corporation) handles land titles/cadastral (subscription-based, not open)
- Most smaller cities/towns have no open data portals
- CRS: NAD83 UTM Zone 13N (province-wide)

### Manitoba -- Baseline Complete (2026-04-07)
- 137 municipalities: 10 cities, 25 towns, 2 villages, 98 RMs, 2 LGDs
- Total pop: 1,270,757 (2021 Census)
- Baseline: `baseline/mb_municipalities.json` (137 entries with name, type, pop, lat, lon)
- Tier 1: `baseline/mb_tier1.json` (10 cities + provincial portal open data research)
- Open data portals found: Winnipeg (Socrata), Brandon (ESRI-based), Provincial Data MB (ArcGIS Hub)
- GIS viewers: Steinbach (Experience Builder), Portage la Prairie (basic maps)
- Most Manitoba municipalities have no open data portals (similar to smaller BC/AB municipalities)
- Provincial Data MB (geoportal.gov.mb.ca) is the primary geospatial data source for the province
- Key: Winnipeg, Brandon, Steinbach, Thompson, Portage la Prairie

### Ontario
- ~444 municipalities
- Largest province by municipal count. Major portals: Toronto, Ottawa, Mississauga, Hamilton, London, Kitchener, etc.

### Quebec
- ~1,100+ municipalities
- Key: Montreal, Quebec City, Laval, Gatineau, Longueuil, Sherbrooke
- Note: Many resources in French only

### New Brunswick -- Baseline Complete (2026-04-07)
- 77 municipalities post-2023 reform: 8 cities, 30 towns, 21 villages, 17 rural communities, 1 regional municipality
- Total pop: 775,610 (2021 Census)
- Baseline: `baseline/nb_municipalities.json` (77 entries with name, type, pop, lat, lon, RSC)
- Research: `nb_research.json` (Tier 1: Fredericton, Moncton, Saint John + provincial GeoNB)
- Open data portals: Fredericton (ArcGIS Hub), Moncton (ArcGIS Hub), Saint John (ArcGIS Hub)
- Provincial: GeoNB (geonb.snb.ca) -- excellent geospatial portal with LiDAR, orthophotos, property data
- NB Double Stereographic (EPSG:2953) is the provincial CRS; UTM Zone 19N/20N common

### Nova Scotia -- Baseline Complete (2026-04-07)
- 49 municipalities: 4 regional municipalities, 25 towns, 9 county municipalities, 11 district municipalities
- Total pop: 969,383 (2021 Census)
- Baseline: `baseline/ns_municipalities.json` (53 entries -- includes all 49 + some sub-units)
- Research: `ns_research.json` (Halifax + provincial)
- Open data portals: Halifax (ArcGIS Hub at data-hrm.hub.arcgis.com)
- Provincial: GeoNOVA (geonova.novascotia.ca) + data.novascotia.ca (Socrata)
- Halifax dominates (45% of provincial population)

### Prince Edward Island -- Baseline Complete (2026-04-07)
- 63 municipalities: 2 cities, 10 towns, 50 rural municipalities, 1 resort municipality
- Total pop: 154,331 (2021 Census, 73% in municipalities)
- Baseline: `baseline/pe_municipalities.json` (63 entries)
- Research: `pe_research.json` (Charlottetown + provincial)
- Open data portals: Charlottetown (ArcGIS Hub)
- Provincial: data.princeedwardisland.ca (Socrata), PEI GIS (gov.pe.ca/gis)
- Many very small rural municipalities (smallest: Tignish Shore, pop 64)

### Newfoundland and Labrador -- Baseline Complete (2026-04-07)
- 274 municipalities: 3 cities, 266 towns, 5 Inuit community governments
- Total pop: 510,550 (2021 Census)
- Baseline: `baseline/nl_municipalities.json` (~185 entries -- largest municipalities, full 274 available from NL Stats)
- Research: `nl_research.json` (St. John's + provincial)
- Open data portals: St. John's (ArcGIS Hub + map.stjohns.ca)
- Provincial: opendata.gov.nl.ca (CKAN), GeoHub NL (ArcGIS Hub)
- Many tiny outport communities (smallest: Little Bay Islands, pop 0 -- resettled)

### Yukon -- Baseline Complete (2026-04-07)
- 8 municipalities: 1 city (Whitehorse), 7 towns
- Total pop: 40,232 (2021 Census, 72.2% in Whitehorse)
- Baseline: `baseline/yt_municipalities.json` (8 entries)
- Research: `yt_research.json` (Whitehorse + territorial GeoYukon)
- Open data portals: Whitehorse (data.whitehorse.ca, CKAN)
- Territorial: GeoYukon (mapservices.gov.yk.ca) -- excellent geospatial infrastructure

### Northwest Territories -- Baseline Complete (2026-04-07)
- 33 communities in various governance types: 1 city, 4 towns, 1 village, hamlets, charter communities, community governments, settlements
- Total pop: 41,070 (2021 Census)
- Baseline: `baseline/nt_municipalities.json` (33 entries)
- Research: `nt_research.json` (Yellowknife + territorial)
- Open data portals: Yellowknife (opendata.yellowknife.ca, CKAN)
- Territorial: NWT Discovery Portal (nwtdiscoveryportal.enr.gov.nt.ca)

### Nunavut -- Baseline Complete (2026-04-07)
- 25 municipalities: 1 city (Iqaluit), 24 hamlets
- Total pop: 36,858 (2021 Census)
- Baseline: `baseline/nu_municipalities.json` (25 entries)
- Research: `nu_research.json` (Iqaluit + territorial)
- No municipal open data portals found (Iqaluit has no portal)
- Territorial: Nunavut Atlas (nunavutatlas.ca), limited open data infrastructure
- Most remote communities in Canada; Grise Fiord is northernmost (pop 144)

### Federal (NRCan, StatsCan, NRCAN, etc.)

## Build Notes

- Python build script uses openpyxl
- ArcGIS Hub portals follow pattern: `https://data-{cityname}.opendata.arcgis.com/` or `https://{name}.hub.arcgis.com/`
- CivicWeb council portals follow pattern: `https://{cityname}.civicweb.net/Portal/`
- Most BC municipalities use NAD83(CSRS) in UTM Zone 10N or 11N
- MMCD is the dominant construction standard in BC (90+ municipalities)
- Tavily API (free tier, 1000 credits/mo) rate limits after heavy use; pace requests
- WebFetch blocked on most .ca domains via egress proxy; use Tavily extract instead
- Training knowledge is solid for Canadian municipal data; use targeted searches to verify key URLs

## Research Sources Used

- Equator Studios BC Open Infrastructure Data Master List
- McMaster University Municipal Open Data Portals in Canada
- CanadianGIS.com
- UBC Library BC Maps & Data guide
- CivicInfo BC
- DataPortals.org
- Individual municipality websites
