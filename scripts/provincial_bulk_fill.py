"""
Provincial Bulk Fill Script

Applies provincial-level data to all municipalities in research JSONs.
Fills: lidarAvailable, orthophotoAvailable, engineeringStandardsUrl,
constructionStandards, wmsWfsEndpoints (provincial), gisViewerUrl/Name,
contactDepartment, industryFocus, lastVerified.

Usage:
  python scripts/provincial_bulk_fill.py                    # all provinces
  python scripts/provincial_bulk_fill.py --province AB      # single province
  python scripts/provincial_bulk_fill.py --dry-run          # preview changes
  python scripts/provincial_bulk_fill.py --stats            # show field stats
"""

import argparse
import json
import os
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
TODAY = date.today().isoformat()

# ============================================================
# Provincial-level data compiled from research
# ============================================================

PROVINCIAL_DATA = {
    "BC": {
        "lidar": {
            "available": True,
            "coverage": "partial",  # ~86k km2, urban + resource corridors
            "source": "LidarBC + NRCan HRDEM",
            "note": "LidarBC covers ~86,000 km2 including urban areas and resource corridors. NRCan HRDEM supplements.",
            "tier_threshold": None,  # all municipalities likely near covered areas
        },
        "orthophoto": {
            "available": True,
            "coverage": "province-wide",
            "source": "GeoBC TRIM orthophotos + WMS streaming",
        },
        "engineering_body": {
            "name": "EGBC",
            "url": "https://www.egbc.ca/",
            "survey_body": "ABCLS",
            "survey_url": "https://www.abcls.ca/",
        },
        "transport_standards": {
            "name": "BC MOTI Engineering Standards",
            "url": "https://www2.gov.bc.ca/gov/content/transportation/transportation-infrastructure/engineering-standards-guidelines",
        },
        "construction_standards": "MMCD (Master Municipal Construction Documents)",
        "construction_url": "https://mmcd.net/",
        "gis_portal": {
            "name": "BC Data Catalogue (DataBC)",
            "url": "https://catalogue.data.gov.bc.ca/",
        },
        "wms_wfs": "https://openmaps.gov.bc.ca/geo/pub/wfs",
    },
    "AB": {
        "lidar": {
            "available": True,
            "coverage": "partial",
            "source": "ABMI Open LiDAR + NRCan HRDEM",
            "note": "ABMI released ~5,600 km2 open LiDAR. Altalis has broader paid coverage. NRCan HRDEM supplements.",
            "tier_threshold": 2,  # Tier 1+2 likely covered
        },
        "orthophoto": {
            "available": False,  # Altalis is paid, not open
            "coverage": "paid-only",
            "source": "Altalis (paid); some ABMI historical orthos free",
        },
        "engineering_body": {
            "name": "APEGA",
            "url": "https://www.apega.ca/",
            "survey_body": "ALSA",
            "survey_url": "https://www.alsa.ab.ca/",
        },
        "transport_standards": {
            "name": "Alberta Transportation Highway Geometric Design Guide",
            "url": "https://www.alberta.ca/highway-geometric-design-guide",
        },
        "construction_standards": None,  # city-level, no provincial standard
        "construction_url": None,
        "gis_portal": {
            "name": "GeoDiscover Alberta",
            "url": "https://geodiscover.alberta.ca/",
        },
        "wms_wfs": None,
    },
    "SK": {
        "lidar": {
            "available": False,
            "coverage": "limited",
            "source": "NRCan HRDEM only (select areas)",
            "note": "No provincial LiDAR program. Federal HRDEM covers limited areas.",
            "tier_threshold": 1,  # only Tier 1 (Regina, Saskatoon) likely covered
        },
        "orthophoto": {
            "available": True,
            "coverage": "province-wide",
            "source": "FlySask/SGIC (97% coverage)",
        },
        "engineering_body": {
            "name": "APEGS",
            "url": "https://www.apegs.ca/",
            "survey_body": "SLSA",
            "survey_url": None,
        },
        "transport_standards": {
            "name": "Saskatchewan Ministry of Highways Standards",
            "url": "https://publications.saskatchewan.ca/#/categories/5230",
        },
        "construction_standards": None,  # city-level (Regina, Saskatoon)
        "construction_url": None,
        "gis_portal": {
            "name": "Saskatchewan GeoHub",
            "url": "https://geohub.saskatchewan.ca/",
        },
        "wms_wfs": None,
    },
    "MB": {
        "lidar": {
            "available": True,
            "coverage": "partial",
            "source": "Manitoba LiDAR via MLI + NRCan HRDEM",
            "note": "Extensive coverage of southern Manitoba including Red River corridor.",
            "tier_threshold": None,  # southern municipalities likely covered
            "lat_threshold": 52.0,  # south of ~52N likely covered
        },
        "orthophoto": {
            "available": True,
            "coverage": "province-wide",
            "source": "Manitoba Land Initiative DOI (2007-2011 refresh)",
        },
        "engineering_body": {
            "name": "Engineers Geoscientists Manitoba",
            "url": "https://www.enggeomb.ca/",
            "survey_body": "AMLS",
            "survey_url": None,
        },
        "transport_standards": {
            "name": "Manitoba Transportation Standard Construction Specs",
            "url": "https://www.gov.mb.ca/mti/contracts/manual.html",
        },
        "construction_standards": None,  # city-level
        "construction_url": None,
        "gis_portal": {
            "name": "Data MB / Manitoba GeoPortal",
            "url": "https://geoportal.gov.mb.ca/",
        },
        "wms_wfs": None,
    },
    "ON": {
        "lidar": {
            "available": True,
            "coverage": "partial",
            "source": "Ontario MNRF LiDAR + NRCan HRDEM",
            "note": "Expanding coverage focused on southern/settled Ontario.",
            "tier_threshold": None,
            "lat_threshold": 48.0,  # southern Ontario
        },
        "orthophoto": {
            "available": True,
            "coverage": "province-wide",
            "source": "DRAPE/SWOOP/SCOOP/COOP/NWOOP (5-year rotation)",
        },
        "engineering_body": {
            "name": "PEO (Professional Engineers Ontario)",
            "url": "https://www.peo.on.ca/",
            "survey_body": "AOLS",
            "survey_url": "https://www.aols.org/",
        },
        "transport_standards": {
            "name": "Ontario MTO Design Supplement for TAC",
            "url": "https://www.library.mto.gov.on.ca/",
        },
        "construction_standards": "OPSS.MUNI / OPSD (Ontario Provincial Standards)",
        "construction_url": "http://www.ops.on.ca/",
        "gis_portal": {
            "name": "Ontario GeoHub",
            "url": "https://geohub.lio.gov.on.ca/",
        },
        "wms_wfs": None,
    },
    "QC": {
        "lidar": {
            "available": True,
            "coverage": "partial",
            "source": "Programme d'acquisition de LiDAR provincial + NRCan HRDEM",
            "note": "~55,000 km2 and growing. Derived products (DTM, contours) freely available.",
            "tier_threshold": None,
            "lat_threshold": 50.0,
        },
        "orthophoto": {
            "available": True,
            "coverage": "province-wide",
            "source": "Mosaique d'orthophotographies aeriennes (forest inventory)",
        },
        "engineering_body": {
            "name": "OIQ (Ordre des ingenieurs du Quebec)",
            "url": "https://www.oiq.qc.ca/",
            "survey_body": "OAGQ",
            "survey_url": "https://oagq.qc.ca/",
        },
        "transport_standards": {
            "name": "MTMD Collection Normes -- Ouvrages routiers",
            "url": "https://www.publicationsduquebec.gouv.qc.ca/produits-en-ligne/ouvrages-routiers/",
        },
        "construction_standards": "Collection Normes -- Ouvrages routiers (provincial)",
        "construction_url": "https://www.publicationsduquebec.gouv.qc.ca/produits-en-ligne/ouvrages-routiers/",
        "gis_portal": {
            "name": "Donnees Quebec",
            "url": "https://www.donneesquebec.ca/",
        },
        "wms_wfs": None,
    },
    "NB": {
        "lidar": {
            "available": True,
            "coverage": "province-wide",
            "source": "GeoNB Provincial LiDAR",
            "note": "Province-wide coverage. One of the most complete in Atlantic Canada.",
        },
        "orthophoto": {
            "available": True,
            "coverage": "province-wide",
            "source": "GeoNB Orthoimagery (SODB)",
        },
        "engineering_body": {
            "name": "APEGNB",
            "url": "https://www.apegnb.com/",
            "survey_body": None,  # APEGNB covers both
            "survey_url": None,
        },
        "transport_standards": {
            "name": "NBDTI Standard Specifications for Highway Construction (2023)",
            "url": "https://www2.gnb.ca/content/gnb/en/departments/dti/standards.html",
        },
        "construction_standards": "NBDTI Standard Specifications + Subdivision Standards",
        "construction_url": "https://www2.gnb.ca/content/gnb/en/departments/dti/standards.html",
        "gis_portal": {
            "name": "GeoNB",
            "url": "https://geonb.snb.ca/geonb/",
        },
        "wms_wfs": None,
    },
    "NS": {
        "lidar": {
            "available": True,
            "coverage": "partial",
            "source": "GeoNOVA Provincial LiDAR (Elevation Explorer)",
            "note": "Expanding coverage. Major areas covered include central, western, southwest NS, Minas Basin, Cumberland/Pictou/Antigonish.",
        },
        "orthophoto": {
            "available": True,
            "coverage": "province-wide",
            "source": "GeoNOVA Orthophotography (1:10,000 mosaic)",
        },
        "engineering_body": {
            "name": "Engineers Nova Scotia",
            "url": "https://engineersnovascotia.ca/",
            "survey_body": "ANSLS",
            "survey_url": None,
        },
        "transport_standards": {
            "name": "NS Standard Specification Manual for Highway Construction",
            "url": "https://novascotia.ca/tran/highways/ssm/",
        },
        "construction_standards": None,  # municipal-level + highway specs
        "construction_url": None,
        "gis_portal": {
            "name": "GeoNOVA",
            "url": "https://geonova.novascotia.ca/",
        },
        "wms_wfs": None,
    },
    "PE": {
        "lidar": {
            "available": True,
            "coverage": "province-wide",
            "source": "PEI Provincial LiDAR (2020, >= 6 pts/m2)",
            "note": "Full provincial coverage acquired July-September 2020.",
        },
        "orthophoto": {
            "available": True,
            "coverage": "province-wide",
            "source": "PEI Provincial Orthophotography (2000, 2010, 2020 vintages)",
        },
        "engineering_body": {
            "name": "Engineers PEI",
            "url": "https://www.engineerspei.com/",
            "survey_body": None,
            "survey_url": None,
        },
        "transport_standards": {
            "name": "PEI General Provisions and Contract Specs for Highway Construction (2021)",
            "url": "https://www.princeedwardisland.ca/sites/default/files/publications/final_spec_2021_2_4.pdf",
        },
        "construction_standards": None,  # municipal-level only
        "construction_url": None,
        "gis_portal": {
            "name": "PEI Open Data",
            "url": "https://data.princeedwardisland.ca/",
        },
        "wms_wfs": None,
    },
    "NL": {
        "lidar": {
            "available": False,
            "coverage": "none",
            "source": "No provincial program; limited NRCan HRDEM coverage",
            "note": "No dedicated provincial LiDAR program found.",
        },
        "orthophoto": {
            "available": True,
            "coverage": "partial",
            "source": "NL Aerial Photography Program (Dept of Forestry/Agriculture)",
        },
        "engineering_body": {
            "name": "PEGNL",
            "url": "https://pegnl.ca/",
            "survey_body": "ANLS",
            "survey_url": None,
        },
        "transport_standards": {
            "name": "NL Highway Specifications Book",
            "url": "https://www.gov.nl.ca/ti/hdc/highway-specification-book/",
        },
        "construction_standards": "NL Municipal Water, Sewer and Roads Master Specs (2022)",
        "construction_url": "https://www.gov.nl.ca/ti/files/MI-Municipal-Water-Sewer-Roads-Master-Specification-March-2022.pdf",
        "gis_portal": {
            "name": "GeoHub NL",
            "url": "https://geohub-gnl.hub.arcgis.com/",
        },
        "wms_wfs": None,
    },
    "YT": {
        "lidar": {
            "available": True,
            "coverage": "communities",
            "source": "Yukon LiDAR (all communities + highway corridors)",
            "note": "Coverage for all Yukon communities and highway corridors.",
        },
        "orthophoto": {
            "available": True,
            "coverage": "partial",
            "source": "Yukon Aerial Imagery (REST + WMS services)",
        },
        "engineering_body": {
            "name": "Engineers Yukon",
            "url": "https://engineersyukon.ca/",
            "survey_body": None,
            "survey_url": None,
        },
        "transport_standards": {
            "name": None,
            "url": None,
        },
        "construction_standards": None,
        "construction_url": None,
        "gis_portal": {
            "name": "GeoYukon",
            "url": "https://mapservices.gov.yk.ca/GeoYukon/",
        },
        "wms_wfs": "https://mapservices.gov.yk.ca/GeoYukon/rest/services",
    },
    "NT": {
        "lidar": {
            "available": False,
            "coverage": "none",
            "source": "No territorial program; NRCan HRDEM/ArcticDEM only",
        },
        "orthophoto": {
            "available": True,
            "coverage": "partial",
            "source": "NWT Centre for Geomatics SDW (satellite + aerial)",
        },
        "engineering_body": {
            "name": "NAPEG",
            "url": "https://www.napeg.nt.ca/",
            "survey_body": None,
            "survey_url": None,
        },
        "transport_standards": {
            "name": None,
            "url": None,
        },
        "construction_standards": None,
        "construction_url": None,
        "gis_portal": {
            "name": "NWT Centre for Geomatics",
            "url": "https://www.geomatics.gov.nt.ca/",
        },
        "wms_wfs": "https://www.geomatics.gov.nt.ca/en/services/web-map-services-wms",
    },
    "NU": {
        "lidar": {
            "available": False,
            "coverage": "none",
            "source": "No territorial program; ArcticDEM (satellite) only",
        },
        "orthophoto": {
            "available": False,
            "coverage": "none",
            "source": "Federal only (NRCan NAPL, EODMS)",
        },
        "engineering_body": {
            "name": "NAPEG",
            "url": "https://www.napeg.nt.ca/",
            "survey_body": None,
            "survey_url": None,
        },
        "transport_standards": {
            "name": None,
            "url": None,
        },
        "construction_standards": None,
        "construction_url": None,
        "gis_portal": {
            "name": None,
            "url": None,
        },
        "wms_wfs": None,
    },
}


def should_have_lidar(entity, prov_data):
    """Determine if a municipality should have lidarAvailable=True based on provincial coverage."""
    lidar = prov_data["lidar"]

    if not lidar["available"]:
        return False

    coverage = lidar.get("coverage", "")

    # Province-wide or community-based coverage
    if coverage in ("province-wide", "communities"):
        return True

    # Tier-based threshold
    tier_threshold = lidar.get("tier_threshold")
    if tier_threshold is not None:
        return entity.get("tier", 3) <= tier_threshold

    # Latitude-based threshold (southern coverage)
    lat_threshold = lidar.get("lat_threshold")
    if lat_threshold is not None:
        lat = entity.get("lat", 90)
        return lat <= lat_threshold

    # Default: if available and partial, apply to Tier 1+2
    return entity.get("tier", 3) <= 2


def should_have_orthophoto(entity, prov_data):
    """Determine if a municipality should have orthophotoAvailable=True."""
    ortho = prov_data["orthophoto"]

    if not ortho["available"]:
        return False

    coverage = ortho.get("coverage", "")
    if coverage == "province-wide":
        return True

    # Partial coverage: apply to Tier 1+2 municipalities
    return entity.get("tier", 3) <= 2


def fill_entity(entity, prov_code, prov_data, dry_run=False):
    """Apply provincial-level data to a single entity. Returns count of fields changed."""
    changes = 0

    # LiDAR availability
    if not entity.get("lidarAvailable") and should_have_lidar(entity, prov_data):
        if not dry_run:
            entity["lidarAvailable"] = True
        changes += 1

    # Orthophoto availability
    if not entity.get("orthophotoAvailable") and should_have_orthophoto(entity, prov_data):
        if not dry_run:
            entity["orthophotoAvailable"] = True
        changes += 1

    # Engineering standards URL (only if not already set)
    transport = prov_data.get("transport_standards", {})
    if not entity.get("engineeringStandardsUrl") and transport.get("url"):
        if not dry_run:
            entity["engineeringStandardsUrl"] = transport["url"]
        changes += 1

    # Construction standards (only if not already set)
    if not entity.get("constructionStandards") and prov_data.get("construction_standards"):
        if not dry_run:
            entity["constructionStandards"] = prov_data["construction_standards"]
        changes += 1

    # WMS/WFS endpoints (provincial-level, only if not already set)
    if not entity.get("wmsWfsEndpoints") and prov_data.get("wms_wfs"):
        if not dry_run:
            entity["wmsWfsEndpoints"] = prov_data["wms_wfs"]
        changes += 1

    # Contact department -- fill for entities with portals but no contact
    if not entity.get("contactDepartment") and entity.get("openDataPortalUrl"):
        if not dry_run:
            entity["contactDepartment"] = "GIS/IT"
        changes += 1

    # Industry focus -- fill for entities with portals but no focus
    if not entity.get("industryFocus") and entity.get("openDataPortalUrl"):
        if not dry_run:
            entity["industryFocus"] = "Geospatial"
        changes += 1

    # Last verified -- update for all modified entities
    if changes > 0 and not dry_run:
        entity["lastVerified"] = TODAY

    return changes


def process_province(prov_code, dry_run=False):
    """Process a single province's research JSON."""
    filepath = DATA_DIR / f"{prov_code.lower()}_research.json"
    if not filepath.exists():
        print(f"  SKIP: {filepath.name} not found")
        return 0, 0, 0

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    prov_data = PROVINCIAL_DATA.get(prov_code)
    if not prov_data:
        print(f"  SKIP: No provincial data for {prov_code}")
        return 0, 0, 0

    entities = data.get("entities", [])
    total_changes = 0
    entities_changed = 0

    for entity in entities:
        changes = fill_entity(entity, prov_code, prov_data, dry_run=dry_run)
        if changes > 0:
            entities_changed += 1
            total_changes += changes

    if not dry_run and total_changes > 0:
        data["lastUpdated"] = TODAY
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")

    return len(entities), entities_changed, total_changes


def print_stats(prov_code=None):
    """Print field completion statistics."""
    provinces = [prov_code] if prov_code else list(PROVINCIAL_DATA.keys())

    fields = [
        "lidarAvailable", "orthophotoAvailable", "engineeringStandardsUrl",
        "constructionStandards", "wmsWfsEndpoints", "gisViewerUrl",
        "municipalUrl", "contactDepartment", "industryFocus", "lastVerified",
        "openDataPortalUrl", "portalPlatform", "dataFormats",
    ]

    totals = {f: 0 for f in fields}
    total_entities = 0

    for pc in provinces:
        filepath = DATA_DIR / f"{pc.lower()}_research.json"
        if not filepath.exists():
            continue
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        entities = data.get("entities", [])
        total_entities += len(entities)
        for entity in entities:
            for field in fields:
                val = entity.get(field)
                if val and val is not True:
                    totals[field] += 1
                elif val is True:
                    totals[field] += 1

    print(f"\n{'Field':<30} {'Filled':>8} {'Total':>8} {'%':>8}")
    print("-" * 58)
    for field in fields:
        pct = (totals[field] / total_entities * 100) if total_entities > 0 else 0
        print(f"{field:<30} {totals[field]:>8} {total_entities:>8} {pct:>7.1f}%")
    print(f"\nTotal entities: {total_entities}")


def main():
    parser = argparse.ArgumentParser(description="Apply provincial-level data to research JSONs")
    parser.add_argument("--province", type=str, help="Province code (e.g., AB, BC)")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    parser.add_argument("--stats", action="store_true", help="Show field completion statistics")
    parser.add_argument("--stats-after", action="store_true", help="Show stats after applying changes")
    args = parser.parse_args()

    if args.stats:
        print_stats(args.province)
        return

    provinces = [args.province.upper()] if args.province else list(PROVINCIAL_DATA.keys())
    mode = "DRY RUN" if args.dry_run else "APPLYING"

    print(f"\n=== Provincial Bulk Fill ({mode}) ===\n")

    grand_entities = 0
    grand_changed = 0
    grand_fields = 0

    for prov_code in provinces:
        total, changed, fields = process_province(prov_code, dry_run=args.dry_run)
        if total > 0:
            print(f"  {prov_code}: {changed}/{total} entities updated, {fields} field changes")
        grand_entities += total
        grand_changed += changed
        grand_fields += fields

    print(f"\n  TOTAL: {grand_changed}/{grand_entities} entities, {grand_fields} field changes")

    if args.dry_run:
        print("\n  (Dry run -- no files were modified)")

    if args.stats_after and not args.dry_run:
        print_stats(args.province)


if __name__ == "__main__":
    main()
