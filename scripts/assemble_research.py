"""
Assemble a province research JSON from baseline + agent research data.

Merges the municipality baseline list with detailed research from agent outputs.
Used after agent research completes to produce the final {prov}_research.json.

Usage:
  python scripts/assemble_research.py --province AB
"""

import argparse
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
BASELINE_DIR = DATA_DIR / "baseline"

PROVINCES = {
    "BC": "British Columbia", "AB": "Alberta", "SK": "Saskatchewan",
    "MB": "Manitoba", "ON": "Ontario", "QC": "Quebec",
    "NB": "New Brunswick", "NS": "Nova Scotia", "PE": "Prince Edward Island",
    "NL": "Newfoundland and Labrador", "YT": "Yukon",
    "NT": "Northwest Territories", "NU": "Nunavut",
}


def load_json(path):
    """Load JSON file if it exists."""
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def normalize_name(name):
    """Normalize municipality name for matching."""
    return name.strip().lower().replace("'", "'").replace("\u2019", "'")


def merge_entity(base, update):
    """Merge update fields into base entity, only overwriting null/empty/False fields."""
    for key, value in update.items():
        if key in ("name", "lat", "lon", "population", "entityType", "tier"):
            # Always take update for core fields if they have values
            if value is not None and value != 0 and value != "":
                base[key] = value
        elif key in base:
            # Only overwrite if base is empty/null/False and update has data
            if (base[key] is None or base[key] == "" or base[key] is False) and value:
                base[key] = value
    return base


def assemble(province_code):
    """Assemble the final research JSON for a province."""
    prov = province_code.upper()
    if prov not in PROVINCES:
        print(f"Unknown province: {prov}")
        return

    prov_name = PROVINCES[prov]
    print(f"\nAssembling research for {prov_name} ({prov})")

    # Load baseline (complete municipality list)
    baseline_path = BASELINE_DIR / f"{prov.lower()}_baseline.json"
    baseline = load_json(baseline_path)

    if not baseline:
        print(f"  No baseline found at {baseline_path}")
        return

    entities = baseline if isinstance(baseline, list) else baseline.get("entities", baseline)
    print(f"  Baseline: {len(entities)} entities")

    # Build lookup by normalized name
    entity_map = {}
    for e in entities:
        key = normalize_name(e["name"])
        entity_map[key] = e

    # Load and merge Tier 1 research
    tier1_path = BASELINE_DIR / f"{prov.lower()}_tier1.json"
    tier1 = load_json(tier1_path)
    if tier1:
        items = tier1 if isinstance(tier1, list) else tier1.get("entities", [])
        merged = 0
        for item in items:
            key = normalize_name(item["name"])
            if key in entity_map:
                merge_entity(entity_map[key], item)
                merged += 1
            else:
                # New entity from Tier 1 research
                entities.append(item)
                entity_map[key] = item
                merged += 1
        print(f"  Tier 1: merged {merged} entries")

    # Load and merge Tier 2 research
    tier2_path = BASELINE_DIR / f"{prov.lower()}_tier2.json"
    tier2 = load_json(tier2_path)
    if tier2:
        items = tier2 if isinstance(tier2, list) else tier2.get("entities", [])
        merged = 0
        for item in items:
            key = normalize_name(item["name"])
            if key in entity_map:
                merge_entity(entity_map[key], item)
                merged += 1
            else:
                entities.append(item)
                entity_map[key] = item
                merged += 1
        print(f"  Tier 2: merged {merged} entries")

    # Load standards
    standards_path = BASELINE_DIR / f"{prov.lower()}_standards.json"
    standards = load_json(standards_path) or []
    print(f"  Standards: {len(standards)} entries")

    # Build final research JSON
    research = {
        "province": prov,
        "provinceName": prov_name,
        "lastUpdated": date.today().isoformat(),
        "entities": entities,
        "standards": standards,
    }

    # Stats
    tier_counts = {1: 0, 2: 0, 3: 0}
    portal_count = 0
    council_count = 0
    standards_count = 0
    for e in entities:
        tier_counts[e.get("tier", 3)] += 1
        if e.get("openDataPortalUrl"):
            portal_count += 1
        if e.get("councilUrl"):
            council_count += 1
        if e.get("engineeringStandardsUrl"):
            standards_count += 1

    print(f"\n  Final: {len(entities)} entities")
    print(f"  Tier 1: {tier_counts[1]}, Tier 2: {tier_counts[2]}, Tier 3: {tier_counts[3]}")
    print(f"  With portal: {portal_count}")
    print(f"  With council: {council_count}")
    print(f"  With standards: {standards_count}")

    # Save
    out_path = DATA_DIR / f"{prov.lower()}_research.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(research, f, indent=2, ensure_ascii=False)
    print(f"\n  Saved: {out_path}")


def main():
    parser = argparse.ArgumentParser(description="Assemble province research JSON")
    parser.add_argument("--province", "-p", required=True, help="Province code (e.g., AB)")
    args = parser.parse_args()
    assemble(args.province)


if __name__ == "__main__":
    main()
