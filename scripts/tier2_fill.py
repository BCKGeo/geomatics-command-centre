"""
Tier 2 Verified Portal/Council Fill

Applies individually researched portal and council URLs for 313 Tier 2 entities.

Usage:
  python scripts/tier2_fill.py
"""

import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
TODAY = date.today().isoformat()

def portal_entry(url, platform="ArcGIS Hub"):
    """Shorthand for portal fields."""
    entry = {"openDataPortalUrl": url, "portalPlatform": platform}
    if "arcgis" in platform.lower() or "hub" in platform.lower():
        entry.update({"dataFormats": "SHP, GeoJSON, CSV, KML", "apiEndpoint": "ArcGIS REST", "dataLicence": "OGL"})
    return entry

def council_entry(url, platform="Custom"):
    return {"councilUrl": url, "councilPlatform": platform}

# All verified Tier 2 research results
VERIFIED = {
    # ===================== BC =====================
    "BC": {
        "West Vancouver": {**portal_entry("https://mapping.westvancouver.ca/OD/dbo_OPENDATA_FILES_list.php", "Custom"), **council_entry("https://westvancouver.ca/mayor-council/council-agendas-minutes")},
        "Langford": council_entry("https://pub-langford.escribemeetings.com/", "eScribe"),
        "White Rock": {**portal_entry("https://data.whiterockcity.ca/", "Custom"), **council_entry("https://www.whiterockcity.ca/894/Council-Meeting-Agendas-Minutes-Videos")},
        "West Kelowna": {**portal_entry("https://www.westkelownacity.ca/en/building-business-and-development/open-data.aspx", "Custom"), **council_entry("https://pub-westkelowna.escribemeetings.com/", "eScribe")},
        "Vernon": {**portal_entry("https://www.vernon.ca/government-services/maps-gis/open-data-catalogue", "Custom"), **council_entry("https://www.vernon.ca/government-services/mayor-council/council-meetings/council-meeting-agenda-minutes")},
        "Courtenay": council_entry("https://pub-courtenay.escribemeetings.com/", "eScribe"),
        "Campbell River": {**portal_entry("https://data-crcc.opendata.arcgis.com/"), **council_entry("https://campbellriver.civicweb.net/Portal/MeetingTypeList.aspx", "CivicWeb")},
        "Mission": council_entry("https://www.mission.ca/council-government/meetings-agendas"),
        "Port Moody": {**portal_entry("https://data-portmoody.opendata.arcgis.com/"), **council_entry("https://pub-portmoody.escribemeetings.com/", "eScribe")},
        "North Cowichan": {**portal_entry("http://data.northcowichan.ca", "Custom"), **council_entry("https://www.northcowichan.ca/municipal-hall/mayor-council/agendas-minutes-video")},
        "Salmon Arm": council_entry("https://www.salmonarm.ca/AgendaCenter"),
        "Colwood": council_entry("https://colwood.civicweb.net/portal/", "CivicWeb"),
        "Pitt Meadows": {**portal_entry("https://www.pittmeadows.ca/city-services/city-maps-open-data", "Custom"), **council_entry("https://pub-pittmeadows.escribemeetings.com/", "eScribe")},
        "Parksville": {**portal_entry("http://www.parksville.ca/cms.asp?wpID=697", "Custom"), **council_entry("http://www.parksville.ca/cms.asp?wpID=674")},
        "Dawson Creek": council_entry("https://dawsoncreek.civicweb.net/portal/", "CivicWeb"),
        "Fort St. John": council_entry("https://www.fortstjohn.ca/local-government/council/council-meetings"),
        "Terrace": council_entry("https://terrace.civicweb.net/portal/", "CivicWeb"),
        "Prince Rupert": council_entry("https://www.princerupert.ca/city-hall/council-meetings/council-meeting-agendas-minutes"),
        "Nelson": {**portal_entry("https://data.nelsoncity.opendata.arcgis.com/"), **council_entry("https://nelson.civicweb.net/Portal/", "CivicWeb")},
        "Williams Lake": council_entry("https://williamslake.civicweb.net/Portal/", "CivicWeb"),
        "Powell River": council_entry("https://powellriver.civicweb.net/Portal/MeetingTypeList.aspx", "CivicWeb"),
        "Port Alberni": council_entry("https://www.portalberni.ca/council-agendas-minutes"),
        "Oak Bay": council_entry("https://oakbay.civicweb.net/portal/", "CivicWeb"),
        "Central Saanich": council_entry("https://centralsaanich.civicweb.net/Portal/MeetingInformation.aspx", "CivicWeb"),
        "Sooke": council_entry("https://sooke.civicweb.net/Portal/", "CivicWeb"),
        "Coldstream": council_entry("https://coldstream.civicweb.net/portal/", "CivicWeb"),
        "Summerland": {**portal_entry("https://open-data-summerland.hub.arcgis.com/"), **council_entry("https://summerland.civicweb.net/Portal/", "CivicWeb")},
        "Lake Country": {**portal_entry("https://dlc-open-data-dlc.hub.arcgis.com/"), **council_entry("https://www.lakecountry.bc.ca/council-meeting-calendar")},
        "Whistler": {**portal_entry("https://portal-rmow.opendata.arcgis.com/"), **council_entry("https://www.whistler.ca/mayor-council/council-meetings/council-video-agendas-minutes/")},
        "Comox": council_entry("https://www.comox.ca/councilmeetings"),
        "View Royal": council_entry("https://www.viewroyal.ca/EN/main/town/agendas-minutes-videos/council-meetings.html"),
        "Sechelt": council_entry("https://pub-sechelt.escribemeetings.com/", "eScribe"),
        "North Saanich": council_entry("https://northsaanich.civicweb.net/Portal/", "CivicWeb"),
        # Regional Districts
        "Strathcona Regional District": {**portal_entry("https://data-strathconard.opendata.arcgis.com/"), **council_entry("https://srd.ca/government/agendas-minutes/")},
        "Squamish-Lillooet Regional District": council_entry("https://slrd.civicweb.net/portal/", "CivicWeb"),
        "Kootenay Boundary Regional District": council_entry("https://rdkb.civicweb.net/", "CivicWeb"),
        "Sunshine Coast Regional District": {**portal_entry("https://data-myscrd.opendata.arcgis.com/"), **council_entry("https://www.scrd.ca/about-us/board-committee-meetings/agendas/")},
        "Bulkley-Nechako Regional District": council_entry("https://www.rdbn.bc.ca/departments/administration/regional-board-committee-meetings"),
        "Alberni-Clayoquot Regional District": council_entry("https://www.acrd.bc.ca/agendas"),
        "Kitimat-Stikine Regional District": council_entry("https://kitimatstikine.civicweb.net/portal/", "CivicWeb"),
        "North Coast Regional District": council_entry("https://ncrdbc.civicweb.net/portal/", "CivicWeb"),
        "Mount Waddington Regional District": council_entry("https://www.rdmw.bc.ca/government/meetings-agendas-minutes/"),
        "qathet Regional District": council_entry("https://qathetrd.civicweb.net/Portal/", "CivicWeb"),
    },
    # ===================== AB =====================
    "AB": {
        "Spruce Grove": council_entry("https://pub-sprucegrove.escribemeetings.com/", "eScribe"),
        "Cochrane": {**portal_entry("https://geohub.cochrane.ca/pages/open-data"), **council_entry("https://cochraneab.civicweb.net/portal/", "CivicWeb")},
        "Leduc": council_entry("https://pub-leduc.escribemeetings.com/", "eScribe"),
        "Fort Saskatchewan": council_entry("https://www.fortsask.ca/en/your-city-hall/agendas-and-minutes.aspx"),
        "Chestermere": {**portal_entry("https://data-chestermere.opendata.arcgis.com/"), **council_entry("https://chestermere.civicweb.net/portal/welcome.aspx", "CivicWeb")},
        "Beaumont": council_entry("https://beaumontab.civicweb.net/portal/", "CivicWeb"),
        "Camrose": council_entry("https://www.camrose.ca/en/your-government/council-meetings.aspx"),
        "Stony Plain": council_entry("https://www.stonyplain.com/en/town-hall/agendas-and-minutes.aspx"),
        "Sylvan Lake": council_entry("https://www.sylvanlake.ca/en/your-government/agendas-and-minutes.aspx"),
        "Canmore": {**portal_entry("https://opendata-canmore.opendata.arcgis.com/"), **council_entry("https://canmore.ca/town-hall/town-council/council-minutes-agendas")},
        "Cold Lake": council_entry("https://www.coldlake.com/content/agendas-and-minutes"),
        "Brooks": council_entry("https://www.brooks.ca/AgendaCenter"),
        "High River": {**portal_entry("https://highriver-hrmdf.hub.arcgis.com/"), **council_entry("https://highriver.civicweb.net/Portal/", "CivicWeb")},
        "Wetaskiwin": council_entry("https://wetaskiwin.civicweb.net/Portal/MeetingSchedule.aspx", "CivicWeb"),
        "Lloydminster": council_entry("https://www.lloydminster.ca/council-administration/mayor-and-council/agendas-and-minutes/"),
        "Blackfalds": council_entry("https://www.blackfalds.ca/p/council-meeting-agendas-and-minutes"),
        "Whitecourt": council_entry("https://www.whitecourt.ca/your-town/mayor-council/council-agenda-minutes"),
        "Morinville": council_entry("https://www.morinville.ca/town-hall/council/meetings-of-council/"),
        "Hinton": council_entry("https://hinton.civicweb.net/Portal/", "CivicWeb"),
        "Strathmore": council_entry("https://www.strathmore.ca/municipal-centre/administration-services/legislative-services/"),
        "Rocky View County": council_entry("https://pub-rockyview.escribemeetings.com/", "eScribe"),
        "Parkland County": {**portal_entry("https://opendata.parklandcounty.com/search", "Custom"), **council_entry("https://www.parklandcounty.com/county-government/meetings/")},
        "Sturgeon County": {**portal_entry("https://data-sturgeoncounty.opendata.arcgis.com/"), **council_entry("https://pub-sturgeoncounty.escribemeetings.com/", "eScribe")},
        "Red Deer County": council_entry("https://reddeercounty.civicweb.net/portal/", "CivicWeb"),
        "Foothills County": council_entry("https://www.foothillscountyab.ca/government/council-committees/meetings-hearings"),
        "Lacombe County": council_entry("https://www.lacombecounty.com/our-government/agendas-and-minutes/"),
        "Mountain View County": council_entry("https://mountainviewcounty.civicweb.net/portal/", "CivicWeb"),
        "Leduc County": council_entry("https://www.leduc-county.com/en/county-government/agendas-minutes-and-livestream.aspx"),
        "Grande Prairie County No. 1": {**portal_entry("https://opendata.countygp.ab.ca/", "Custom"), **council_entry("https://calendar.countygp.ab.ca/")},
        "Yellowhead County": council_entry("https://yellowheadcounty.civicweb.net/Portal/MeetingSchedule.aspx", "CivicWeb"),
        "County of Grande Prairie No. 1": {**portal_entry("https://opendata.countygp.ab.ca/", "Custom"), **council_entry("https://calendar.countygp.ab.ca/")},
        "MD of Bonnyville No. 87": council_entry("https://www.md.bonnyville.ab.ca/313/Agendas-Minutes"),
        "County of Wetaskiwin No. 10": council_entry("https://www.county.wetaskiwin.ab.ca/731/Council-Meetings"),
        "Lac Ste. Anne County": council_entry("https://www.lsac.ca/government/county-council/meetings-and-public-hearings/council-meeting-minutes"),
        "Lethbridge County": council_entry("https://www.lethcounty.ca/p/council-meetings"),
        "Mackenzie County": council_entry("https://mackenziecounty.com/councilmeetings/"),
    },
    # ===================== SK =====================
    "SK": {
        "Prince Albert": council_entry("https://www.citypa.ca/en/city-hall/Meetings__Minutes_and_Agendas.aspx"),
        "Moose Jaw": council_entry("https://moosejaw.ca/city-council/"),
        "Swift Current": council_entry("https://www.swiftcurrent.ca/about-us/city-council/city-council-2026-meeting-dates-agendas-minutes"),
        "Yorkton": council_entry("https://calendar.yorkton.ca/meetings"),
        "North Battleford": council_entry("https://www.cityofnb.ca/our-city-government/city-council/agendas-and-minutes/"),
        "Warman": council_entry("https://warman.civicweb.net/Portal/MeetingTypeList.aspx", "CivicWeb"),
        "Martensville": council_entry("https://www.martensville.ca/pages/agendas_and_minutes.html"),
        "Estevan": council_entry("https://estevan.ca/council-meetings-and-agendas-2-2/"),
        "Weyburn": council_entry("https://weyburn.ca/council-agenda-minutes/"),
    },
    # ===================== MB =====================
    "MB": {
        "Steinbach": council_entry("https://www.steinbach.ca/city-hall/city-council/"),
        "Thompson": council_entry("https://www.thompson.ca/p/minutes-agendas"),
        "Portage la Prairie": council_entry("https://www.city-plap.com/council-administration/council/agendas-and-minutes/"),
        "Winkler": council_entry("https://cityofwinkler.ca/p/council-meetings"),
        "Selkirk": council_entry("https://www.myselkirk.ca/city-government/city-council/council-and-committee-minutes/"),
        "RM of Hanover": council_entry("https://www.hanovermb.ca/p/council-meetings"),
        "RM of Springfield": council_entry("https://www.rmofspringfield.ca/p/meeting-minutes"),
        "RM of St. Andrews": council_entry("https://www.rmofstandrews.com/p/minutes-agendas"),
        "RM of St. Clements": council_entry("https://rmofstclements.com/council-meeting-minutes-agendas-and-recordings/"),
        "RM of Tache": council_entry("https://www.rmtache.ca/p/meeting-minutes-agendas"),
    },
    # ===================== ON =====================
    "ON": {
        "Clarington": {**portal_entry("https://claringtons-public-map-gallery-2-clarington.hub.arcgis.com/"), **council_entry("https://pub-clarington.escribemeetings.com/", "eScribe")},
        "Caledon": portal_entry("https://data-caledon.opendata.arcgis.com/"),
        "Halton Hills": council_entry("https://pub-haltonhills.escribemeetings.com/", "eScribe"),
        "Peterborough": {**portal_entry("https://data-ptbo.opendata.arcgis.com/"), **council_entry("https://pub-peterborough.escribemeetings.com/", "eScribe")},
        "Kawartha Lakes": {**portal_entry("https://open-data-kawartha.hub.arcgis.com/"), **council_entry("https://pub-kawarthalakes.escribemeetings.com/", "eScribe")},
        "Norfolk County": {**portal_entry("https://opendata.norfolkcounty.ca/", "Custom"), **council_entry("https://www.norfolkcounty.ca/government/agendas-minutes/")},
        "Sault Ste. Marie": {**portal_entry("https://cityssm.github.io/soomaps-data/", "Custom"), **council_entry("https://saultstemarie.ca/Government/City-Departments/Corporate-Services/City-Clerk/Council-Agendas-and-Minutes.aspx")},
        "North Bay": {**portal_entry("https://data-northbaygis.hub.arcgis.com/"), **council_entry("https://northbay.ca/city-government/meetings-agendas-minutes/")},
        "Timmins": council_entry("https://timmins.civicweb.net/portal/", "CivicWeb"),
        "Woodstock": council_entry("https://www.cityofwoodstock.ca/en/city-governance/agendas-meetings-and-minutes.aspx"),
        "Cornwall": {**portal_entry("https://www.cornwall.ca/en/city-hall/open-data.aspx", "Custom"), **council_entry("https://pub-cornwall.escribemeetings.com/", "eScribe")},
        "Orillia": council_entry("https://orillia.civicweb.net/portal/", "CivicWeb"),
        "Stratford": council_entry("https://pub-stratford.escribemeetings.com/", "eScribe"),
        "Aurora": {**portal_entry("https://www.aurora.ca/business-and-development/data-hub/", "Custom"), **council_entry("https://pub-auroraon.escribemeetings.com/", "eScribe")},
        "Whitchurch-Stouffville": council_entry("https://pub-townofws.escribemeetings.com/", "eScribe"),
        "Georgina": {**portal_entry("https://navigategeorgina-georgina.hub.arcgis.com/"), **council_entry("https://pub-georgina.escribemeetings.com/", "eScribe")},
        "Quinte West": {**portal_entry("https://geodata-quintewest.opendata.arcgis.com/"), **council_entry("https://quintewest.civicweb.net/portal/", "CivicWeb")},
        "Innisfil": council_entry("https://innisfil.civicweb.net/portal/", "CivicWeb"),
        "Bradford West Gwillimbury": council_entry("https://bradfordwestgwillimbury.civicweb.net/portal/", "CivicWeb"),
        "County of Brant": {**portal_entry("https://www.brant.ca/en/community-and-support/open-data.aspx", "Custom"), **council_entry("https://pub-brant.escribemeetings.com/", "eScribe")},
        "Brockville": council_entry("https://brockville.civicweb.net/portal/", "CivicWeb"),
        "Owen Sound": council_entry("https://pub-owensound.escribemeetings.com/", "eScribe"),
        "Huntsville": {**portal_entry("https://huntsville-muskoka.opendata.arcgis.com/"), **council_entry("https://www.huntsville.ca/council-administration/engage-with-council/public-meetings/")},
        "Collingwood": council_entry("https://collingwood.civicweb.net/portal/", "CivicWeb"),
        "Wasaga Beach": council_entry("https://pub-wasagabeach.escribemeetings.com/", "eScribe"),
        "New Tecumseth": council_entry("https://newtecumseth.civicweb.net/Portal/", "CivicWeb"),
        "Essa": council_entry("https://www.essatownship.on.ca/council-administration/agendas-and-minutes/"),
        "Oro-Medonte": council_entry("https://oromedonte.civicweb.net/portal/", "CivicWeb"),
        "Amherstburg": {**portal_entry("https://amherstburg-open-data-essexcounty.hub.arcgis.com/"), **council_entry("https://pub-amherstburg.escribemeetings.com/", "eScribe")},
        "Essex": {**portal_entry("https://town-of-essex-essexcounty.opendata.arcgis.com/"), **council_entry("https://townofessex-pub.escribemeetings.com/", "eScribe")},
        "Kingsville": {**portal_entry("https://kingsville-essexcounty.opendata.arcgis.com/"), **council_entry("https://kingsville-pub.escribemeetings.com/", "eScribe")},
        "Lakeshore": council_entry("https://pub-lakeshore.escribemeetings.com/", "eScribe"),
        "LaSalle": {**portal_entry("https://lasalle-essexcounty.opendata.arcgis.com/"), **council_entry("https://pub-lasalle.escribemeetings.com/", "eScribe")},
        "Leamington": {**portal_entry("https://leamington-essexcounty.opendata.arcgis.com/"), **council_entry("https://events.leamington.ca/meetings")},
        "Tecumseh": portal_entry("https://tecumseh-essexcounty.opendata.arcgis.com/"),
        "Centre Wellington": council_entry("https://centrewellington.civicweb.net/Portal/", "CivicWeb"),
        "Cobourg": {**portal_entry("https://public-townofcobourg.hub.arcgis.com/"), **council_entry("https://pub-cobourg.escribemeetings.com/", "eScribe")},
        "Strathroy-Caradoc": council_entry("https://pub-strathroy-caradoc.escribemeetings.com/", "eScribe"),
        "South Frontenac": council_entry("https://southfrontenac.civicweb.net/portal/", "CivicWeb"),
    },
    # ===================== QC =====================
    "QC": {
        "Boucherville": council_entry("https://www.boucherville.ca/mairie-conseil/seances-du-conseil/"),
        "Victoriaville": council_entry("https://victoriaville.ca/conseil-municipal-et-elections/seances-du-conseil-et-proces-verbaux"),
        "Salaberry-de-Valleyfield": council_entry("https://www.ville.valleyfield.qc.ca/seances-du-conseil"),
        "Saint-Eustache": council_entry("https://www.saint-eustache.ca/vie-democratique/seances-du-conseil"),
        "Vaudreuil-Dorion": council_entry("https://www.ville.vaudreuil-dorion.qc.ca/fr/la-ville/mairie/seances-publiques"),
        "Chambly": council_entry("https://www.ville.chambly.qc.ca/assemblees-du-conseil/"),
        "Alma": council_entry("https://www.ville.alma.qc.ca/seances-du-conseil-municipal/"),
        "Sainte-Julie": council_entry("https://www.ville.sainte-julie.qc.ca/administration/seances-publiques"),
        "La Prairie": council_entry("https://www.ville.laprairie.qc.ca/ville/democratie/seances-du-conseil/"),
        "Sainte-Therese": council_entry("https://www.sainte-therese.ca/ville/democratie/seances-du-conseil"),
        "Candiac": council_entry("https://candiac.ca/la-ville/vie-democratique/seances-publiques"),
        "Magog": council_entry("https://www.ville.magog.qc.ca/evenement/seance-publique-du-conseil-municipal/"),
        "Riviere-du-Loup": council_entry("https://villerdl.ca/fr/ville/vie-democratique/seances-du-conseil-36"),
        "Saint-Georges": council_entry("https://www.saint-georges.ca/ville/vie-democratique/calendrier-des-seances-du-conseil-municipal"),
        "Thetford Mines": council_entry("https://www.villethetford.ca/vie-municipale/seances-publiques/"),
        "Joliette": council_entry("https://www.joliette.ca/la-ville/democratie/seances-ordres-du-jour-et-proces-verbaux"),
        "Sept-Iles": council_entry("https://www.septiles.ca/fr/seances-publiques_97/"),
        "Baie-Comeau": council_entry("https://www.ville.baie-comeau.qc.ca/ville/vie-democratique/seances-du-conseil-municipal/"),
        "Val-d'Or": council_entry("https://www.ville.valdor.qc.ca/la-ville/democratie/seances-et-proces-verbaux"),
        "Amos": council_entry("https://amos.quebec/decouvrir-amos/vie-democratique/calendrier-des-seances"),
        "Sorel-Tracy": council_entry("https://ville.sorel-tracy.qc.ca/ville/vos-elus/seances-du-conseil"),
        "Gaspe": council_entry("https://ville.gaspe.qc.ca/mairie-et-conseil-municipal/seances-du-conseil-municipal"),
        "Matane": council_entry("https://www.ville.matane.qc.ca/ma-ville/vie-democratique/seances-du-conseil/"),
        "Sainte-Marie": council_entry("https://www.sainte-marie.ca/citoyens/calendriers/conseil-municipal/"),
        "Dolbeau-Mistassini": council_entry("https://ville.dolbeau-mistassini.qc.ca/mairie/activites-du-conseil"),
        "Roberval": council_entry("https://www.roberval.ca/y-vivre/information-generale/assemblees-du-conseil-municipal"),
        "Mont-Laurier": council_entry("https://www.villemontlaurier.qc.ca/vie-municipale/seances-conseil"),
        "Lachute": council_entry("https://lachute.ca/seances-du-conseil/"),
        "Cowansville": council_entry("https://www.cowansville.ca/vie-municipale/democratie/seances-du-conseil"),
        "Bromont": council_entry("https://www.bromont.net/administration-municipale/proces-verbaux/"),
        "Montmagny": council_entry("https://www.ville.montmagny.qc.ca/fr/ville/vie-democratique/seances-du-conseil/"),
        "Mont-Tremblant": council_entry("https://vdmt.ca/informations-municipales/democratie-et-participation-citoyenne/seances-des-conseils"),
        "Varennes": council_entry("https://www.ville.varennes.qc.ca/la-ville/vie-democratique/seances-et-proces-verbaux"),
        "Beloeil": council_entry("https://beloeil.ca/interagir/conseil-municipal/seances-du-conseil/"),
        "Saint-Bruno-de-Montarville": council_entry("https://stbruno.ca/ville/conseil-municipal/seances-conseil-municipal/"),
        "Saint-Lambert": council_entry("https://www.saint-lambert.ca/fr/seances-du-conseil"),
        "Saint-Basile-le-Grand": council_entry("https://www.villesblg.ca/ville/democratie/seances-du-conseil/"),
        "Mont-Saint-Hilaire": council_entry("https://www.villemsh.ca/ville/conseil-municipal/seances-du-conseil/"),
        "Sainte-Adele": council_entry("https://ville.sainte-adele.qc.ca/seances-conseil.php"),
        "L'Assomption": council_entry("https://www.ville.lassomption.qc.ca/seances-conseil/"),
        "Lavaltrie": council_entry("https://www.ville.lavaltrie.qc.ca/conseil-municipal/seances-du-conseil-et-proces-verbaux"),
        "Sainte-Anne-des-Plaines": council_entry("https://www.villesadp.ca/ma-ville/vie-democratique/seances-du-conseil-municipal"),
        "Boisbriand": council_entry("https://www.ville.boisbriand.qc.ca/ville/vie-democratique/seances-du-conseil"),
        "Rosemere": council_entry("https://www.ville.rosemere.qc.ca/seances-conseil/"),
        "Lorraine": council_entry("https://ville.lorraine.qc.ca/regard-sur-notre-ville/mairie-et-vie-democratique"),
        "Deux-Montagnes": council_entry("https://www.ville.deux-montagnes.qc.ca/ville-de-deux-montagnes/vie-democratique/seances-du-conseil-municipal"),
        "Sainte-Marthe-sur-le-Lac": council_entry("https://vsmsll.ca/ville/vie-democratique/seances-du-conseil"),
        "Pointe-Claire": council_entry("https://www.pointe-claire.ca/democratie-et-participation-citoyenne/seances-du-conseil"),
        "Kirkland": council_entry("https://www.ville.kirkland.qc.ca/portrait-municipal/conseil-municipal/seances-du-conseil"),
        "Dorval": council_entry("https://www.ville.dorval.qc.ca/fr/la-cite/page/seances-du-conseil-municipal"),
        "Cote-Saint-Luc": council_entry("https://cotesaintluc.org/en/municipal-affairs/council-meetings/"),
        "Mont-Royal": council_entry("https://www.ville.mont-royal.qc.ca/fr/ma-ville/vie-democratique/seances-du-conseil-et-son-calendrier"),
        "Westmount": council_entry("https://westmount.org/seances-du-conseil-2/"),
        "Beaconsfield": council_entry("https://www.beaconsfield.ca/fr/ma-ville/votre-conseil/seances-du-conseil-et-proces-verbaux"),
    },
    # ===================== NB =====================
    "NB": {
        "Miramichi": {**portal_entry("https://data-gis-sigmiramichi.opendata.arcgis.com/"), **council_entry("https://www.miramichi.org/council-meetings-agendas-minutes")},
        "Dieppe": council_entry("https://www.dieppe.ca/en/hotel-de-ville/ordres-du-jour-et-proces-verbaux.aspx"),
        "Edmundston": council_entry("https://edmundston.ca/en/city-hall/policies-publications/minutes"),
        "Bathurst": council_entry("https://www.bathurst.ca/council-meetings"),
        "Campbellton": council_entry("http://www.campbellton.org/camp2/Council2.asp"),
        "Riverview": council_entry("https://www.townofriverview.ca/town-hall/council-and-committees/council-meetings"),
        "Quispamsis": council_entry("https://www.quispamsis.ca/town-government/mayor-and-council/council-meetings/"),
        "Rothesay": council_entry("https://www.rothesay.ca/town-hall/agendas/"),
        "Oromocto": council_entry("https://www.oromocto.ca/council-meeting-minutes"),
    },
    # ===================== NS =====================
    "NS": {
        "Truro": {**portal_entry("https://interactive-truro-townoftruro.hub.arcgis.com/"), **council_entry("https://truro.ca/government/council-agenda-and-minutes.html")},
        "Bridgewater": council_entry("https://www.bridgewater.ca/town-council/about-town-council/council-agendas-and-minutes"),
        "New Glasgow": council_entry("https://newglasgow.ca/town-council-meeting-minutes/"),
        "Kentville": council_entry("https://kentville.ca/town-hall/council-committees"),
        "Yarmouth": council_entry("https://www.townofyarmouth.ca/agendas-minutes-livestream.html"),
        "Lunenburg": council_entry("https://townoflunenburg.ca/town-government/council-meetings.html"),
        "Wolfville": council_entry("https://wolfville.ca/town-hall/town-council/minutes-agendas-and-records"),
        "Amherst": council_entry("https://pub-amherst.escribemeetings.com/", "eScribe"),
        "Antigonish": council_entry("https://www.townofantigonish.ca/town-hall/council-minutes.html"),
        "Antigonish County": council_entry("https://antigonishcounty.ca/municipal-council-minutes/"),
        "Inverness County": council_entry("https://invernesscounty.ca/government/minutes/"),
        "Pictou County": council_entry("https://munpict.ca/council/minutes/"),
    },
    # ===================== PE =====================
    "PE": {
        "Cornwall": council_entry("https://cornwallpe.ca/town-hall/council-minutes/"),
        "Stratford": council_entry("https://www.townofstratford.ca/government/about_our_government/mayor_council/town_council_minutes"),
        "Three Rivers": council_entry("https://threeriverspei.com/councilminutesagendas2023/"),
    },
    # ===================== NL =====================
    "NL": {
        "Mount Pearl": council_entry("https://www.mountpearl.ca/government/council/council-meetings/live-video/"),
        "Conception Bay South": council_entry("https://www.conceptionbaysouth.ca/council/council-calendar/"),
        "Paradise": council_entry("https://pub-paradise.escribemeetings.com/", "eScribe"),
        "Corner Brook": council_entry("https://www.cornerbrook.com/council/meetings/"),
        "Grand Falls-Windsor": council_entry("https://grandfallswindsor.com/town-hall/council-minutes/"),
        "Gander": council_entry("https://www.gandercanada.com/municipal-government/council-meetings/"),
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

        for city_name, fields in cities.items():
            entity = entity_map.get(city_name)
            if not entity:
                for e in entities:
                    if city_name.lower() == e["name"].lower():
                        entity = e
                        break
            if not entity:
                for e in entities:
                    if city_name.lower() in e["name"].lower() or e["name"].lower() in city_name.lower():
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
                total_fields += changes

        if prov_updates > 0:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")
            print(f"  {prov_code}: {prov_updates} entities, {total_fields} fields")

        total_entities += prov_updates

    print(f"\n  TOTAL: {total_entities} entities updated, {total_fields} fields")


if __name__ == "__main__":
    print("\n=== Tier 2 Verified Fill ===\n")
    apply()
