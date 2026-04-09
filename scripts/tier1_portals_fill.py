"""
Tier 1 Verified Portal/Council/GIS Fill

Applies individually researched and verified open data portal URLs,
council meeting URLs, and GIS viewer URLs to Tier 1 entities.

Usage:
  python scripts/tier1_portals_fill.py
"""

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
TODAY = date.today().isoformat()

# Verified research results: {province: {entity_name: {field: value}}}
VERIFIED = {
    "BC": {
        "Saanich": {
            "openDataPortalUrl": "https://opendata-saanich.hub.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "dataFormats": "SHP, GeoJSON, CSV, KML",
            "apiEndpoint": "ArcGIS REST",
            "dataLicence": "OGL",
        },
        "Langley": {
            "openDataPortalUrl": "https://data-tol.opendata.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "dataFormats": "SHP, GeoJSON, CSV, KML",
            "apiEndpoint": "ArcGIS REST",
            "dataLicence": "OGL",
            "gisViewerUrl": "https://www.tol.ca/en/connect/data-maps-and-locations.aspx",
            "gisViewerName": "Township of Langley Maps",
        },
        "Nanaimo": {
            "openDataPortalUrl": "https://www.nanaimo.ca/your-government/maps-data",
            "portalPlatform": "Custom",
            "gisViewerUrl": "https://nanmap.nanaimo.ca/",
            "gisViewerName": "NanaimoMap",
        },
        "Chilliwack": {
            "openDataPortalUrl": "https://www.chilliwack.com/main/page.cfm?id=2331",
            "portalPlatform": "Custom",
            "dataFormats": "XLSX, CSV, DWG, SHP, GDB, KML, JSON",
        },
        "Prince George": {
            "openDataPortalUrl": "https://data-cityofpg.opendata.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "dataFormats": "SHP, GeoJSON, CSV, KML",
            "apiEndpoint": "ArcGIS REST",
            "dataLicence": "OGL",
        },
        "Capital Regional District": {
            "gisViewerUrl": "https://maps.crd.bc.ca/",
            "gisViewerName": "CRD Regional Map",
        },
        "Fraser Valley Regional District": {
            "gisViewerUrl": "https://maps.fvrd.ca/portal/apps/webappviewer/index.html?id=eae55e6da5f14e11a9a5e07a78f339c5",
            "gisViewerName": "FVRD Web Map",
        },
        "Central Okanagan Regional District": {
            "openDataPortalUrl": "https://gis-rdco.hub.arcgis.com/pages/open-data",
            "portalPlatform": "ArcGIS Hub",
            "gisViewerUrl": "https://gis-rdco.hub.arcgis.com/",
            "gisViewerName": "RDCO Maps and GIS",
        },
        "Regional District of Nanaimo": {
            "openDataPortalUrl": "https://rdn.bc.ca/spatial-data-disclaimer-and-licence",
            "portalPlatform": "Custom",
            "gisViewerUrl": "https://rdn.bc.ca/gis-mapping",
            "gisViewerName": "RDN GIS/Mapping",
        },
        "Thompson-Nicola Regional District": {
            "openDataPortalUrl": "https://my-tnrd.hub.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "gisViewerUrl": "https://my-tnrd.hub.arcgis.com/",
            "gisViewerName": "myTNRD",
        },
        "Comox Valley Regional District": {
            "gisViewerUrl": "https://www.comoxvalleyrd.ca/about/about-cvrd/imap",
            "gisViewerName": "CVRD iMap",
        },
        "North Okanagan Regional District": {
            "openDataPortalUrl": "https://regional-district-of-north-okanagan-gis-open-data-site-rdnogis.hub.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "gisViewerUrl": "https://regional-district-of-north-okanagan-gis-open-data-site-rdnogis.hub.arcgis.com/",
            "gisViewerName": "RDNO GIS Open Data",
        },
        "Cowichan Valley Regional District": {
            "gisViewerUrl": "https://maps.cvrd.ca/Html5Viewer/index.html?viewer=public",
            "gisViewerName": "CVRD Web Map Viewer",
        },
        "Fraser-Fort George Regional District": {
            "gisViewerUrl": "https://www.rdffg.ca/maps",
            "gisViewerName": "RDFFG PropertyMap",
        },
        "Okanagan-Similkameen Regional District": {
            "openDataPortalUrl": "https://hub-rdos.opendata.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "gisViewerUrl": "https://maps.rdos.bc.ca/",
            "gisViewerName": "RDOS GIS Portal",
        },
        "Columbia-Shuswap Regional District": {
            "openDataPortalUrl": "https://data-csrd.opendata.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "gisViewerUrl": "https://data-csrd.opendata.arcgis.com/",
            "gisViewerName": "CSRD Open Data",
        },
        "Peace River Regional District": {
            "gisViewerUrl": "https://webmap.prrd.bc.ca/",
            "gisViewerName": "PRRD Public Web Map",
        },
        "East Kootenay Regional District": {
            "openDataPortalUrl": "https://data3-ca5c0-rdek.opendata.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "gisViewerUrl": "https://rdek.maps.arcgis.com/",
            "gisViewerName": "RDEK Public Web Map Gallery",
        },
        "Central Kootenay Regional District": {
            "gisViewerUrl": "https://www.rdck.ca/development-community-sustainability-services/mapping/",
            "gisViewerName": "RDCK Web Map",
        },
        "Cariboo Regional District": {
            "gisViewerUrl": "https://map.cariboord.bc.ca/portal/apps/webappviewer/index.html?id=d4d172b6911d49cd9a73582bccabf87b",
            "gisViewerName": "Cariboo RD Public Map",
        },
    },
    "AB": {
        "Red Deer": {
            "openDataPortalUrl": "https://data.reddeer.ca/",
            "portalPlatform": "Custom",
        },
        "Grande Prairie": {
            "openDataPortalUrl": "https://opendata-cityofgp.hub.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "dataFormats": "SHP, GeoJSON, CSV, KML",
            "apiEndpoint": "ArcGIS REST",
            "dataLicence": "OGL",
        },
        "Airdrie": {
            "openDataPortalUrl": "https://data-airdrie.opendata.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "dataFormats": "SHP, GeoJSON, CSV, KML",
            "apiEndpoint": "ArcGIS REST",
            "dataLicence": "OGL",
            "gisViewerUrl": "https://data-airdrie.opendata.arcgis.com/",
            "gisViewerName": "Airdrie GeoConnection",
        },
    },
    "SK": {
        "Saskatoon": {
            "openDataPortalUrl": "https://data-citysaskatoon.opendata.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "dataFormats": "SHP, GeoJSON, CSV, KML",
            "apiEndpoint": "ArcGIS REST",
            "dataLicence": "OGL",
        },
    },
    "ON": {
        "Markham": {
            "openDataPortalUrl": "https://data-markham.opendata.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "dataFormats": "SHP, GeoJSON, CSV, KML",
            "apiEndpoint": "ArcGIS REST",
            "dataLicence": "OGL",
            "gisViewerUrl": "https://maps.markham.ca/html5viewer/?viewer=navigatemarkham",
            "gisViewerName": "Navigate Markham",
        },
        "St. Catharines": {
            "openDataPortalUrl": "https://st-catharines-open-data-2-stcatharines.hub.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "gisViewerUrl": "https://experience.arcgis.com/experience/36ec63fa930a42f9b5e4ffbfa68de3a6/",
            "gisViewerName": "CIVIC Maps",
        },
        "Thunder Bay": {
            "openDataPortalUrl": "https://opendata.thunderbay.ca/",
            "portalPlatform": "ArcGIS Hub",
            "gisViewerUrl": "https://www.thunderbay.ca/en/city-services/maps.aspx",
            "gisViewerName": "Thunder Bay City Web Map",
        },
        "Brantford": {
            "openDataPortalUrl": "https://data-brantford.opendata.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "dataFormats": "SHP, GeoJSON, CSV, KML",
            "apiEndpoint": "ArcGIS REST",
            "dataLicence": "OGL",
        },
        "Haldimand County": {
            "openDataPortalUrl": "https://opendata-haldimand.hub.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "councilUrl": "https://www.haldimandcounty.ca/government-administration/council/council-meetings/",
            "councilPlatform": "Custom",
            "gisViewerUrl": "https://gis.haldimandcounty.ca/portal/apps/webappviewer/index.html?id=8a261d19234042fa81ee1f0dac0a3b22",
            "gisViewerName": "Haldimand County Interactive Map",
        },
        "Richmond Hill": {
            "gisViewerUrl": "https://www.richmondhill.ca/en/learn-more/rh-maps.aspx",
            "gisViewerName": "RH Maps",
        },
    },
    "NB": {
        "Fredericton": {
            "openDataPortalUrl": "https://data-fredericton.opendata.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "dataFormats": "SHP, GeoJSON, CSV, KML",
            "apiEndpoint": "ArcGIS REST",
            "dataLicence": "OGL",
        },
    },
    "NS": {
        "Colchester": {
            "councilUrl": "https://www.colchester.ca/meeting-agenda",
            "councilPlatform": "Custom",
            "gisViewerUrl": "https://www.arcgis.com/apps/dashboards/510215b0a4384cbfaf901dac8b25347a",
            "gisViewerName": "Colchester Zoning Lookup",
        },
    },
    "QC": {
        "Repentigny": {
            "openDataPortalUrl": "https://www.donneesquebec.ca/recherche/organization/ville-de-repentigny",
            "portalPlatform": "Donnees Quebec (CKAN)",
        },
        "Drummondville": {
            "openDataPortalUrl": "https://donnees-vdrummondville.opendata.arcgis.com/",
            "portalPlatform": "ArcGIS Hub",
            "gisViewerUrl": "https://www.drummondville.ca/citoyens/ma-propriete/carte-interactive-ma-propriete/",
            "gisViewerName": "Drummondville Carte Interactive",
        },
        "Saint-Hyacinthe": {
            "openDataPortalUrl": "https://www.donneesquebec.ca/organisation/ville-de-saint-hyacinthe/",
            "portalPlatform": "Donnees Quebec (CKAN)",
        },
        "Montreal (agglomeration)": {
            "openDataPortalUrl": "https://donnees.montreal.ca/",
            "portalPlatform": "CKAN",
        },
        "Quebec (agglomeration)": {
            "openDataPortalUrl": "https://www.ville.quebec.qc.ca/services/donnees-services-ouverts/",
            "portalPlatform": "Donnees Quebec (CKAN)",
        },
        "Longueuil (agglomeration)": {
            "openDataPortalUrl": "https://geohub.longueuil.quebec/pages/donnees-ouvertes",
            "portalPlatform": "ArcGIS Hub",
            "councilUrl": "https://longueuil.quebec/fr/services/instances-decisionnelles-et-consultatives/conseil-agglomeration",
            "councilPlatform": "Custom",
        },
        "Terrebonne": {
            "councilUrl": "https://terrebonne.ca/seances-du-conseil-municipal/",
            "councilPlatform": "Custom",
        },
        "Saint-Jean-sur-Richelieu": {
            "councilUrl": "https://sjsr.ca/seances-du-conseil/",
            "councilPlatform": "Custom",
        },
        "Saint-Jerome": {
            "councilUrl": "https://www.vsj.ca/event-category/seances-du-conseil-municipal/",
            "councilPlatform": "Custom",
            "gisViewerUrl": "https://www.vsj.ca/carte-interactive/",
            "gisViewerName": "Saint-Jerome Carte Interactive",
        },
        "Granby": {
            "councilUrl": "https://www.granby.ca/fr/seances-du-conseil-municipal",
            "councilPlatform": "Custom",
            "gisViewerUrl": "https://www.granby.ca/fr/cartes-et-plans-interactifs",
            "gisViewerName": "Granby Cartes Interactives",
        },
        "Shawinigan": {
            "openDataPortalUrl": "https://www.arcgis.com/home/item.html?id=868283d5a101427facd4ef07c8c7070e",
            "portalPlatform": "ArcGIS Hub",
            "councilUrl": "https://www.shawinigan.ca/ville/conseil-municipal/seances-du-conseil/",
            "councilPlatform": "Custom",
            "gisViewerUrl": "https://www.shawinigan.ca/carte-interactive/",
            "gisViewerName": "Shawinigan Carte Interactive",
        },
        "Brossard": {
            "councilUrl": "https://brossard.ca/assemblees-du-conseil-municipal/",
            "councilPlatform": "Custom",
        },
        "Mirabel": {
            "councilUrl": "https://mirabel.ca/evenements/seance-du-conseil-municipal-1",
            "councilPlatform": "Custom",
            "gisViewerUrl": "https://mirabel.ca/carte-interactive",
            "gisViewerName": "Mirabel Carte Interactive",
        },
        "Chateauguay": {
            "councilUrl": "https://ville.chateauguay.qc.ca/affaires-municipales/seances-du-conseil/",
            "councilPlatform": "Custom",
        },
    },
}


def apply_verified():
    total_updates = 0
    total_fields = 0

    for prov_code, cities in sorted(VERIFIED.items()):
        filepath = DATA_DIR / f"{prov_code.lower()}_research.json"
        if not filepath.exists():
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        entities = data.get("entities", [])
        entity_map = {e["name"]: e for e in entities}
        prov_updates = 0

        for city_name, fields in cities.items():
            entity = entity_map.get(city_name)
            if not entity:
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
                if not old:
                    entity[field] = value
                    city_changes += 1

            if city_changes > 0:
                entity["lastVerified"] = TODAY
                prov_updates += 1
                total_fields += city_changes
                print(f"  {prov_code}/{city_name}: {city_changes} fields")

        if prov_updates > 0:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")

        total_updates += prov_updates

    print(f"\n  TOTAL: {total_updates} entities, {total_fields} field updates")


if __name__ == "__main__":
    print("\n=== Tier 1 Verified Portal/Council/GIS Fill ===\n")
    apply_verified()
