"""
Validate ArcGIS Hub Portal URLs

Checks if pattern-matched ArcGIS Hub URLs are real municipal portals
or phantom redirects to the global ArcGIS Hub catalogue.

A real portal has an organization-specific dataset count (< 50,000).
The global hub returns ~20 million datasets for any slug.

Usage:
  python scripts/validate_portals.py              # report + fix
  python scripts/validate_portals.py --dry-run    # report only
  python scripts/validate_portals.py --province NB
"""

import argparse
import json
import requests
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"

GLOBAL_HUB_THRESHOLD = 100_000  # Real municipal portals have < 100K datasets
RATE_LIMIT = 0.3  # seconds between API calls


def check_arcgis_hub(url):
    """Check if an ArcGIS Hub URL is a real portal or a phantom global redirect.
    Returns (is_real, dataset_count) tuple."""
    if "opendata.arcgis.com" not in url and "hub.arcgis.com" not in url:
        return True, -1  # Not an ArcGIS Hub URL, skip

    api_url = url.rstrip("/") + "/api/v3/datasets?page[size]=1"
    try:
        r = requests.get(api_url, timeout=10, headers={"User-Agent": "BCKGeo-Validator/1.0"})
        if r.status_code != 200:
            return True, -1  # Can't check, assume real

        data = r.json()
        total = data.get("meta", {}).get("total", 0)
        return total < GLOBAL_HUB_THRESHOLD, total
    except Exception:
        return True, -1  # Network error, assume real


def validate_province(prov_code, dry_run=False):
    """Validate portal URLs for a single province."""
    filepath = DATA_DIR / f"{prov_code.lower()}_research.json"
    if not filepath.exists():
        return 0, 0

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    entities = data.get("entities", [])
    checked = 0
    removed = 0

    for entity in entities:
        url = entity.get("openDataPortalUrl")
        if not url:
            continue
        if "opendata.arcgis.com" not in url and "hub.arcgis.com" not in url:
            continue

        time.sleep(RATE_LIMIT)
        is_real, count = check_arcgis_hub(url)
        checked += 1

        if not is_real:
            print(f"  PHANTOM: {entity['name']} ({entity.get('population', 0):,}) - {count:,} datasets - {url[:70]}")
            if not dry_run:
                entity["openDataPortalUrl"] = None
                entity["portalPlatform"] = None
                entity["dataFormats"] = None
                entity["apiEndpoint"] = None
                entity["dataLicence"] = None
                entity["hasPortal"] = False
            removed += 1

    if removed > 0 and not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")

    return checked, removed


def main():
    parser = argparse.ArgumentParser(description="Validate ArcGIS Hub portal URLs")
    parser.add_argument("--province", type=str, help="Province code (e.g., NB)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    provinces = [args.province.upper()] if args.province else [
        "BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "YT", "NT", "NU"
    ]

    print(f"\n=== ArcGIS Hub Portal Validation {'(DRY RUN)' if args.dry_run else ''} ===\n")

    total_checked = 0
    total_removed = 0

    for prov in provinces:
        checked, removed = validate_province(prov, dry_run=args.dry_run)
        if checked > 0:
            print(f"  {prov}: checked {checked}, phantom: {removed}")
        total_checked += checked
        total_removed += removed

    print(f"\n  TOTAL: checked {total_checked}, phantom URLs removed: {total_removed}")


if __name__ == "__main__":
    main()
