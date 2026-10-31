// Site navigation and per-page tab lists. Shared by the Layout, the pages
// that own the tabs, and the quick lookup index, so the lookup can never
// drift from what the pages actually show.
export const NAV = [
  { path: "/", label: "Command Centre", icon: "🖥️", d: "Weather, space weather, Kp index, GNSS conditions, satellites, field safety", k: "home dashboard weather kp aurora solar wind satellites sun safety" },
  { path: "/flight-ops", label: "Flight Ops", icon: "✈️", d: "RPAS categories, airspace, pre-flight checklist, weather minimums, SFOC", k: "drone rpas uav airspace notam checklist" },
  { path: "/geodesy", label: "Geodesy", icon: "🌍", d: "CSRS-PPP, datums, geoid models, RTK networks, observation times", k: "datum epoch nad83 csrs ppp geoid rtk gnss" },
  { path: "/gis", label: "GIS", icon: "🗺️", d: "CRS reference, formats, UTM zones, GDAL quick ref, analysis ops", k: "spatial epsg crs gdal ogr formats utm" },
  { path: "/remote-sensing", label: "Remote Sensing", icon: "👁️", d: "Overlap, spectral indices, accuracy specs, LAS classes, point clouds", k: "imagery lidar photogrammetry ndvi las point cloud satellite" },
  { path: "/jurisdictions", label: "Jurisdictions", icon: "🏛️", d: "Provincial intel for 13 jurisdictions plus federal, municipal map", k: "province territory federal portals municipal map" },
  { path: "/survey-tools", label: "Survey Tools", icon: "🔧", d: "12 field calculators", k: "calculator coordinates traverse curve area" },
  { path: "/codex", label: "Codex", icon: "🔎", d: "Geomatics glossary", k: "glossary terms definitions dictionary" },
  { path: "/career", label: "Career", icon: "🎓", d: "CPD hour log, certification pathways (AScT, BCLS, CLS, RPAS Advanced), reading list, news wire", k: "cpd hours professional development certification designation pathway asct bcls cls rpas advanced reading news wire" },
  { path: "/mission-brief", label: "Mission Brief", icon: "📝", d: "What this is, data sources, privacy, support", k: "about sources privacy support sponsor" },
];

// Not in the nav strip, reachable from the footer and the lookup.
export const EXTRA_PAGES = [
  { path: "/terms", label: "Terms of Use", d: "Terms, disclaimer, privacy", k: "legal disclaimer privacy" },
];

// Tabs are addressed as /page#id. Each page reads the router hash on mount
// and on every navigation, so the lookup can land on a tab directly.
// Anchored sections on the Command Centre, addressed as /#id.
export const COMMAND_CENTRE_SECTIONS = [
  { id: "safety", label: "Field Safety", d: "UV index, AQHI and smoke, humidex and wind chill, daylight, working alone, WorkSafe links", k: "uv sun aqhi air quality smoke pm2.5 humidex heat wind chill cold frostbite daylight sunrise sunset twilight working alone lone worker check-in worksafe ohs regulator" },
];

// Anchored sections on the Career page, addressed as /career#id. The four
// pathways are also anchors (/career#asct and so on) and index themselves
// from src/data/career.js.
export const CAREER_SECTIONS = [
  { id: "cpd", label: "CPD Hour Log", d: "Log continuing professional development hours in the browser, totals per year and category, CSV export", k: "cpd hours log continuing professional development export csv asttbc" },
  { id: "pathways", label: "Certification Pathways", d: "AScT, BCLS, CLS and RPAS Advanced step by step, cited to the certifying bodies", k: "certification designation pathway asct bcls cls rpas advanced asttbc abcls acls transport canada cbeps articling exam" },
  { id: "reading", label: "Reading List", d: "Primary references: CSRS, CARs Part IX, TC AIM, ASPRS accuracy standards, survey acts", k: "reading references standards csrs cars part ix tc aim asprs accuracy survey act statute" },
  { id: "news", label: "News Wire", d: "Transport Canada, NRCan, BC Gov, LTSA, ACLS, ASTTBC and GoGeomatics, newest first", k: "news wire feed headlines" },
];

export const FLIGHT_OPS_TABS = [
  ["categories", "Operation Categories"],
  ["airspace", "Airspace"],
  ["preflight", "Pre-Flight"],
  ["weather", "Weather Mins"],
  ["sfoc", "SFOC Check"],
  ["changes", "2025 Changes"],
  ["links", "Resources"],
];

export const JURISDICTION_TABS = [
  { id: "prov", label: "Provincial Intel", icon: "🏛️" },
  { id: "muni", label: "Municipal Map", icon: "🗺️" },
];
