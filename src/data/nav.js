// Site navigation and per-page tab lists. Shared by the Layout, the pages
// that own the tabs, and the quick lookup index, so the lookup can never
// drift from what the pages actually show.
export const NAV = [
  { path: "/", label: "Command Centre", icon: "🖥️", d: "Weather, space weather, Kp index, GNSS conditions, satellites", k: "home dashboard weather kp aurora solar wind satellites sun" },
  { path: "/flight-ops", label: "Flight Ops", icon: "✈️", d: "RPAS categories, airspace, pre-flight checklist, weather minimums, SFOC", k: "drone rpas uav airspace notam checklist" },
  { path: "/geodesy", label: "Geodesy", icon: "🌍", d: "CSRS-PPP, datums, geoid models, RTK networks, observation times", k: "datum epoch nad83 csrs ppp geoid rtk gnss" },
  { path: "/gis", label: "GIS", icon: "🗺️", d: "CRS reference, formats, UTM zones, GDAL quick ref, analysis ops", k: "spatial epsg crs gdal ogr formats utm" },
  { path: "/remote-sensing", label: "Remote Sensing", icon: "👁️", d: "Overlap, spectral indices, accuracy specs, LAS classes, point clouds", k: "imagery lidar photogrammetry ndvi las point cloud satellite" },
  { path: "/jurisdictions", label: "Jurisdictions", icon: "🏛️", d: "Provincial intel for 13 jurisdictions plus federal, municipal map", k: "province territory federal portals municipal map" },
  { path: "/survey-tools", label: "Survey Tools", icon: "🔧", d: "12 field calculators", k: "calculator coordinates traverse curve area" },
  { path: "/codex", label: "Codex", icon: "🔎", d: "Geomatics glossary", k: "glossary terms definitions dictionary" },
  { path: "/mission-brief", label: "Mission Brief", icon: "📝", d: "News wire, what this is, data sources, privacy", k: "news about sources privacy" },
];

// Not in the nav strip, reachable from the footer and the lookup.
export const EXTRA_PAGES = [
  { path: "/terms", label: "Terms of Use", d: "Terms, disclaimer, privacy", k: "legal disclaimer privacy" },
];

// Tabs are addressed as /page#id. Each page reads the router hash on mount
// and on every navigation, so the lookup can land on a tab directly.
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
