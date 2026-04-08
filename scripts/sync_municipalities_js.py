"""
Sync province research JSON files into src/data/municipalities.js for the dashboard map.

Reads all data/open-data-portals/{prov}_research.json files and generates
an updated municipalities.js with the lean 11-field schema for map rendering.

Usage:
  python scripts/sync_municipalities_js.py
  python scripts/sync_municipalities_js.py --dry-run
  python scripts/sync_municipalities_js.py --stats
"""

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
MUNIS_JS = ROOT / "src" / "data" / "municipalities.js"

PROVINCE_ORDER = ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "YT", "NT", "NU"]

PROVINCE_NAMES = {
    "BC": "British Columbia", "AB": "Alberta", "SK": "Saskatchewan",
    "MB": "Manitoba", "ON": "Ontario", "QC": "Quebec",
    "NB": "New Brunswick", "NS": "Nova Scotia", "PE": "Prince Edward Island",
    "NL": "Newfoundland and Labrador", "YT": "Yukon",
    "NT": "Northwest Territories", "NU": "Nunavut",
}


def get_tier_from_pop(pop):
    """Assign tier from population."""
    if pop >= 50000:
        return 1
    elif pop >= 10000:
        return 2
    return 3


def load_research_files():
    """Load all province research JSON files."""
    all_entities = {}

    for json_file in sorted(DATA_DIR.glob("*_research.json")):
        prov_code = json_file.stem.split("_")[0].upper()
        with open(json_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        for entity in data.get("entities", []):
            key = f"{entity['name']}|{prov_code}"
            all_entities[key] = {
                "name": entity["name"],
                "province": prov_code,
                "lat": entity.get("lat"),
                "lon": entity.get("lon"),
                "population": entity.get("population", 0),
                "entityType": entity.get("entityType", "Municipality"),
                "tier": entity.get("tier", 3),
                "hasPortal": bool(entity.get("openDataPortalUrl")),
                "parentGeography": entity.get("parentGeography"),
                "portalUrl": entity.get("openDataPortalUrl"),
                "councilUrl": entity.get("councilUrl"),
                "surveyStandards": entity.get("engineeringStandardsUrl"),
            }

    return all_entities


def load_existing_municipalities():
    """Parse existing municipalities.js to preserve manually-curated data for provinces without research JSONs."""
    if not MUNIS_JS.exists():
        return {}

    content = MUNIS_JS.read_text(encoding="utf-8")
    existing = {}

    import re
    # Match each municipality object block and extract all fields
    block_pattern = r'\{\s*\n((?:\s+\w+:.*\n)+)\s*\}'
    field_pattern = r'(\w+):\s*(?:"([^"]*?)"|(-?\d+(?:\.\d+)?)|null|(true|false))'

    for block in re.finditer(block_pattern, content):
        fields = {}
        for field in re.finditer(field_pattern, block.group(1)):
            key = field.group(1)
            if field.group(2) is not None:
                fields[key] = field.group(2)
            elif field.group(3) is not None:
                val = field.group(3)
                fields[key] = float(val) if '.' in val else int(val)
            elif field.group(4) is not None:
                fields[key] = field.group(4) == 'true'
            else:
                fields[key] = None

        if 'name' in fields and 'province' in fields:
            lookup = f"{fields['name']}|{fields['province']}"
            existing[lookup] = fields

    return existing


def format_js_value(value):
    """Format a Python value as JS literal."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        return f'"{value}"'
    return "null"


def generate_municipalities_js(entities_by_province):
    """Generate the municipalities.js file content."""
    lines = ["export const MUNICIPALITIES = ["]

    for prov in PROVINCE_ORDER:
        prov_entities = entities_by_province.get(prov, [])
        if not prov_entities:
            continue

        lines.append(f"  // {PROVINCE_NAMES.get(prov, prov)}")

        # Sort by population descending within each province
        prov_entities.sort(key=lambda e: e.get("population", 0), reverse=True)

        for entity in prov_entities:
            # Skip entities without coordinates
            if not entity.get("lat") or not entity.get("lon"):
                continue

            lines.append("  {")
            lines.append(f'    name: {format_js_value(entity["name"])},')
            lines.append(f'    province: {format_js_value(entity["province"])},')
            lines.append(f'    lat: {entity["lat"]},')
            lines.append(f'    lon: {entity["lon"]},')
            lines.append(f'    population: {entity.get("population", 0)},')
            lines.append(f'    entityType: {format_js_value(entity.get("entityType"))},')
            lines.append(f'    tier: {entity.get("tier", 3)},')
            lines.append(f'    hasPortal: {format_js_value(entity.get("hasPortal", False))},')
            lines.append(f'    parentGeography: {format_js_value(entity.get("parentGeography"))},')
            lines.append(f'    portalUrl: {format_js_value(entity.get("portalUrl"))},')
            lines.append(f'    councilUrl: {format_js_value(entity.get("councilUrl"))},')
            lines.append(f'    surveyStandards: {format_js_value(entity.get("surveyStandards"))},')
            lines.append("  },")

    lines.append("];")
    lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Sync research JSON into municipalities.js")
    parser.add_argument("--dry-run", action="store_true", help="Print stats without writing")
    parser.add_argument("--stats", action="store_true", help="Show stats only")

    args = parser.parse_args()

    print("Loading research JSON files...")
    all_entities = load_research_files()
    research_provinces = set()
    for key, entity in all_entities.items():
        research_provinces.add(entity["province"])

    # Load existing municipalities.js to preserve entries for provinces without research JSONs
    print("Loading existing municipalities.js...")
    existing = load_existing_municipalities()
    preserved = 0
    for key, fields in existing.items():
        prov = fields.get("province", "")
        if prov not in research_provinces and key not in all_entities:
            # Convert old field names to new schema
            all_entities[key] = {
                "name": fields.get("name", ""),
                "province": prov,
                "lat": fields.get("lat"),
                "lon": fields.get("lon"),
                "population": fields.get("population", 0),
                "entityType": fields.get("entityType", "City"),
                "tier": fields.get("tier", get_tier_from_pop(fields.get("population", 0))),
                "hasPortal": bool(fields.get("portalUrl") or fields.get("gisPortal")),
                "parentGeography": fields.get("parentGeography"),
                "portalUrl": fields.get("portalUrl") or fields.get("gisPortal"),
                "councilUrl": fields.get("councilUrl"),
                "surveyStandards": fields.get("surveyStandards"),
            }
            preserved += 1

    if preserved:
        print(f"  Preserved {preserved} entries from provinces without research JSONs")

    if not all_entities:
        print("No research JSON files found and no existing municipalities.js")
        return

    # Group by province
    by_province = {}
    for key, entity in all_entities.items():
        prov = entity["province"]
        if prov not in by_province:
            by_province[prov] = []
        by_province[prov].append(entity)

    # Stats
    total = len(all_entities)
    with_coords = sum(1 for e in all_entities.values() if e.get("lat") and e.get("lon"))
    with_portal = sum(1 for e in all_entities.values() if e.get("hasPortal"))
    with_council = sum(1 for e in all_entities.values() if e.get("councilUrl"))
    tier_counts = {1: 0, 2: 0, 3: 0}
    for e in all_entities.values():
        t = e.get("tier", 3)
        if t not in tier_counts:
            t = 3
        tier_counts[t] += 1

    print(f"\nTotal entities: {total}")
    print(f"  With coordinates: {with_coords}")
    print(f"  With portal: {with_portal}")
    print(f"  With council URL: {with_council}")
    print(f"  Tier 1: {tier_counts[1]}, Tier 2: {tier_counts[2]}, Tier 3: {tier_counts[3]}")
    print(f"\nBy province:")
    for prov in PROVINCE_ORDER:
        count = len(by_province.get(prov, []))
        if count:
            print(f"  {prov}: {count}")

    if args.stats or args.dry_run:
        if args.dry_run:
            print("\n[DRY RUN] Would write municipalities.js with above data.")
        return

    # Generate and write
    js_content = generate_municipalities_js(by_province)
    MUNIS_JS.write_text(js_content, encoding="utf-8")
    print(f"\nWrote: {MUNIS_JS}")
    print(f"  {with_coords} municipalities with coordinates")


if __name__ == "__main__":
    main()
