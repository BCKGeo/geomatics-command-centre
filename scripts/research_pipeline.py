"""
Canadian Open Data Portals Research Pipeline

Generates baseline municipality data per province, discovers portal URLs via
pattern matching, assigns coordinate reference systems, and outputs structured
JSON ready for agent verification and Excel generation.

Usage:
  python scripts/research_pipeline.py --province AB
  python scripts/research_pipeline.py --province AB --skip-url-check
  python scripts/research_pipeline.py --province AB --phase baseline
  python scripts/research_pipeline.py --list-provinces

Phases: baseline, url-discovery, crs-assignment, merge
"""

import argparse
import json
import os
import sys
import time
import re
import requests
from pathlib import Path
from urllib.parse import quote

# Project root
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
BASELINE_DIR = DATA_DIR / "baseline"

# Province metadata
PROVINCES = {
    "BC": {"name": "British Columbia", "pop2021": 5000879},
    "AB": {"name": "Alberta", "pop2021": 4262635},
    "SK": {"name": "Saskatchewan", "pop2021": 1132505},
    "MB": {"name": "Manitoba", "pop2021": 1342153},
    "ON": {"name": "Ontario", "pop2021": 14223942},
    "QC": {"name": "Quebec", "pop2021": 8501833},
    "NB": {"name": "New Brunswick", "pop2021": 775610},
    "NS": {"name": "Nova Scotia", "pop2021": 969383},
    "PE": {"name": "Prince Edward Island", "pop2021": 154331},
    "NL": {"name": "Newfoundland and Labrador", "pop2021": 510550},
    "YT": {"name": "Yukon", "pop2021": 40232},
    "NT": {"name": "Northwest Territories", "pop2021": 41070},
    "NU": {"name": "Nunavut", "pop2021": 36858},
}

# CSD type to entity type mapping
CSD_TYPE_MAP = {
    "C": "City", "CY": "City", "T": "Town", "VL": "Village",
    "DM": "District Municipality", "RM": "Rural Municipality",
    "CT": "County", "RD": "Regional District",
    "SM": "Specialized Municipality", "MD": "Municipal District",
    "SV": "Summer Village", "ID": "Improvement District",
    "P": "Parish", "TP": "Township", "MU": "Municipality",
    "CU": "Canton Unite", "V": "Ville", "PE": "Paroisse",
    "TV": "Town/Ville", "RGM": "Regional Municipality",
    "IRI": "Indian Reserve", "S-E": "Indian Settlement",
    "NH": "Northern Hamlet", "NV": "Northern Village",
    "NO": "Unorganized Territory", "SET": "Settlement",
    "CC": "Chartered Community", "HAM": "Hamlet",
    "RV": "Resort Village", "IM": "Island Municipality",
    "IGD": "Indian Government District",
}

# URL patterns for portal discovery
URL_PATTERNS = {
    "arcgis_hub": [
        "https://data-{slug}.opendata.arcgis.com/",
        "https://{slug}.hub.arcgis.com/",
        "https://geohub-{slug}.hub.arcgis.com/",
        "https://data-{slug}.hub.arcgis.com/",
        "https://open-data-{slug}.hub.arcgis.com/",
    ],
    "civicweb": [
        "https://{slug}.civicweb.net/Portal/",
        "https://{slug}.civicweb.net/portal/",
    ],
    "escribe": [
        "https://pub-{slug}.escribemeetings.com/",
    ],
    "ckan": [
        "https://data.{slug}.ca/",
        "https://opendata.{slug}.ca/",
        "https://open.{slug}.ca/",
    ],
}

# CRS by longitude bands (UTM zones for NAD83)
UTM_ZONES = {
    # (min_lon, max_lon): (zone, epsg)
    (-144, -138): ("UTM Zone 7N", "EPSG:26907"),
    (-138, -132): ("UTM Zone 8N", "EPSG:26908"),
    (-132, -126): ("UTM Zone 9N", "EPSG:26909"),
    (-126, -120): ("UTM Zone 10N", "EPSG:26910"),
    (-120, -114): ("UTM Zone 11N", "EPSG:26911"),
    (-114, -108): ("UTM Zone 12N", "EPSG:26912"),
    (-108, -102): ("UTM Zone 13N", "EPSG:26913"),
    (-102, -96):  ("UTM Zone 14N", "EPSG:26914"),
    (-96, -90):   ("UTM Zone 15N", "EPSG:26915"),
    (-90, -84):   ("UTM Zone 16N", "EPSG:26916"),
    (-84, -78):   ("UTM Zone 17N", "EPSG:26917"),
    (-78, -72):   ("UTM Zone 18N", "EPSG:26918"),
    (-72, -66):   ("UTM Zone 19N", "EPSG:26919"),
    (-66, -60):   ("UTM Zone 20N", "EPSG:26920"),
    (-60, -54):   ("UTM Zone 21N", "EPSG:26921"),
    (-54, -48):   ("UTM Zone 22N", "EPSG:26922"),
}

# Provincial CRS overrides (used in addition to UTM)
PROVINCIAL_CRS = {
    "BC": "BC Albers (EPSG:3005)",
    "AB": "Alberta 10-TM (EPSG:3402)",
    "ON": "Ontario MNR Lambert (EPSG:3161)",
    "QC": "Quebec Lambert (EPSG:32198)",
    "NB": "NB Stereographic Double (EPSG:2953)",
    "NS": "MTM Zone 5 (EPSG:2295)",
    "PE": "PEI Stereographic (EPSG:2954)",
    "NL": "UTM Zone 21N / NL Labrador (EPSG:26921)",
}


def slugify(name):
    """Convert municipality name to URL slug."""
    slug = name.lower().strip()
    # Remove common suffixes
    for suffix in [" (city)", " (town)", " (village)", " (municipality)", " (county)"]:
        slug = slug.replace(suffix, "")
    # Handle special characters
    slug = slug.replace("st. ", "st").replace("ste. ", "ste")
    slug = slug.replace("'", "").replace("'", "")
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    return slug


def get_tier(population):
    """Assign research tier based on population."""
    if not population:
        return 3
    if population >= 50000:
        return 1
    elif population >= 10000:
        return 2
    else:
        return 3


def get_entity_type(csd_type):
    """Map CSD type code to entity type name."""
    return CSD_TYPE_MAP.get(csd_type, "Other Municipal")


def assign_crs(lon, province):
    """Assign coordinate reference system based on longitude and province."""
    # UTM zone from longitude
    utm_zone = None
    for (min_lon, max_lon), (zone_name, epsg) in UTM_ZONES.items():
        if min_lon <= lon < max_lon:
            utm_zone = f"NAD83(CSRS) {zone_name}"
            break
    if utm_zone is None:
        utm_zone = "NAD83(CSRS)"

    # Add provincial CRS if available
    prov_crs = PROVINCIAL_CRS.get(province)
    if prov_crs:
        return f"{utm_zone}; Provincial: {prov_crs}"
    return utm_zone


def check_url(url, timeout=5):
    """Check if a URL exists (returns 200-level status)."""
    try:
        resp = requests.head(url, timeout=timeout, allow_redirects=True,
                           headers={"User-Agent": "BCKGeo-Research/1.0"})
        return resp.status_code < 400
    except (requests.RequestException, Exception):
        return False


def discover_urls(entity, rate_limit=0.5):
    """Try known URL patterns for a municipality."""
    slug = slugify(entity["name"])
    discovered = {}

    # Try open data portal patterns
    for pattern_group, patterns in URL_PATTERNS.items():
        for pattern in patterns:
            url = pattern.format(slug=slug)
            time.sleep(rate_limit)
            if check_url(url):
                if pattern_group in ("arcgis_hub", "ckan"):
                    discovered["openDataPortalUrl"] = url
                    discovered["portalPlatform"] = {
                        "arcgis_hub": "ArcGIS Hub",
                        "ckan": "CKAN",
                    }.get(pattern_group, "Custom")
                    if pattern_group == "arcgis_hub":
                        discovered["dataFormats"] = "SHP, GeoJSON, CSV, KML"
                        discovered["apiEndpoint"] = "ArcGIS REST"
                        discovered["dataLicence"] = "OGL"
                elif pattern_group == "civicweb":
                    discovered["councilUrl"] = url
                    discovered["councilPortalName"] = "CivicWeb"
                    discovered["councilPlatform"] = "CivicWeb"
                elif pattern_group == "escribe":
                    discovered["councilUrl"] = url
                    discovered["councilPortalName"] = "eScribe"
                    discovered["councilPlatform"] = "eScribe"
                break  # Found one in this group, move on

    return discovered


def make_empty_entity(name, entity_type, population, lat, lon, province, parent_geo=None):
    """Create an empty entity dict with all 27 fields."""
    return {
        "name": name,
        "entityType": entity_type,
        "population": population,
        "tier": get_tier(population),
        "lat": lat,
        "lon": lon,
        "parentGeography": parent_geo,
        "openDataPortalName": None,
        "openDataPortalUrl": None,
        "portalPlatform": None,
        "gisViewerName": None,
        "gisViewerUrl": None,
        "councilPortalName": None,
        "councilUrl": None,
        "councilPlatform": None,
        "engineeringStandardsUrl": None,
        "cadStandardsUrl": None,
        "constructionStandards": None,
        "dataFormats": None,
        "coordinateSystem": assign_crs(lon, province),
        "lidarAvailable": False,
        "orthophotoAvailable": False,
        "wmsWfsEndpoints": None,
        "apiEndpoint": None,
        "dataLicence": None,
        "contactDepartment": None,
        "industryFocus": None,
        "description": f"{entity_type} in {PROVINCES[province]['name']}. Pop. {population:,} (2021 Census).",
        "lastVerified": None,
    }


def load_baseline(province):
    """Load existing baseline JSON if it exists."""
    path = BASELINE_DIR / f"{province.lower()}_baseline.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def save_baseline(province, data):
    """Save baseline JSON."""
    BASELINE_DIR.mkdir(parents=True, exist_ok=True)
    path = BASELINE_DIR / f"{province.lower()}_baseline.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved baseline: {path}")


def load_research(province):
    """Load existing research JSON if it exists."""
    path = DATA_DIR / f"{province.lower()}_research.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def save_research(province, data):
    """Save research JSON."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / f"{province.lower()}_research.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved research: {path}")


def merge_entity(base, updates):
    """Merge discovered data into base entity, only filling null fields."""
    for key, value in updates.items():
        if key in base and (base[key] is None or base[key] is False) and value:
            base[key] = value
    return base


def run_url_discovery(data, rate_limit=0.5):
    """Run URL pattern discovery on all entities."""
    entities = data["entities"]
    total = len(entities)
    discovered_count = 0

    for i, entity in enumerate(entities):
        # Skip entities that already have portal URLs
        if entity.get("openDataPortalUrl") and entity.get("councilUrl"):
            continue

        tier = entity.get("tier", 3)
        # For Tier 3, only check if population > 1000
        if tier == 3 and entity.get("population", 0) < 1000:
            continue

        print(f"  [{i+1}/{total}] Checking {entity['name']}...", end="", flush=True)
        urls = discover_urls(entity, rate_limit=rate_limit)
        if urls:
            merge_entity(entity, urls)
            discovered_count += 1
            found = ", ".join(f"{k}" for k in urls.keys())
            print(f" found: {found}")
        else:
            print(" nothing")

    print(f"  Discovered URLs for {discovered_count}/{total} entities")
    return data


def run_crs_assignment(data, province):
    """Assign CRS to all entities based on their coordinates."""
    for entity in data["entities"]:
        if entity.get("lon") and not entity.get("coordinateSystem"):
            entity["coordinateSystem"] = assign_crs(entity["lon"], province)
    return data


def run_pipeline(province, phases=None, skip_url_check=False):
    """Run the full pipeline for a province."""
    prov_code = province.upper()
    if prov_code not in PROVINCES:
        print(f"Error: Unknown province code '{prov_code}'")
        sys.exit(1)

    prov_name = PROVINCES[prov_code]["name"]
    print(f"\n{'='*60}")
    print(f"Research Pipeline: {prov_name} ({prov_code})")
    print(f"{'='*60}")

    all_phases = ["baseline", "url-discovery", "crs-assignment", "merge"]
    if phases:
        run_phases = [p for p in all_phases if p in phases]
    else:
        run_phases = all_phases

    # Always load data first (baseline or research JSON)
    print(f"\n--- Phase 1: Baseline ---")
    data = load_research(prov_code)
    if data:
        print(f"  Loaded existing research: {len(data['entities'])} entities")
    else:
        data = load_baseline(prov_code)
        if data:
            print(f"  Loaded existing baseline: {len(data['entities'])} entities")
        else:
            print(f"  No baseline found for {prov_code}.")
            print(f"  Create {BASELINE_DIR}/{prov_code.lower()}_baseline.json manually or via agent research.")
            print(f"  Then re-run: python scripts/research_pipeline.py --province {prov_code}")
            return None

    # Phase 2: URL pattern discovery
    if "url-discovery" in run_phases and not skip_url_check:
        print(f"\n--- Phase 2: URL Discovery ---")
        data = run_url_discovery(data, rate_limit=0.5)
        save_baseline(prov_code, data)

    # Phase 3: CRS assignment
    if "crs-assignment" in run_phases:
        print(f"\n--- Phase 3: CRS Assignment ---")
        data = run_crs_assignment(data, prov_code)

    # Phase 4: Merge and output
    if "merge" in run_phases:
        print(f"\n--- Phase 4: Merge & Output ---")
        # Add metadata
        from datetime import date
        data["province"] = prov_code
        data["provinceName"] = prov_name
        data["lastUpdated"] = date.today().isoformat()

        # Count stats
        entities = data["entities"]
        tier_counts = {1: 0, 2: 0, 3: 0}
        portal_count = 0
        council_count = 0
        for e in entities:
            tier_counts[e.get("tier", 3)] += 1
            if e.get("openDataPortalUrl"):
                portal_count += 1
            if e.get("councilUrl"):
                council_count += 1

        print(f"  Total entities: {len(entities)}")
        print(f"  Tier 1: {tier_counts[1]}, Tier 2: {tier_counts[2]}, Tier 3: {tier_counts[3]}")
        print(f"  With portal: {portal_count}, With council URL: {council_count}")

        save_research(prov_code, data)

    print(f"\nPipeline complete for {prov_name}.")
    return data


def main():
    parser = argparse.ArgumentParser(description="Canadian Open Data Portals Research Pipeline")
    parser.add_argument("--province", "-p", help="Province code (e.g., AB, ON, QC)")
    parser.add_argument("--phase", help="Run specific phase only (baseline, url-discovery, crs-assignment, merge)")
    parser.add_argument("--skip-url-check", action="store_true", help="Skip URL pattern discovery (HTTP checks)")
    parser.add_argument("--list-provinces", action="store_true", help="List all province codes")

    args = parser.parse_args()

    if args.list_provinces:
        print("\nProvince/Territory Codes:")
        for code, info in sorted(PROVINCES.items()):
            print(f"  {code} - {info['name']} (pop. {info['pop2021']:,})")
        return

    if not args.province:
        parser.print_help()
        return

    phases = [args.phase] if args.phase else None
    run_pipeline(args.province, phases=phases, skip_url_check=args.skip_url_check)


if __name__ == "__main__":
    main()
