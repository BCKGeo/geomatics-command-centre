// The 12 Survey Tools calculators. Tab id doubles as the URL hash
// (/survey-tools#coords), which the quick lookup uses to land on a tool.
export const SURVEY_TOOLS = [
  { id: "coords", label: "Coordinates", icon: "📡", d: "Lat/lon in DD or DMS to UTM and MTM grid coordinates", k: "utm mtm dms convert projection" },
  { id: "inverse", label: "Inverse", icon: "📍", d: "Distance and bearing between two points", k: "azimuth bearing distance vincenty" },
  { id: "forward", label: "Forward", icon: "➡️", d: "New position from a point, bearing and distance", k: "azimuth direct" },
  { id: "scale", label: "Scale Factors", icon: "📏", d: "Grid, elevation and combined scale factors for a zone", k: "csf combined grid elevation factor" },
  { id: "area", label: "Area", icon: "⬛", d: "Polygon area and perimeter from coordinates", k: "hectares perimeter polygon" },
  { id: "intersect", label: "Intersections", icon: "✖️", d: "Bearing-bearing, bearing-distance and distance-distance intersections", k: "resection" },
  { id: "curves", label: "Curves", icon: "➰", d: "Horizontal curve elements from radius and angle", k: "radius tangent chord arc delta" },
  { id: "photo", label: "Photo Scale", icon: "📷", d: "Photo scale, GSD and ground coverage from flying height, focal length and sensor", k: "gsd ground sample distance coverage flying height camera" },
  { id: "mag", label: "Mag Dec", icon: "🧭", d: "Magnetic declination and inclination from WMM2025", k: "magnetic declination compass wmm dip" },
  { id: "units", label: "Units", icon: "⚖️", d: "Distance, speed, temperature, survey measures, area, volume", k: "convert feet chains links acres hectares" },
  { id: "traverse", label: "Traverse", icon: "💹", d: "Closed traverse misclosure and precision", k: "closure precision ratio" },
  { id: "level", label: "Levelling", icon: "📐", d: "Differential levelling run from backsights and foresights, with misclosure", k: "backsight foresight benchmark misclosure" },
];
