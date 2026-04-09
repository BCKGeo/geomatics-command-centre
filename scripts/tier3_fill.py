"""
Tier 3 Verified Council URL Fill

Applies individually researched council meeting URLs for Tier 3 entities (pop >= 2K).

Usage:
  python scripts/tier3_fill.py
"""

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
TODAY = date.today().isoformat()

def c(url, platform="Custom"):
    return {"councilUrl": url, "councilPlatform": platform}

VERIFIED = {
    # ===================== ON =====================
    "ON": {
        "Fort Erie": c("https://www.forterie.ca/town-hall/council-meetings/"),
        "Orangeville": c("https://calendar.orangeville.ca/meetings"),
        "Grimsby": c("https://pub-grimsby.escribemeetings.com/", "eScribe"),
        "Woolwich": c("https://pub-woolwich.escribemeetings.com/", "eScribe"),
        "Clarence-Rockland": c("https://www.clarence-rockland.com/en/city-hall/council/meetings-minutes/council-regular-meeting-20-mar-2024"),
        "Pelham": c("https://www.pelham.ca/pelham-government/council/council-meetings/"),
        "Lincoln": c("https://www.lincoln.ca/meetings"),
        "Port Hope": c("https://pub-porthope.escribemeetings.com/", "eScribe"),
        "Welland": c("https://pub-welland.escribemeetings.com/", "eScribe"),
        "Niagara-on-the-Lake": c("https://pub-notl.escribemeetings.com/", "eScribe"),
        "West Lincoln": c("https://events.westlincoln.ca/meetings"),
        "Thorold": c("https://pub-thorold.escribemeetings.com/", "eScribe"),
        "Wainfleet": c("https://www.wainfleet.ca/town-hall/council/agendas-and-minutes"),
        "Petrolia": c("https://petrolia.civicweb.net/Portal/", "CivicWeb"),
        "Prescott": c("https://www.prescott.ca/town-hall/agendas-minutes/"),
        "Smiths Falls": c("https://pub-smithsfalls.escribemeetings.com/", "eScribe"),
        "Gananoque": c("https://www.gananoque.ca/town-hall/town-council/council-meetings"),
        "Carleton Place": c("https://pub-carletonplace.escribemeetings.com/", "eScribe"),
        "Perth": c("https://perth.civicweb.net/Portal/MeetingSchedule.aspx", "CivicWeb"),
        "Arnprior": c("https://calendar.arnprior.ca/meetings"),
        "Renfrew": c("https://pub-renfrew.escribemeetings.com/", "eScribe"),
        "Tillsonburg": c("https://www.tillsonburg.ca/town-hall/council/agendas-and-minutes/"),
        "Ingersoll": c("https://ingersoll.civicweb.net/Portal/MeetingTypeList.aspx", "CivicWeb"),
        "Norwich": c("https://www.norwich.ca/en/our-township/agendas-and-minutes.aspx"),
        "South-West Oxford": c("https://www.swox.org/township-services/council/agendas-and-minutes"),
        "Zorra": c("https://zorra.civicweb.net/Portal/", "CivicWeb"),
        "Blandford-Blenheim": c("https://www.blandfordblenheim.ca/my-government/agendas-and-minutes/"),
        "East Zorra-Tavistock": c("https://www.ezt.ca/en/township-office/agendas-and-minutes.aspx"),
        "Huron East": c("https://www.huroneast.com/your-government/agendas-and-minutes/"),
        "Morris-Turnberry": c("https://morristurnberry.ca/government/agendas-minutes"),
        "North Huron": c("https://www.northhuron.ca/en/municipal-government/agendas-minutes.aspx"),
        "Central Huron": c("https://centralhuron.civicweb.net/portal/", "CivicWeb"),
        "South Huron": c("https://pub-southhuron.escribemeetings.com/", "eScribe"),
        "Bluewater": c("https://bluewater.civicweb.net/portal/", "CivicWeb"),
        "Goderich": c("https://pub-goderich.escribemeetings.com/", "eScribe"),
        "Chatham-Kent": c("https://pub-chatham-kent.escribemeetings.com/", "eScribe"),
        "Lambton Shores": c("https://pub-lambtonshores.escribemeetings.com/", "eScribe"),
        "St. Marys": c("https://www.townofstmarys.com/town-government/agendas-minutes/"),
        "Hanover": c("https://www.hanover.ca/council-government/mayor-council/council-and-committee-meetings"),
        "Saugeen Shores": c("https://www.saugeenshores.ca/en/town-hall/agendas-and-minutes.aspx"),
        "West Grey": c("https://www.westgrey.com/municipal-government/agendas-and-minutes/"),
        "Southgate": c("https://pub-southgate.escribemeetings.com/", "eScribe"),
        "South Bruce": c("https://www.southbruce.ca/en/municipal-government/agendas-and-minutes.aspx"),
        "Bracebridge": c("https://bracebridge.civicweb.net/Portal/", "CivicWeb"),
        "Gravenhurst": c("https://gravenhurst.civicweb.net/Portal/", "CivicWeb"),
        "Muskoka Lakes": c("https://muskokalakes.civicweb.net/Portal/MeetingTypeList.aspx", "CivicWeb"),
        "Lake of Bays": c("https://lakeofbays.civicweb.net/Portal/MeetingTypeList.aspx", "CivicWeb"),
        "Parry Sound": c("https://www.parrysound.ca/government/inside-town-council/agendas-and-minutes/"),
        "Midland": c("https://midland.civicweb.net/Portal/", "CivicWeb"),
        "Penetanguishene": c("https://penetanguishene.civicweb.net/Portal/", "CivicWeb"),
        "Tay": c("https://tay.civicweb.net/Portal/", "CivicWeb"),
        "Tiny": c("https://tiny.civicweb.net/Portal/", "CivicWeb"),
        "Clearview": c("https://www.clearview.ca/government-committees/council/agenda-minutes"),
        "Adjala-Tosorontio": c("https://adjala-tosorontio.civicweb.net/Portal/MeetingTypeList.aspx", "CivicWeb"),
        "Shelburne": c("https://www.shelburne.ca/en/town-hall/agendas-and-minutes.aspx"),
        "Mono": c("https://mono.civicweb.net/portal/", "CivicWeb"),
        "Mulmur": c("https://mulmur.ca/town-hall/agendas-minutes/council-meeting-agendas-packages-minutes"),
        "Meaford": c("https://meaford.civicweb.net/Portal/", "CivicWeb"),
        "Grey Highlands": c("https://greyhighlands.civicweb.net/portal/", "CivicWeb"),
        "Georgian Bluffs": c("https://pub-georgianbluffs.escribemeetings.com/", "eScribe"),
        "Chatsworth": c("https://chatsworth.ca/government/agendas-and-minutes/"),
        "Prince Edward County": c("https://princeedwardcounty.civicweb.net/Portal/MeetingSchedule.aspx", "CivicWeb"),
        "Belleville": c("https://citybellevilleon.civicweb.net/Portal/", "CivicWeb"),
        "Greater Napanee": c("https://greaternapanee.civicweb.net/Portal/", "CivicWeb"),
        "Loyalist": c("https://loyalist.civicweb.net/portal/", "CivicWeb"),
        "South Stormont": c("https://www.southstormont.ca/en/town-hall/council-meetings.aspx"),
        "North Dundas": c("https://www.northdundas.com/local-government-laws/council/council-reports-minutes"),
        "North Grenville": c("https://pub-northgrenville.escribemeetings.com/", "eScribe"),
        "Edwardsburgh/Cardinal": c("https://calendar.twpec.ca/meetings"),
        "North Glengarry": c("https://www.northglengarry.ca/government/council-meeting-information/"),
        "South Glengarry": c("https://www.southglengarry.com/en/municipal-services/agendas-and-minutes.aspx"),
    },
    # ===================== AB =====================
    "AB": {
        "Ponoka County": c("https://ponokacounty.civicweb.net/", "CivicWeb"),
        "Camrose County": c("https://county.camrose.ab.ca/county-administration/agendas-minutes/"),
        "Banff": c("https://banff.ca/agendacenter"),
        "Municipal District of Greenview No. 16": c("https://mdgreenview.ab.ca/government/minutes-and-agendas/"),
        "Vermilion River County": c("https://www.vermilion-river.com/your-county/meeting-agendas-and-minutes"),
        "Clearwater County": c("https://www.clearwatercounty.ca/p/minutes-and-agendas"),
        "Cypress County": c("https://www.cypress.ab.ca/p/minutes-agendas"),
        "Wheatland County": c("https://wheatlandcounty.ca/agendasandminutes/"),
        "Ponoka": c("https://www.ponoka.ca/p/council-minutes-and-agendas"),
        "Innisfail": c("https://innisfail.civicweb.net/portal/", "CivicWeb"),
        "Edson": c("https://edson.civicweb.net/portal/", "CivicWeb"),
        "Peace River": c("https://www.peaceriver.ca/town-hall/town-council/agendas-minutes"),
        "Bonnyville": c("https://town.bonnyville.ab.ca/town-council/"),
        "Drayton Valley": c("https://draytonvalley.civicweb.net/Portal/MeetingInformation.aspx", "CivicWeb"),
        "Olds": c("https://www.olds.ca/councilmeetings"),
        "Devon": c("https://www.devon.ca/Government/Town-Hall/Council-Meetings/Council-Agendas"),
        "Stettler": c("https://www.stettler.net/the-town/council/agendas-minutes"),
        "Westlock": c("https://www.westlock.ca/p/council-meetings"),
        "Slave Lake": c("https://www.slavelake.ca/AgendaCenter"),
        "Didsbury": c("https://www.didsbury.ca/p/council-meetings"),
        "Three Hills": c("https://threehills.ca/p/council-meeting-minutes-agendas"),
        "High Level": c("https://www.highlevel.ca/agendacenter"),
        "Athabasca": c("https://www.athabasca.ca/p/agendas-and-meeting-minutes"),
        "Vegreville": c("https://www.vegreville.com/municipal/council/council-meetings/agendas-and-minutes"),
        "Barrhead": c("https://www.barrhead.ca/p/minutes-agendas"),
        "Pincher Creek": c("http://www.pinchercreek.ca/town/minutes.php"),
        "Sundre": c("https://www.sundre.com/p/meeting-minutes-and-agendas"),
        "Coaldale": c("https://www.coaldale.ca/town-council/meetings-agendas-minutes"),
    },
    # ===================== SK =====================
    "SK": {
        "Corman Park No. 344": c("https://www.rmcormanpark.ca/AgendaCenter"),
        "Humboldt": c("https://humboldt.ca/minutes-agendas"),
        "Melfort": c("https://melfort.ca/p/minutes-agendas"),
        "Meadow Lake": c("https://meadowlake.ca/p/meetings"),
        "Nipawin": c("https://nipawin.com/government/council/"),
        "Melville": c("https://melville.ca/p/agendas-minutes"),
        "Kindersley": c("https://kindersley.civicweb.net/Portal/MeetingTypeList.aspx", "CivicWeb"),
        "Battleford": c("https://www.battleford.ca/p/council-agenda-and-minutes"),
        "Rosetown": c("https://rosetown.ca/agendacenter"),
        "Tisdale": c("https://tisdale.ca/council-meeting-agenda-minutes"),
    },
    # ===================== MB =====================
    "MB": {
        "RM of East St. Paul": c("https://www.eaststpaul.com/p/meetings-minutes"),
        "RM of Stanley": c("https://rmofstanley.ca/p/council-meeting-minutes"),
        "RM of Rockwood": c("https://www.rockwood.ca/p/minutes-and-agendas"),
        "RM of Macdonald": c("https://www.rmofmacdonald.com/p/council-meetings"),
        "RM of Ritchot": c("https://www.ritchot.com/p/meeting-agendas"),
        "RM of Rosser": c("https://www.rmofrosser.com/p/meeting-dates-minutes-agendas"),
        "RM of Headingley": c("https://www.rmofheadingley.ca/p/agendas-minutes"),
        "RM of La Broquerie": c("https://www.labroquerie.com/p/agendas-minutes"),
        "RM of De Salaberry": c("https://www.rmdesalaberry.mb.ca/p/council-minutes-agendas"),
        "RM of Ste. Anne": c("https://www.rmofsteanne.com/main.php?p=24"),
        "RM of Brokenhead": c("https://rmofbrokenhead.civicweb.net/portal/", "CivicWeb"),
        "Morden": c("https://morden.ca/council-agendas-minutes"),
        "Niverville": c("https://www.whereyoubelong.ca/town-services/resources/meeting-minutes-agenda/"),
        "Stonewall": c("https://www.stonewall.ca/p/meeting-minutes-and-agendas"),
        "Altona": c("https://altona.ca/p/meeting-minutes"),
        "Neepawa": c("https://www.neepawa.ca/meeting-minutes/"),
        "Dauphin": c("https://www.dauphin.ca/p/minutes"),
        "Swan River": c("https://www.swanrivermanitoba.ca/p/agendas-minutes"),
        "The Pas": c("https://townofthepas.ca/agendas-and-minutes"),
        "Flin Flon (part)": c("https://www.cityofflinflon.ca/p/meeting-minutes-and-agendas"),
    },
    # ===================== QC =====================
    "QC": {
        "Farnham": c("https://ville.farnham.qc.ca/ville/democratie/seances-du-conseil/"),
        "Stoneham-et-Tewkesbury": c("https://www.villestoneham.com/ma-municipalite/democratie/seances-du-conseil"),
        "Pont-Rouge": c("https://www.ville.pontrouge.qc.ca/vie-municipale/vie-democratique/conseil-municipal/seances-du-conseil-municipal/"),
        "Saint-Zotique": c("https://st-zotique.com/evenements/seance-du-conseil/"),
        "Coaticook": c("https://www.coaticook.ca/fr/ville/seances-publiques.php"),
        "Mercier": c("https://www.ville.mercier.qc.ca/affaires-municipales/seances-du-conseil/"),
        "Prevost": c("https://www.ville.prevost.qc.ca/guichet-citoyen/informations/seances-du-conseil"),
        "Saint-Colomban": c("https://st-colomban.qc.ca/ville/vie-democratique/seances-du-conseil"),
        "Princeville": c("https://princeville.quebec/conseil-municipal/"),
        "Saint-Cesaire": c("https://www.villesaintcesaire.com/ma-ville/ordres-du-jour-et-proces-verbaux/"),
        "Lac-Beauport": c("https://lac-beauport.quebec/conseil-municipal/seances-du-conseil/"),
        "Sainte-Brigitte-de-Laval": c("https://sbdl.net/notre-ville/conseil-municipal/"),
        "Plessisville": c("https://plessisville.quebec/ma-ville/democratie/seances-du-conseil"),
        "Boischatel": c("https://www.boischatel.ca/ma-ville/vie-democratique/seance-du-conseil"),
        "Donnacona": c("https://villededonnacona.com/fr/municipalite/conseil-municipal/seances-du-conseil"),
        "Notre-Dame-de-l'Ile-Perrot": c("https://www.ndip.org/seances-du-conseil"),
        "Saint-Calixte": c("https://saint-calixte.ca/municipalite/mairie/seances-du-conseil"),
        "Shannon": c("https://shannon.ca/en/municipal-life/council-meetings/"),
        "Charlemagne": c("https://www.charlemagne.ca/la-ville/vie-democratique/seances-du-conseil"),
        "Saint-Roch-de-l'Achigan": c("https://sra.quebec/seances-du-conseil"),
        "Saint-Lin-Laurentides": c("https://www.saint-lin-laurentides.com/decouvrir/votre-conseil/seances-du-conseil-et-proces-verbaux"),
        "Sainte-Anne-de-Bellevue": c("https://www.ville.sainte-anne-de-bellevue.qc.ca/citoyens/vie-democratique/seances-du-conseil"),
        "Rawdon": c("http://rawdon.ca/administration-municipale/conseil-municipal/seances-du-conseil/"),
        "L'Ange-Gardien": c("https://langegardien.qc.ca/la-municipalite/lorganisation-municipale/le-conseil-municipal/"),
        "Beaupre": c("https://www.villedebeaupre.com/pages/conseil-municipal-et-comites"),
        "Portneuf": c("https://villedeportneuf.com/fr/ma-ville/conseil-municipal/seances-du-conseil"),
        "Saint-Augustin-de-Desmaures": c("https://vsad.ca/calendrierseances"),
        "Senneville": c("https://www.senneville.ca/municipalite/vie-democratique/ordres-du-jour-proces-verbaux-et-visioconference/"),
        "Baie-d'Urfe": c("https://baie-durfe.qc.ca/fr/vie-democratique/page/seances-du-conseil-municipal"),
        "Fossambault-sur-le-Lac": c("https://fossambault-sur-le-lac.com/ville/democratie/diffusion-des-seances-du-conseil/"),
    },
    # ===================== NB =====================
    "NB": {
        "Tracadie": c("https://tracadienb.ca/en/town-hall/council-meetings"),
        "Cap-Acadie": c("https://capacadie.ca/en/municipality/council-meetings"),
        "Beausoleil": c("https://mairie-beausoleil.ca/en/town-hall/board-meetings-and-minutes"),
        "Shediac": c("https://shediac.ca/en/town-hall/council-meetings"),
        "Beaurivage": c("https://beaurivage.org/municipality/meeting-minutes/"),
        "Saint-Georges": c("https://easterncharlotte.ca/council/council-meetings/"),
        "Memramcook": c("https://memramcook.com/en/site_content/item/57-council-meetings"),
        "Fundy Albert": c("https://fundyalbert.ca/governance/council-meetings/"),
        "Grand Bay-Westfield": c("https://grandbaywestfield.ca/council-meetings-agendas-and-minutes/"),
        "Hanwell": c("https://www.hanwell.nb.ca/council/council-meetings/"),
        "Sussex": c("https://sussex.ca/document-category/council-meetings/"),
        "Hampton": c("https://hampton.ca/documents/town-hall-meeting-agenda/"),
        "St. Stephen": c("https://town.ststephen.nb.ca/municipal-district-office/minutes-agendas-records-and-notice-meetings"),
        "New Maryland": c("https://vonm.ca/town-hall/committees-of-council/council-meeting-minutes/"),
        "Sackville": c("https://tantramarnb.com/administration-and-government/meetings-minutes-and-agendas"),
        "Woodstock": c("https://woodstocknb.ca/minutes-agendas"),
        "Dalhousie": c("https://www.heron-bay.ca/meeting-archives-1"),
        "Five Rivers": c("https://5-rivers.ca/city-hall/council-minutes/"),
        "Grand Manan": c("https://www.villageofgrandmanan.com/document-type/council-meeting-minutes/"),
        "Salisbury": c("https://salisburynb.ca/municipal-office/council-meetings/"),
        "Saint-Quentin": c("https://www.saintquentinnb.com/en/r%C3%A9unions-du-conseil"),
        "Neguac": c("https://www.neguac.com/en/home-2/reunions/"),
        "Saint-Antoine": c("https://saint-antoine.ca/en/municipality/council-meetings/2022"),
    },
    # ===================== NS =====================
    "NS": {
        "Yarmouth District": c("https://munyarmouth.ca/index.php/government/agendas-minutes"),
        "Richmond County": c("https://www.richmondcounty.ca/council/municipal-documents-agendas-minutes-and-finances/regular-council/council-minutes.html"),
        "Argyle": c("https://www.munargyle.com/minutes-agendas-and-recordings.html"),
        "Clare": c("https://www.clarenovascotia.com/en/governance/council/council-meeting-minutes"),
        "Digby District": c("https://digbymun.ca/government/council-meeting-minutes.html"),
        "Cumberland County": c("https://www.cumberlandcounty.ns.ca/council-minutes-agendas.html"),
        "Victoria County": c("https://pub-victoria.escribemeetings.com/", "eScribe"),
        "Queens": c("https://www.regionofqueens.com/council-governance/council-agendas-minutes-audio/"),
        "West Hants": c("https://www.westhants.ca/government/council-documents.html"),
        "Kings": c("https://www.countyofkings.ca/government/council/Agendas-Minutes"),
        "East Hants": c("https://www.easthants.ca/meeting-minutes-agendas/"),
        "Barrington": c("https://www.barringtonmunicipality.com/council/barrington-council-minutes"),
        "Annapolis": c("https://annapoliscounty.ca/home/208"),
        "Chester": c("https://chester.ca/government/council/council-meetings"),
        "Mahone Bay": c("https://www.townofmahonebay.ca/council-agendas-minutes--meeting-packages.html"),
    },
    # ===================== NL =====================
    "NL": {
        "Portugal Cove-St. Philip's": c("https://pcsp.civicweb.net/Portal/MeetingTypeList.aspx", "CivicWeb"),
        "Happy Valley-Goose Bay": c("https://townhvgb.com/town-hall/council-committees2/meetings-minutes-2/"),
        "Labrador City": c("https://labradorwest.com/town-hall/council/all/"),
        "Clarenville": c("https://clarenville.ca/town-hall/councilmeetingminutes/"),
        "Stephenville": c("https://www.stephenville.ca/town-hall/meeting-minutes-live-videos"),
        "Deer Lake": c("https://townofdeerlake.ca/town-hall/council-minutes/"),
        "Marystown": c("https://marystown.ca/town-hall/minutes-agendas/"),
        "Bonavista": c("https://www.townofbonavista.com/minutes"),
        "Channel-Port aux Basques": c("https://www.portauxbasques.ca/town-hall/council-minutes/"),
        "Lewisporte": c("https://www.lewisporte.ca/town/meetings/"),
        "Pasadena": c("https://pasadena.ca/council-minutes/"),
        "Harbour Grace": c("https://townofharbourgrace.ca/town-hall/council-minutes/"),
        "Torbay": c("https://torbay.civicweb.net/Portal/MeetingTypeList.aspx", "CivicWeb"),
        "Witless Bay": c("https://www.witlessbay.ca/minutes"),
        "Holyrood": c("https://holyrood.ca/local-government/town-council/council-minutes/"),
        "Flatrock": c("https://townofflatrock.com/meeting-minutes/"),
        "Pouch Cove": c("https://pouchcove.ca/town-hall/meeting-minutes/"),
        "Logy Bay-Middle Cove-Outer Cove": c("https://lbmcoc.ca/council-minutes-and-agenda/"),
    },
    # ===================== NT =====================
    "NT": {
        "Hay River": c("https://hayriver.com/council-agendas/"),
        "Inuvik": c("https://calendar.inuvik.ca/council/"),
        "Fort Smith": c("https://www.fortsmith.ca/municipal/governance/council-meetings"),
    },
    # ===================== NU =====================
    "NU": {
        "Rankin Inlet": c("https://rankininlet.ca/documents/"),
        "Arviat": c("https://www.arviat.ca/hamlet-office/council-minutes"),
    },
}


def apply():
    total_entities = 0
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
        prov_fields = 0

        for city_name, fields in cities.items():
            entity = entity_map.get(city_name)
            if not entity:
                for e in entities:
                    if city_name.lower() == e["name"].lower() or city_name.lower() in e["name"].lower():
                        entity = e
                        break

            if not entity:
                print(f"  NOT FOUND: {city_name} in {prov_code}")
                continue

            changes = 0
            for field, value in fields.items():
                if not value:
                    continue
                if not entity.get(field):
                    entity[field] = value
                    changes += 1

            if changes > 0:
                entity["lastVerified"] = TODAY
                prov_updates += 1
                prov_fields += changes

        if prov_updates > 0:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")
            print(f"  {prov_code}: {prov_updates} entities, {prov_fields} fields")

        total_entities += prov_updates
        total_fields += prov_fields

    print(f"\n  TOTAL: {total_entities} entities, {total_fields} fields")


if __name__ == "__main__":
    print("\n=== Tier 3 Verified Council Fill ===\n")
    apply()
