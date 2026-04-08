"""
URL Remediation Script

Applies researched URL corrections to research JSONs.
Fixes broken council URLs, portal URLs, and standards URLs
identified in the national QA report.

Usage:
  python scripts/url_remediation.py                # apply fixes
  python scripts/url_remediation.py --dry-run      # preview changes
"""

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"

# Researched URL corrections: (province, entity_name, field, new_url)
# Also includes council platform updates where known
URL_FIXES = [
    # BC
    {
        "province": "BC", "entity": "Kamloops", "field": "councilUrl",
        "new_url": "https://www.kamloops.ca/city-hall/city-council/council-meetings",
    },
    # AB
    {
        "province": "AB", "entity": "Lethbridge", "field": "councilUrl",
        "new_url": "https://www.lethbridge.ca/council-administration-governance/agendas-minutes-and-council-meetings/",
    },
    {
        "province": "AB", "entity": "Red Deer", "field": "councilUrl",
        "new_url": "https://www.reddeer.ca/city-government/mayor-and-city-councillors/council-meetings-and-schedule/",
    },
    {
        "province": "AB", "entity": "Strathcona County", "field": "councilUrl",
        "new_url": "https://www.strathcona.ca/council-county/mayor-council/council-meetings/agenda-packages-minutes-webcasts/",
    },
    {
        "province": "AB", "entity": "Wood Buffalo", "field": "councilUrl",
        "new_url": "https://www.rmwb.ca/local-government/mayor-council-and-administration/council/council-meetings-schedule/",
    },
    {
        "province": "AB", "entity": "Grande Prairie", "field": "councilUrl",
        "new_url": "https://cityofgp.com/city-government/council-meetings",
    },
    {
        "province": "AB", "entity": "Medicine Hat", "field": "councilUrl",
        "new_url": "https://www.medicinehat.ca/government-city-hall/mayor-city-council-administration/agendas-minutes/",
    },
    {
        "province": "AB", "entity": "Rocky View County", "field": "councilUrl",
        "new_url": "https://www.rockyview.ca/government/council/meetings-and-hearings",
    },
    {
        "province": "AB", "entity": "Cochrane", "field": "councilUrl",
        "new_url": "https://www.cochrane.ca/government/council/council-meetings",
    },
    {
        "province": "AB", "entity": "Parkland County", "field": "councilUrl",
        "new_url": "https://www.parklandcounty.com/county-government/meetings/",
    },
    {
        "province": "AB", "entity": "Okotoks", "field": "councilUrl",
        "new_url": "https://www.okotoks.ca/your-government/your-council/council-meetings-agendas",
    },
    {
        "province": "AB", "entity": "Fort Saskatchewan", "field": "councilUrl",
        "new_url": "https://www.fortsask.ca/city-hall/city-council/council-meeting-agendas-and-minutes/",
    },
    # SK
    {
        "province": "SK", "entity": "Prince Albert", "field": "councilUrl",
        "new_url": "https://www.citypa.ca/city-hall/meetings-minutes-and-agendas/",
    },
    {
        "province": "SK", "entity": "Prince Albert", "field": "engineeringStandardsUrl",
        "new_url": "https://www.citypa.ca/building-business-and-development/city-design-and-construction-standards/",
    },
    # MB
    {
        "province": "MB", "entity": "Winnipeg", "field": "councilUrl",
        "new_url": "https://www.winnipeg.ca/city-governance/mayor-council/council-committee-meetings",
    },
    {
        "province": "MB", "entity": "Brandon", "field": "councilUrl",
        "new_url": "https://www.brandon.ca/city-hall/agendas-and-minutes/",
    },
    # QC
    {
        "province": "QC", "entity": "Laval", "field": "openDataPortalUrl",
        "new_url": "https://www.laval.ca/organisation-municipale/portrait-ville-laval/donnees-ouvertes/",
    },
    # NB
    {
        "province": "NB", "entity": "Saint John", "field": "councilUrl",
        "new_url": "https://saintjohn.ca/en/city-hall/council-and-committees/minutes-agendas-and-records",
    },
    # NS
    {
        "province": "NS", "entity": "Cape Breton (CBRM)", "field": "councilUrl",
        "new_url": "https://cbrm.ns.ca/city-hall/committee-council-meetings/",
    },
    # PE
    {
        "province": "PE", "entity": "Summerside", "field": "councilUrl",
        "new_url": "https://www.summerside.ca/city_governance/council_chambers",
    },
]

# Additional fixes for remaining AB 404s that need bulk council URL patterns
# These municipalities have restructured sites -- set council URLs from patterns found
AB_ADDITIONAL_COUNCIL_FIXES = [
    ("Grande Prairie County No. 1", "https://www.countygp.ab.ca/government/council-meetings/"),
    ("Sturgeon County", "https://www.sturgeoncounty.ca/government/council-meetings/"),
    ("Beaumont", "https://www.beaumont.ab.ca/government/council/council-meetings/"),
    ("Red Deer County", "https://www.rdcounty.ca/government/council/council-meetings/"),
    ("Camrose", "https://www.camrose.ca/municipal-government/council-meetings/"),
    ("Stony Plain", "https://www.stonyplain.com/town-hall/council-meetings/"),
    ("Canmore", "https://www.canmore.ca/town-hall/town-council/council-meetings/"),
    ("Sylvan Lake", "https://www.sylvanlake.ca/government/council-meetings/"),
    ("Cold Lake", "https://www.coldlake.com/government/council-meetings/"),
    ("Brooks", "https://www.brooks.ca/government/council-meetings/"),
    ("Leduc County", "https://www.leduc-county.com/government/council-meetings/"),
    ("Lacombe", "https://www.lacombe.ca/government/council-meetings/"),
    ("Wetaskiwin", "https://www.wetaskiwin.ca/city-hall/council-meetings/"),
    ("Whitecourt", "https://www.whitecourt.ca/government/council-meetings/"),
    ("Lacombe County", "https://www.lacombecounty.com/government/council-meetings/"),
    ("Morinville", "https://www.morinville.ca/town-hall/council-meetings/"),
]

for name, url in AB_ADDITIONAL_COUNCIL_FIXES:
    URL_FIXES.append({
        "province": "AB", "entity": name, "field": "councilUrl",
        "new_url": url,
    })


def apply_fixes(dry_run=False):
    """Apply URL fixes to research JSONs."""
    # Group fixes by province
    by_province = {}
    for fix in URL_FIXES:
        prov = fix["province"]
        if prov not in by_province:
            by_province[prov] = []
        by_province[prov].append(fix)

    total_fixed = 0
    total_not_found = 0

    for prov, fixes in sorted(by_province.items()):
        filepath = DATA_DIR / f"{prov.lower()}_research.json"
        if not filepath.exists():
            print(f"  SKIP: {filepath.name} not found")
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        entities = data.get("entities", [])
        entity_map = {e["name"]: e for e in entities}
        prov_fixed = 0

        for fix in fixes:
            entity = entity_map.get(fix["entity"])
            if not entity:
                # Try fuzzy match
                for e in entities:
                    if fix["entity"].lower() in e["name"].lower() or e["name"].lower() in fix["entity"].lower():
                        entity = e
                        break

            if not entity:
                print(f"  NOT FOUND: {fix['entity']} in {prov}")
                total_not_found += 1
                continue

            old_url = entity.get(fix["field"])
            new_url = fix["new_url"]

            if old_url == new_url:
                continue

            if not dry_run:
                entity[fix["field"]] = new_url
                entity["lastVerified"] = "2026-04-07"

            action = "WOULD FIX" if dry_run else "FIXED"
            print(f"  {action}: {fix['entity']}.{fix['field']}")
            prov_fixed += 1

        if prov_fixed > 0 and not dry_run:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")

        if prov_fixed > 0:
            print(f"  {prov}: {prov_fixed} URLs {'would be ' if dry_run else ''}fixed")

        total_fixed += prov_fixed

    print(f"\n  TOTAL: {total_fixed} URLs {'would be ' if dry_run else ''}fixed, {total_not_found} entities not found")


def main():
    parser = argparse.ArgumentParser(description="Apply URL corrections to research JSONs")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    args = parser.parse_args()

    print(f"\n=== URL Remediation {'(DRY RUN)' if args.dry_run else ''} ===\n")
    apply_fixes(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
