"""
Tier 1+2 Municipal Engineering Standards Fill

Applies researched municipal-specific engineering standards, CAD standards,
and GIS viewer URLs to Tier 1 (and some Tier 2) entities in research JSONs.

Usage:
  python scripts/tier1_standards_fill.py              # apply
  python scripts/tier1_standards_fill.py --dry-run     # preview
"""

import argparse
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
TODAY = date.today().isoformat()

# Municipal-specific engineering standards (researched per city)
# Format: {province: {city_name: {field: value, ...}}}
MUNICIPAL_STANDARDS = {
    "BC": {
        "Richmond": {
            "engineeringStandardsUrl": "https://www.richmond.ca/business-development/devzoning/specs/specs.htm",
            "gisViewerUrl": "https://www.richmond.ca/services/digital/maps.htm",
            "gisViewerName": "Richmond Interactive Map",
        },
        "Abbotsford": {
            "engineeringStandardsUrl": "https://www.abbotsford.ca/business-development/development-engineering",
            "cadStandardsUrl": "https://www.abbotsford.ca/sites/default/files/2023-07/Engineering%20Standards%20for%20Drawing%20Submissions%20-%20Apr%202022.pdf",
            "gisViewerUrl": "https://maps.abbotsford.ca/",
            "gisViewerName": "Abbotsford Map Viewer",
        },
        "Coquitlam": {
            "engineeringStandardsUrl": "https://publicdocs.coquitlam.ca/coquitlamdoc/getdocIF.asp?doc=5811224",
            "gisViewerUrl": "https://www.coquitlam.ca/701/City-Maps",
            "gisViewerName": "QtheMap",
        },
        "Saanich": {
            "engineeringStandardsUrl": "https://www.saanich.ca/EN/main/local-government/development-applications/subdivisions/engineering-specifications-schedule-h.html",
            "cadStandardsUrl": "https://www.saanich.ca/assets/Local~Government/Documents/esdrawstand.pdf",
            "gisViewerUrl": "https://map.saanich.ca/",
            "gisViewerName": "SaanichMap",
        },
        "Delta": {
            "engineeringStandardsUrl": "https://www.delta.ca/building-development/development-planning-approvals/engineering-design-criteria",
            "gisViewerUrl": "https://deltamap.delta.ca/",
            "gisViewerName": "DeltaMap",
        },
        "Chilliwack": {
            "engineeringStandardsUrl": "https://www.chilliwack.com/main/page.cfm?id=930",
            "gisViewerUrl": "https://www.chilliwack.com/main/page.cfm?id=2274",
            "gisViewerName": "Chilliwack WebMap",
        },
        "Maple Ridge": {
            "engineeringStandardsUrl": "https://www.mapleridge.ca/your-government/policies-bylaws/subdivision-bylaw",
            "gisViewerUrl": "https://www.mapleridge.ca/eservices/land-development-application-viewer",
            "gisViewerName": "Land Development Viewer",
        },
        "Prince George": {
            "engineeringStandardsUrl": "https://www.princegeorge.ca/sites/default/files/2025-03/BL8618_CONSOLIDATED_2025-09-09.pdf",
            "constructionStandards": "MMCD + City Bylaw No. 8618",
        },
        "New Westminster": {
            "engineeringStandardsUrl": "https://www.newwestcity.ca/database/rte/files/Schedule%20B-Design%20Criteria.pdf",
            "cadStandardsUrl": "https://www.newwestcity.ca/database/rte/files/Schedule%20D-Drafting%20and%20Drawing%20Submission%20Standards.pdf",
            "gisViewerUrl": "https://opendata.newwestcity.ca/pages/maps",
            "gisViewerName": "New Westminster Open Data Maps",
        },
        "Port Coquitlam": {
            "engineeringStandardsUrl": "https://www.portcoquitlam.ca/sites/default/files/2024-10/2241%20-%20Subdivision%20Servicing%20Bylaw.pdf",
            "gisViewerUrl": "https://maps.portcoquitlam.ca/Html5Viewer/index.html?viewer=Public.v1",
            "gisViewerName": "PoCoMap",
        },
        "Langley": {
            "engineeringStandardsUrl": "https://www.tol.ca/en/services/resources/bylaw-services/bylaws/Development-Bylaws/Subdivision-and-Development-Servicing-Bylaw-2019-(No.-5382).pdf",
            "gisViewerUrl": "https://geosource.tol.ca/",
            "gisViewerName": "GeoSource",
        },
    },
    "AB": {
        "Regional Municipality of Wood Buffalo": {
            "engineeringStandardsUrl": "https://www.rmwb.ca/business-development-and-building/development-and-building/for-development-professionals/standards-and-guidelines/",
            "gisViewerUrl": "http://gis.rmwb.ca/webmap/",
            "gisViewerName": "RMWB WebMap",
        },
        "Lethbridge": {
            "engineeringStandardsUrl": "https://www.lethbridge.ca/media/ford0pyz/2021-city-of-lethbridge-design-standards.pdf",
            "gisViewerUrl": "https://www.lethbridge.ca/planning-development/maps/interactive-webmaps/",
            "gisViewerName": "LethExplorer",
        },
        "Red Deer": {
            "engineeringStandardsUrl": "https://www.reddeer.ca/media/reddeerca/city-services/engineering/publications/Design-Guidelines.pdf",
            "gisViewerUrl": "https://www.reddeer.ca/online-tools/interactive-city-map-web-map/",
            "gisViewerName": "Red Deer Web Map",
        },
        "St. Albert": {
            "engineeringStandardsUrl": "https://stalbert.ca/site/assets/files/6620/stalbert_municipal_engineering_standards_2021.pdf",
            "gisViewerUrl": "https://stalbert.ca/city/maps/interactive/",
            "gisViewerName": "St. Albert Interactive Maps",
        },
        "Grande Prairie": {
            "engineeringStandardsUrl": "https://cityofgp.com/sites/default/files/docs/engineering/city_of_gp_-_2022_design_manual.pdf",
        },
        "Medicine Hat": {
            "engineeringStandardsUrl": "https://www.medicinehat.ca/media/c4bjzbgt/mssm-2025_final-web.pdf",
            "gisViewerUrl": "https://www.medicinehat.ca/business-development/maps-gis/",
            "gisViewerName": "Medicine Hat iMap",
        },
        "Strathcona County": {
            "engineeringStandardsUrl": "https://www.strathcona.ca/business-and-development/design-and-construction-documents/design-construction-standards/",
            "cadStandardsUrl": "https://www.strathcona.ca/business-and-development/design-and-construction-documents/cad-standards",
            "gisViewerUrl": "https://www.strathcona.ca/council-county/facts-stats-and-forecasts/maps/",
            "gisViewerName": "Strathcona County Land Map",
        },
    },
    "SK": {
        "Saskatoon": {
            "engineeringStandardsUrl": "https://www.saskatoon.ca/business-development/development-regulation/specifications-standards/design-development-standards-manual",
            "gisViewerUrl": "https://www.saskatoon.ca/interactive-maps",
            "gisViewerName": "Saskatoon Interactive Maps",
        },
        "Regina": {
            "engineeringStandardsUrl": "https://www.regina.ca/business-development/land-property-development/land-development/design-standards/",
            "gisViewerUrl": "https://opengis.regina.ca/basicviewer/viewer.html",
            "gisViewerName": "Regina GIS Viewer",
        },
    },
    "MB": {
        "Winnipeg": {
            "engineeringStandardsUrl": "https://legacy.winnipeg.ca/matmgt/spec/default.stm",
            "cadStandardsUrl": "https://legacy.winnipeg.ca/waterandwaste/pdfs/dept/CAD-GIS%20Standards%20Manual%20-%20March%202023.pdf",
            "gisViewerUrl": "https://www.winnipeg.ca/building-development/property-records/winnipeg-property-map",
            "gisViewerName": "Winnipeg Property Map",
        },
        "Brandon": {
            "engineeringStandardsUrl": "https://www.brandon.ca/news/posts/municipal-servicing-standards/",
            "gisViewerUrl": "https://opengov.brandon.ca/reference-atlas.php",
            "gisViewerName": "COBRA Reference Atlas",
        },
    },
    "ON": {
        "Ottawa": {
            "gisViewerUrl": "https://open.ottawa.ca/",
            "gisViewerName": "Open Ottawa Hub",
        },
        "Mississauga": {
            "engineeringStandardsUrl": "https://www.mississauga.ca/publication/transportation-and-works-development-requirements-manual/",
            "gisViewerUrl": "https://www.mississauga.ca/our-organization/data-and-maps/mississauga-maps/",
            "gisViewerName": "Mississauga Maps",
        },
        "Brampton": {
            "engineeringStandardsUrl": "https://www.brampton.ca/EN/Business/planning-development/guidelines-manuals/pages/development-design-guidelines.aspx",
            "gisViewerUrl": "https://geohub.brampton.ca/pages/maps",
            "gisViewerName": "Brampton GeoHub",
        },
        "Hamilton": {
            "engineeringStandardsUrl": "https://www.hamilton.ca/sites/default/files/2023-01/pedpolicies-engineering-guidelines-servicinglandforDevApps-v2.pdf",
            "gisViewerUrl": "https://open.hamilton.ca/pages/mapping",
            "gisViewerName": "Open Hamilton",
        },
        "London": {
            "engineeringStandardsUrl": "https://london.ca/sites/default/files/2020-11/2019_Design_Specifications_and_Requirements_Manual_%28Entire_Document%29.pdf",
            "gisViewerUrl": "https://opendata.london.ca/",
            "gisViewerName": "London Open Data",
            "constructionStandards": "OPSS.MUNI + London DSRM",
        },
        "Markham": {
            "engineeringStandardsUrl": "https://www.markham.ca/economic-development-business/planning-development-services/engineering-services/engineering-design-criteria",
            "gisViewerUrl": "https://data-markham.opendata.arcgis.com/",
            "gisViewerName": "Markham Open Data",
        },
        "Vaughan": {
            "engineeringStandardsUrl": "https://www.vaughan.ca/about-city-vaughan/departments/development-engineering",
            "gisViewerUrl": "https://www.vaughan.ca/business/online-maps",
            "gisViewerName": "Vaughan City Viewer",
        },
        "Kitchener": {
            "engineeringStandardsUrl": "https://www.kitchener.ca/development-and-construction/resources-for-builders-and-developers/development-manual/",
            "gisViewerUrl": "https://open-kitchenergis.opendata.arcgis.com/",
            "gisViewerName": "Kitchener GeoHub",
        },
        "Windsor": {
            "engineeringStandardsUrl": "https://www.citywindsor.ca/Documents/residents/planning/land-development/DEVELOPMENT%20MANUAL%20-%20NOVEMBER%202015.pdf",
            "gisViewerUrl": "https://www.citywindsor.ca/visitors/maps/MappMyCity",
            "gisViewerName": "MappMyCity",
        },
        "Richmond Hill": {
            "engineeringStandardsUrl": "https://www.richmondhill.ca/en/learn-more/Design-and-Construction-Guidelines.aspx",
            "cadStandardsUrl": "https://www.richmondhill.ca/en/learn-more/resources/Design-Standards/Division-F-Development-Application-and-Capital-Project-Requirements.pdf",
        },
        "Oakville": {
            "engineeringStandardsUrl": "https://www.oakville.ca/getmedia/5e8eb3d5-b5f4-4e72-a66b-c2f03f1f512a/building-development-engineering-guidelines.pdf",
        },
        "Burlington": {
            "engineeringStandardsUrl": "https://www.burlington.ca/en/building-and-renovating/engineering-services-standards-and-drawings.aspx",
        },
        "Oshawa": {
            "engineeringStandardsUrl": "https://www.oshawa.ca/media/zefdlt4e/design-criteria-manual.pdf",
        },
        "Barrie": {
            "engineeringStandardsUrl": "https://www.barrie.ca/planning-building-infrastructure/infrastructure-standards",
        },
        "Guelph": {
            "engineeringStandardsUrl": "https://guelph.ca/wp-content/uploads/Development-Engineering-Manual.pdf",
        },
        "Cambridge": {
            "engineeringStandardsUrl": "https://www.cambridge.ca/business-building-development/development-infrastructure/engineering-standards-and-development/",
        },
        "Whitby": {
            "engineeringStandardsUrl": "https://www.whitby.ca/media/tnqfiafz/2025-design-criteria-and-engineering-standards.pdf",
        },
        "Kingston": {
            "engineeringStandardsUrl": "https://www.cityofkingston.ca/media/k3gltxg1/planning_guide_subdivision_techstandardsguide.pdf",
        },
    },
    "QC": {
        "Laval": {
            "engineeringStandardsUrl": "https://www.laval.ca/entreprises/appels-doffres-soumissions-publiques/guides-techniques/",
            "gisViewerUrl": "https://www.laval.ca/carte-interactive/",
            "gisViewerName": "Laval Carte Interactive",
        },
        "Gatineau": {
            "engineeringStandardsUrl": "https://www.gatineau.ca/portail/default.aspx?p=guichet_municipal/affaires_developpement_economique/faire_affaires_ville/appels_offres/devis_normalise",
            "gisViewerUrl": "https://www.gatineau.ca/portail/default.aspx?c=en-CA&p=publications_cartes_statistiques_donnees_ouvertes/cartes/carte_interactive_geoportail_urbanisme",
            "gisViewerName": "Geoportail Gatineau",
        },
        "Longueuil": {
            "gisViewerUrl": "https://geohub.longueuil.quebec/",
            "gisViewerName": "GeoHub Longueuil",
        },
        "Sherbrooke": {
            "gisViewerUrl": "https://donneesouvertes-sherbrooke.opendata.arcgis.com/",
            "gisViewerName": "Sherbrooke Donnees Ouvertes",
        },
        "Levis": {
            "engineeringStandardsUrl": "https://www.ville.levis.qc.ca/developpement-planification/normes-procedures/",
            "gisViewerUrl": "https://www.ville.levis.qc.ca/la-ville/statistiques/cartes-interactives/",
            "gisViewerName": "Levis Cartes Interactives",
        },
        "Saguenay": {
            "gisViewerUrl": "https://ville.saguenay.ca/services-aux-citoyens/transport-et-entretien/cartes",
            "gisViewerName": "Saguenay Cartes",
        },
        "Trois-Rivieres": {
            "gisViewerUrl": "https://www.v3r.net/services-en-ligne/cartes",
            "gisViewerName": "V3R Cartes Interactives",
        },
        "Terrebonne": {
            "engineeringStandardsUrl": "https://terrebonne.ca/wp-content/uploads/2023/11/Guide-de-conception-realisation-et-suivi-projets-2018.pdf",
            "gisViewerUrl": "https://terrebonne.ca/cartes-interactives/",
            "gisViewerName": "Terrebonne Cartes Interactives",
        },
    },
    "NB": {
        "Moncton": {
            "engineeringStandardsUrl": "https://www5.moncton.ca/docs/Subdivision_Development_Guidelines.pdf",
            "gisViewerUrl": "https://open.moncton.ca/maps/interactive-land-use-map/about",
            "gisViewerName": "Moncton Interactive Map",
        },
        "Saint John": {
            "engineeringStandardsUrl": "https://saintjohn.ca/sites/default/files/documents/Development%20Manual.pdf",
        },
        "Fredericton": {
            "gisViewerUrl": "https://data-fredericton.opendata.arcgis.com/",
            "gisViewerName": "Fredericton Open Data",
        },
    },
    "NS": {
        "Halifax": {
            "engineeringStandardsUrl": "https://www.halifax.ca/transportation/streets-sidewalks/municipal-design-guidelines-red-book",
            "cadStandardsUrl": "https://www.halifax.ca/media/75498",
            "gisViewerUrl": "https://www.halifax.ca/home/online-services/explorehrm",
            "gisViewerName": "ExploreHRM",
            "constructionStandards": "HRM Red Book Municipal Design Guidelines",
        },
        "Cape Breton (CBRM)": {
            "gisViewerUrl": "https://gis2.cbrm.ns.ca/portal/home/webmap/viewer.html",
            "gisViewerName": "CBRM GIS Portal",
        },
    },
    "NL": {
        "St. John's": {
            "engineeringStandardsUrl": "https://www.stjohns.ca/en/building-development/resources/Planning-Reports/Development-Design-Manual.pdf",
            "gisViewerUrl": "https://map.stjohns.ca/Mapcentre/",
            "gisViewerName": "MapCentre",
        },
    },
}


def apply_standards(dry_run=False):
    """Apply municipal standards to research JSONs."""
    total_updates = 0
    total_fields = 0

    for prov_code, cities in sorted(MUNICIPAL_STANDARDS.items()):
        filepath = DATA_DIR / f"{prov_code.lower()}_research.json"
        if not filepath.exists():
            print(f"  SKIP: {filepath.name} not found")
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        entities = data.get("entities", [])
        entity_map = {e["name"]: e for e in entities}
        prov_updates = 0

        for city_name, fields in cities.items():
            entity = entity_map.get(city_name)
            if not entity:
                # Fuzzy match
                for e in entities:
                    if city_name.lower() in e["name"].lower() or e["name"].lower() in city_name.lower():
                        entity = e
                        break

            if not entity:
                print(f"  NOT FOUND: {city_name} in {prov_code}")
                continue

            city_changes = 0
            for field, value in fields.items():
                if not value:
                    continue
                old = entity.get(field)
                # Always set if empty, or override provincial defaults with municipal-specific
                is_provincial_default = old and any(prov_domain in str(old) for prov_domain in [
                    "gov.bc.ca", "alberta.ca/highway", "publications.saskatchewan",
                    "gov.mb.ca/mti", "library.mto", "publicationsduquebec",
                    "gnb.ca", "novascotia.ca/tran", "princeedwardisland.ca",
                    "gov.nl.ca/ti", "ops.on.ca",
                ])
                if not old or is_provincial_default:
                    if not dry_run:
                        entity[field] = value
                    city_changes += 1

            if city_changes > 0:
                if not dry_run:
                    entity["lastVerified"] = TODAY
                prov_updates += 1
                total_fields += city_changes
                action = "WOULD UPDATE" if dry_run else "UPDATED"
                print(f"  {action}: {prov_code}/{city_name} ({city_changes} fields)")

        if prov_updates > 0 and not dry_run:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")

        total_updates += prov_updates

    print(f"\n  TOTAL: {total_updates} entities, {total_fields} field updates")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(f"\n=== Tier 1+2 Municipal Standards Fill {'(DRY RUN)' if args.dry_run else ''} ===\n")
    apply_standards(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
