// Maps 38 entity types to 4 shape categories for marker icons
const CATEGORY_MAP = {
  // City-tier (circle)
  "City": "city",
  "Ville": "city",

  // Town-tier (triangle)
  "Town": "town",
  "Village": "town",
  "Hamlet": "town",
  "Summer Village": "town",
  "Resort Village": "town",
  "Northern Hamlet": "town",
  "Northern Village": "town",
  "Northern Town": "town",
  "Settlement": "town",
  "Resort Municipality": "town",
  "Mountain Resort Municipality": "town",

  // Municipality-tier (square)
  "Municipality": "municipality",
  "Rural Municipality": "municipality",
  "Municipal District": "municipality",
  "District Municipality": "municipality",
  "Township": "municipality",
  "Municipalite": "municipality",
  "Canton": "municipality",
  "Canton Uni": "municipality",
  "Paroisse": "municipality",
  "Rural Community": "municipality",
  "Specialized Municipality": "municipality",
  "Local Government District": "municipality",
  "Charter Community": "municipality",
  "Community Government": "municipality",
  "Inuit Community": "municipality",
  "Island Municipality": "municipality",
  "Indian Government District": "municipality",

  // Regional-tier (diamond)
  "Regional District": "regional",
  "County": "regional",
  "MRC": "regional",
  "Regional Municipality": "regional",
  "County Municipality": "regional",
  "Special Area": "regional",
  "Improvement District": "regional",
  "Equivalent Territory": "regional",
};

export function getShapeCategory(entityType) {
  return CATEGORY_MAP[entityType] || "municipality";
}

export function getCoverageScore(entry) {
  return [entry.portalUrl, entry.municipalUrl, entry.surveyStandards].filter(Boolean).length;
}

export function getCoverageColor(score) {
  if (score === 3) return "green";
  if (score >= 1) return "amber";
  return "grey";
}

export function getSpriteId(shapeCategory, coverageColor, hasStandards) {
  return `${shapeCategory}-${coverageColor}${hasStandards ? "-ring" : ""}`;
}
