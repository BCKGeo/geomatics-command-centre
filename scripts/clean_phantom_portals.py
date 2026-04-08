"""
Clean Phantom ArcGIS Hub Portal URLs

Removes fake portal URLs that match the pattern data-{slug}.opendata.arcgis.com.
These are global ArcGIS Hub redirects, not real municipal portals.

Real portals use custom domains (e.g., open.moncton.ca, data.calgary.ca) or
verified organization-specific Hub URLs.

Usage:
  python scripts/clean_phantom_portals.py              # clean all
  python scripts/clean_phantom_portals.py --dry-run    # preview
"""

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"

# Pattern for phantom ArcGIS Hub URLs -- any data-{slug}.opendata.arcgis.com
PHANTOM_PATTERN = re.compile(r"https://data-[a-z0-9-]+\.opendata\.arcgis\.com")

# Verified real portals that happen to use the pattern but are confirmed real orgs
VERIFIED_REAL = {
    # Add specific URLs here if any data-{slug} URLs are confirmed to be real org portals
    # Format: "https://data-cityname.opendata.arcgis.com/"
}


def clean_province(prov_code, dry_run=False):
    filepath = DATA_DIR / f"{prov_code.lower()}_research.json"
    if not filepath.exists():
        return 0, 0

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    entities = data.get("entities", [])
    cleaned = 0

    for entity in entities:
        url = entity.get("openDataPortalUrl", "")
        if not url:
            continue
        if not PHANTOM_PATTERN.match(url):
            continue
        if url in VERIFIED_REAL:
            continue

        if not dry_run:
            entity["openDataPortalUrl"] = None
            entity["portalPlatform"] = None
            entity["dataFormats"] = None
            entity["apiEndpoint"] = None
            entity["dataLicence"] = None
        cleaned += 1

    if cleaned > 0 and not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")

    return len(entities), cleaned


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    print(f"\n=== Clean Phantom Portal URLs {'(DRY RUN)' if args.dry_run else ''} ===\n")

    total = 0
    total_cleaned = 0
    provinces = ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "YT", "NT", "NU"]

    for prov in provinces:
        count, cleaned = clean_province(prov, dry_run=args.dry_run)
        if cleaned > 0:
            print(f"  {prov}: {cleaned} phantom URLs removed (of {count} entities)")
        total += count
        total_cleaned += cleaned

    print(f"\n  TOTAL: {total_cleaned} phantom URLs {'would be ' if args.dry_run else ''}removed")


if __name__ == "__main__":
    main()
