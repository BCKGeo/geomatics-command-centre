"""
Quebec Municipality Expansion Script

Expands QC research JSON from 265 to ~1,100+ municipalities using
StatCan 2021 Census data (population table + Geographic Attribute File).

Sources:
  - data/statcan/98100002.csv (Table 98-10-0002: Population by CSD)
  - data/statcan/2021_92-151_X_utf.csv (Geographic Attribute File: coordinates)

Usage:
  python scripts/expand_quebec.py              # expand and save
  python scripts/expand_quebec.py --dry-run    # preview only
  python scripts/expand_quebec.py --stats      # show before/after stats
"""

import argparse
import csv
import json
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
STATCAN_DIR = ROOT / "data" / "statcan"
TODAY = date.today().isoformat()

# Quebec CSD type mapping (StatCan codes to entity types)
QC_CSD_TYPES = {
    "V": "Ville",
    "VL": "Village",
    "MÉ": "Municipality", "ME": "Municipality", "M\u00c9": "Municipality",
    "PE": "Paroisse",
    "P": "Paroisse",
    "CT": "Canton",
    "CU": "Canton Uni",
    "TC": "Terre de la Couronne",
    "MU": "Municipality",
    "TÉ": "Territoire Équivalent", "TE": "Territoire Équivalent",
    "TI": "Terre Inuite",
    "TK": "Terre Kativik",
    "R": "Réserve Indienne",
    "S-É": "Établissement Indien", "S-E": "Établissement Indien",
    "NO": "Territoire Non Organisé",
}

# Types to include (municipal entities)
INCLUDE_TYPES = {"V", "VL", "MÉ", "ME", "M\u00c9", "PE", "P", "CT", "CU", "MU"}
# Types to exclude (non-municipal)
EXCLUDE_TYPES = {"TC", "TI", "TK", "R", "S-É", "S-E", "NO", "TÉ", "TE"}

# UTM zone lookup for Quebec
UTM_ZONES = {
    (-84, -78): ("UTM Zone 17N", "EPSG:26917"),
    (-78, -72): ("UTM Zone 18N", "EPSG:26918"),
    (-72, -66): ("UTM Zone 19N", "EPSG:26919"),
    (-66, -60): ("UTM Zone 20N", "EPSG:26920"),
    (-60, -54): ("UTM Zone 21N", "EPSG:26921"),
}


def assign_crs(lon):
    """Assign CRS based on longitude."""
    for (min_lon, max_lon), (zone_name, epsg) in UTM_ZONES.items():
        if min_lon <= lon < max_lon:
            return f"NAD83(CSRS) {zone_name}; Provincial: Quebec Lambert (EPSG:32198)"
    return "NAD83(CSRS); Provincial: Quebec Lambert (EPSG:32198)"


def get_tier(population):
    if not population:
        return 3
    if population >= 50000:
        return 1
    elif population >= 10000:
        return 2
    return 3


def normalize_name(name):
    """Normalize municipality name for matching."""
    n = name.strip()
    # Remove common prefixes/suffixes for matching
    n = re.sub(r"^(Ville de |Town of |Municipality of |Municipalit[eé] de )", "", n, flags=re.IGNORECASE)
    n = n.lower().strip()
    # Handle common name variations
    n = n.replace(" city", "").replace(" (city)", "")
    n = n.replace(" (agglomeration)", "").replace(" (agglo)", "")
    # Normalize accents for comparison
    replacements = {
        "é": "e", "è": "e", "ê": "e", "ë": "e",
        "à": "a", "â": "a", "ä": "a",
        "î": "i", "ï": "i",
        "ô": "o", "ö": "o",
        "ù": "u", "û": "u", "ü": "u",
        "ç": "c", "æ": "ae", "œ": "oe",
        "\u00e9": "e", "\u00e8": "e", "\u00ea": "e",
        "\u00e0": "a", "\u00e2": "a",
        "\u00ee": "i", "\u00ef": "i",
        "\u00f4": "o", "\u00f9": "u", "\u00fb": "u",
        "\u00e7": "c",
    }
    for old, new in replacements.items():
        n = n.replace(old, new)
    # Remove trailing whitespace and punctuation
    n = re.sub(r"[^a-z0-9 -]", "", n).strip()
    return n


def load_statcan_population():
    """Load Quebec CSD populations from StatCan table 98-10-0002."""
    pop_file = STATCAN_DIR / "98100002.csv"
    if not pop_file.exists():
        print(f"ERROR: {pop_file} not found. Download from StatCan first.")
        sys.exit(1)

    qc_pops = {}
    with open(pop_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            dguid = row.get("DGUID", "")
            # CSD-level Quebec entries: 2021A0005 + 24XXXXX
            if dguid.startswith("2021A000524") and len(dguid) == 16:
                csd_uid = dguid[9:]
                name = row["GEO"]
                pop_str = row.get(
                    "Population and dwelling counts (13): Population, 2021 [1]", "0"
                )
                pop = int(pop_str) if pop_str and pop_str != ".." else 0
                qc_pops[csd_uid] = {"name": name, "population": pop}

    print(f"  StatCan populations loaded: {len(qc_pops)} Quebec CSDs")
    return qc_pops


def load_gaf_coordinates():
    """Load Quebec CSD centroids from Geographic Attribute File."""
    gaf_file = STATCAN_DIR / "2021_92-151_X_utf.csv"
    if not gaf_file.exists():
        print(f"ERROR: {gaf_file} not found. Download GAF first.")
        sys.exit(1)

    csd_data = defaultdict(lambda: {"lats": [], "lons": [], "name": "", "type": ""})

    with open(gaf_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            csd_uid = row["CSDUID_SDRIDU"]
            if not csd_uid.startswith("24"):
                continue
            lat = row.get("DARPLAT_ADLAT", "")
            lon = row.get("DARPLONG_ADLONG", "")
            if lat and lon:
                try:
                    csd_data[csd_uid]["lats"].append(float(lat))
                    csd_data[csd_uid]["lons"].append(float(lon))
                except ValueError:
                    pass
            csd_data[csd_uid]["name"] = row["CSDNAME_SDRNOM"]
            csd_data[csd_uid]["type"] = row["CSDTYPE_SDRGENRE"]

    # Compute centroids (average of DA representative points)
    centroids = {}
    for csd_uid, data in csd_data.items():
        if data["lats"]:
            centroids[csd_uid] = {
                "name": data["name"],
                "type": data["type"],
                "lat": round(sum(data["lats"]) / len(data["lats"]), 4),
                "lon": round(sum(data["lons"]) / len(data["lons"]), 4),
            }

    print(f"  GAF coordinates loaded: {len(centroids)} Quebec CSDs")
    return centroids


def make_qc_entity(name, entity_type, population, lat, lon, parent_geo=None):
    """Create an empty QC entity with 27-field schema."""
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
        "engineeringStandardsUrl": "https://www.publicationsduquebec.gouv.qc.ca/produits-en-ligne/ouvrages-routiers/",
        "cadStandardsUrl": None,
        "constructionStandards": "Collection Normes -- Ouvrages routiers (provincial)",
        "dataFormats": None,
        "coordinateSystem": assign_crs(lon),
        "lidarAvailable": lat <= 50.0,  # Provincial LiDAR covers southern QC
        "orthophotoAvailable": True,  # Province-wide forest inventory mosaic
        "wmsWfsEndpoints": None,
        "apiEndpoint": None,
        "dataLicence": None,
        "contactDepartment": None,
        "industryFocus": None,
        "description": f"{entity_type} au Québec. Pop. {population:,} (Recensement 2021)." if population else f"{entity_type} au Québec.",
        "lastVerified": TODAY,
    }


def expand_quebec(dry_run=False):
    """Expand QC research JSON with StatCan Census data."""
    # Load sources
    qc_pops = load_statcan_population()
    gaf_coords = load_gaf_coordinates()

    # Load existing QC research
    qc_file = DATA_DIR / "qc_research.json"
    with open(qc_file, "r", encoding="utf-8") as f:
        qc_data = json.load(f)

    existing_entities = qc_data.get("entities", [])
    existing_names = {normalize_name(e["name"]) for e in existing_entities}
    print(f"  Existing QC entities: {len(existing_entities)}")

    # Build new entries from StatCan data
    new_entities = []
    skipped_types = defaultdict(int)
    skipped_no_coords = 0
    skipped_existing = 0
    skipped_zero_pop = 0

    for csd_uid, pop_data in qc_pops.items():
        name = pop_data["name"]
        population = pop_data["population"]

        # Get coordinates and type from GAF
        gaf = gaf_coords.get(csd_uid)
        if not gaf:
            skipped_no_coords += 1
            continue

        csd_type = gaf["type"]

        # Filter by CSD type -- include only municipal types
        type_included = False
        for inc_type in INCLUDE_TYPES:
            if csd_type == inc_type or inc_type in csd_type:
                type_included = True
                break

        if not type_included:
            skipped_types[csd_type] += 1
            continue

        # Skip zero population
        if population <= 0:
            skipped_zero_pop += 1
            continue

        # Check if already exists
        if normalize_name(name) in existing_names:
            skipped_existing += 1
            continue

        # Also check GAF name against existing
        if normalize_name(gaf["name"]) in existing_names:
            skipped_existing += 1
            continue

        # Map CSD type to entity type
        entity_type = QC_CSD_TYPES.get(csd_type, "Municipality")

        # Create new entity
        entity = make_qc_entity(
            name=name,
            entity_type=entity_type,
            population=population,
            lat=gaf["lat"],
            lon=gaf["lon"],
        )
        new_entities.append(entity)

    # Sort new entities by population (descending)
    new_entities.sort(key=lambda e: e["population"] or 0, reverse=True)

    print(f"\n  New entities to add: {len(new_entities)}")
    print(f"  Skipped (already exists): {skipped_existing}")
    print(f"  Skipped (no coordinates): {skipped_no_coords}")
    print(f"  Skipped (zero population): {skipped_zero_pop}")
    print(f"  Skipped (excluded types): {dict(skipped_types)}")

    if new_entities:
        print(f"\n  Top 10 new entities:")
        for e in new_entities[:10]:
            print(f"    {e['name']} ({e['entityType']}) - pop {e['population']:,}")

    if not dry_run and new_entities:
        # Merge: existing + new
        qc_data["entities"] = existing_entities + new_entities
        qc_data["lastUpdated"] = TODAY

        with open(qc_file, "w", encoding="utf-8") as f:
            json.dump(qc_data, f, indent=2, ensure_ascii=False)
            f.write("\n")

        print(f"\n  SAVED: {len(qc_data['entities'])} total QC entities")
    elif dry_run:
        print(f"\n  (Dry run -- would result in {len(existing_entities) + len(new_entities)} total entities)")

    return len(new_entities)


def main():
    parser = argparse.ArgumentParser(description="Expand Quebec municipality coverage")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--stats", action="store_true")
    args = parser.parse_args()

    print("\n=== Quebec Expansion ===\n")
    new_count = expand_quebec(dry_run=args.dry_run)

    if args.stats:
        with open(DATA_DIR / "qc_research.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        entities = data["entities"]
        print(f"\n  Final stats:")
        print(f"    Total entities: {len(entities)}")
        print(f"    Tier 1 (50K+): {sum(1 for e in entities if e.get('tier') == 1)}")
        print(f"    Tier 2 (10-50K): {sum(1 for e in entities if e.get('tier') == 2)}")
        print(f"    Tier 3 (<10K): {sum(1 for e in entities if e.get('tier') == 3)}")
        print(f"    With portal: {sum(1 for e in entities if e.get('openDataPortalUrl'))}")
        print(f"    With council: {sum(1 for e in entities if e.get('councilUrl'))}")


if __name__ == "__main__":
    main()
