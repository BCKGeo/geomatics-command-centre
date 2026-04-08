"""
StatCan 2021 Census Population Reconciliation

Compares municipality populations in research JSONs against the
official Statistics Canada 2021 Census (Table 98-10-0002) and
reports/fixes discrepancies.

Usage:
  python scripts/statcan_reconcile.py                  # report only
  python scripts/statcan_reconcile.py --fix            # fix discrepancies > 1%
  python scripts/statcan_reconcile.py --threshold 5    # custom threshold %
"""

import argparse
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
STATCAN_FILE = ROOT / "data" / "statcan" / "98100002.csv"

# Province codes in StatCan CSDUIDs
PROV_CODES = {
    "10": "NL", "11": "PE", "12": "NS", "13": "NB",
    "24": "QC", "35": "ON", "46": "MB", "47": "SK",
    "48": "AB", "59": "BC", "60": "YT", "61": "NT", "62": "NU",
}


def normalize(name):
    """Normalize name for fuzzy matching."""
    n = name.lower().strip()
    n = n.replace(" city", "").replace(" (city)", "")
    n = n.replace(" (agglomeration)", "").replace(" (agglo)", "")
    n = re.sub(r"^(ville de |town of |municipality of )", "", n)
    # Accent normalization
    for old, new in {"é": "e", "è": "e", "ê": "e", "à": "a", "â": "a",
                     "î": "i", "ï": "i", "ô": "o", "ù": "u", "û": "u",
                     "ç": "c", "\u00e9": "e", "\u00e8": "e", "\u00ea": "e",
                     "\u00e0": "a", "\u00e2": "a", "\u00ee": "i", "\u00ef": "i",
                     "\u00f4": "o", "\u00f9": "u", "\u00fb": "u", "\u00e7": "c"}.items():
        n = n.replace(old, new)
    n = re.sub(r"[^a-z0-9 -]", "", n).strip()
    return n


def load_statcan_populations():
    """Load all CSD populations from StatCan table."""
    pops = {}  # {prov_code: {normalized_name: (name, population)}}
    with open(STATCAN_FILE, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            dguid = row.get("DGUID", "")
            if not dguid.startswith("2021A0005") or len(dguid) != 16:
                continue
            csd_uid = dguid[9:]
            prov_code = csd_uid[:2]
            prov = PROV_CODES.get(prov_code)
            if not prov:
                continue
            name = row["GEO"]
            pop_str = row.get("Population and dwelling counts (13): Population, 2021 [1]", "0")
            pop = int(pop_str) if pop_str and pop_str != ".." else 0
            if prov not in pops:
                pops[prov] = {}
            pops[prov][normalize(name)] = (name, pop)
    return pops


def reconcile(fix=False, threshold=1.0):
    """Compare research JSON populations against StatCan Census."""
    print(f"\n=== StatCan 2021 Census Population Reconciliation ===")
    print(f"  Threshold: {threshold}%\n")

    statcan = load_statcan_populations()
    print(f"  StatCan CSDs loaded: {sum(len(v) for v in statcan.values())} across {len(statcan)} provinces\n")

    total_checked = 0
    total_mismatches = 0
    total_fixed = 0
    critical = []

    for prov_file in sorted(DATA_DIR.glob("*_research.json")):
        prov_code = prov_file.stem.split("_")[0].upper()
        with open(prov_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        entities = data.get("entities", [])
        sc_prov = statcan.get(prov_code, {})
        prov_mismatches = 0

        for entity in entities:
            name = entity.get("name", "")
            our_pop = entity.get("population", 0)
            if not our_pop:
                continue

            total_checked += 1
            norm = normalize(name)
            match = sc_prov.get(norm)

            if not match:
                continue

            sc_name, sc_pop = match
            if sc_pop == 0:
                continue

            pct_diff = abs(our_pop - sc_pop) / sc_pop * 100

            if pct_diff > threshold:
                direction = "+" if our_pop > sc_pop else ""
                diff = our_pop - sc_pop
                severity = "CRITICAL" if pct_diff > 5 else "WARNING"

                if pct_diff > 5:
                    critical.append((prov_code, name, our_pop, sc_pop, pct_diff))

                if prov_mismatches == 0:
                    print(f"  {prov_code}:")
                prov_mismatches += 1
                total_mismatches += 1
                print(f"    {severity}: {name}: ours={our_pop:,} vs StatCan={sc_pop:,} ({direction}{diff:,}, {pct_diff:.1f}%)")

                if fix:
                    entity["population"] = sc_pop
                    # Update description if it contains old population
                    desc = entity.get("description", "")
                    if str(our_pop) in desc.replace(",", ""):
                        entity["description"] = desc.replace(f"{our_pop:,}", f"{sc_pop:,}")
                    total_fixed += 1

        if fix and prov_mismatches > 0:
            with open(prov_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")

    print(f"\n  Summary:")
    print(f"    Entities checked: {total_checked}")
    print(f"    Mismatches (>{threshold}%): {total_mismatches}")
    print(f"    Critical (>5%): {len(critical)}")
    if fix:
        print(f"    Fixed: {total_fixed}")

    if critical:
        print(f"\n  Critical mismatches (>5%):")
        for prov, name, ours, theirs, pct in critical:
            print(f"    {prov}/{name}: {ours:,} vs {theirs:,} ({pct:.1f}%)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--fix", action="store_true", help="Fix discrepancies above threshold")
    parser.add_argument("--threshold", type=float, default=1.0, help="Percentage threshold (default 1%%)")
    args = parser.parse_args()
    reconcile(fix=args.fix, threshold=args.threshold)


if __name__ == "__main__":
    main()
