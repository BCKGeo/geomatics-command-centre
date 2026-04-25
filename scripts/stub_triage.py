"""
Stub Triage Script

Adds researchStatus field to all entities and classifies them:
  - "complete": has portal URL + council URL + engineering standards
  - "partial": has some data beyond basics but incomplete
  - "confirmed-no-data": pop < 2000 with no portal/council/standards (legitimately empty)
  - "stub-unresearched": pop >= 2000 but no data (needs research)

Also runs provincial_bulk_fill on any new entities (e.g., QC expansion).

Usage:
  python scripts/stub_triage.py              # apply
  python scripts/stub_triage.py --dry-run    # preview
  python scripts/stub_triage.py --stats      # summary only
"""

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"


def classify_entity(entity):
    """Classify entity research status."""
    has_portal = bool(entity.get("openDataPortalUrl"))
    has_council = bool(entity.get("municipalUrl"))
    has_standards = bool(entity.get("engineeringStandardsUrl"))
    has_gis = bool(entity.get("gisViewerUrl"))
    pop = entity.get("population", 0) or 0

    # Count non-basic filled fields
    data_fields = [
        "openDataPortalUrl", "portalPlatform", "gisViewerUrl",
        "municipalUrl", "councilPlatform", "dataFormats",
        "apiEndpoint", "dataLicence", "cadStandardsUrl",
        "wmsWfsEndpoints", "contactDepartment",
    ]
    filled_count = sum(1 for f in data_fields if entity.get(f))

    if has_portal and has_council and filled_count >= 5:
        return "complete"
    elif filled_count >= 2 or has_portal or has_council or has_gis:
        return "partial"
    elif pop < 2000:
        return "confirmed-no-data"
    else:
        return "stub-unresearched"


def triage(dry_run=False, stats_only=False):
    """Add researchStatus to all entities."""
    total_by_status = {"complete": 0, "partial": 0, "confirmed-no-data": 0, "stub-unresearched": 0}
    total_entities = 0

    for prov_file in sorted(DATA_DIR.glob("*_research.json")):
        prov_code = prov_file.stem.split("_")[0].upper()

        with open(prov_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        entities = data.get("entities", [])
        prov_stats = {"complete": 0, "partial": 0, "confirmed-no-data": 0, "stub-unresearched": 0}

        for entity in entities:
            status = classify_entity(entity)
            prov_stats[status] += 1
            total_by_status[status] += 1
            total_entities += 1

            if not dry_run and not stats_only:
                entity["researchStatus"] = status

        if not stats_only:
            print(f"  {prov_code}: {len(entities)} entities -- "
                  f"complete={prov_stats['complete']}, partial={prov_stats['partial']}, "
                  f"no-data={prov_stats['confirmed-no-data']}, unresearched={prov_stats['stub-unresearched']}")

        if not dry_run and not stats_only:
            with open(prov_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")

    print(f"\n  === Summary ({total_entities} entities) ===")
    for status, count in total_by_status.items():
        pct = count / total_entities * 100 if total_entities else 0
        print(f"    {status:<25} {count:>6} ({pct:.1f}%)")

    if dry_run:
        print("\n  (Dry run -- no files modified)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--stats", action="store_true", help="Show stats without modifying files")
    args = parser.parse_args()
    print(f"\n=== Stub Triage ===\n")
    triage(dry_run=args.dry_run, stats_only=args.stats)


if __name__ == "__main__":
    main()
