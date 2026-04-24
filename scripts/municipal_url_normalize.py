#!/usr/bin/env python3
"""
Audit municipalUrl values in data/open-data-portals/*_research.json.
Classify each into ROOT / COUNCIL_PLATFORM / DEPARTMENT_SUBDOMAIN / UNKNOWN,
propose a rewrite where confident, flag the rest for manual review.

Dry-run by default. Use --apply to write changes back to the research JSONs.

Usage:
    python scripts/municipal_url_normalize.py               # dry run, all provinces
    python scripts/municipal_url_normalize.py --province BC # dry run, one province
    python scripts/municipal_url_normalize.py --apply       # apply proposed rewrites
"""
from __future__ import annotations

import argparse
import json
import os
from enum import Enum
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
DIFF_DIR = ROOT / "diff" / "municipal_url_normalize"
FLAGGED_TSV = ROOT / "diff" / "municipal_url_normalize" / "_flagged.tsv"

PROVINCES = ["ab","bc","mb","nb","nl","ns","nt","nu","on","pe","qc","sk","yt"]

# Known council-platform hosts. Match as substrings of the hostname.
COUNCIL_PLATFORM_HOSTS = (
    "escribemeetings.com",
    "civicweb.net",
    "icompasscanada.com",
    "agendapub",
    "agendas.",
)

# Subdomain prefixes that indicate a council-specific subdomain on the real
# municipal domain (still COUNCIL_PLATFORM — not the front door).
COUNCIL_SUBDOMAIN_PREFIXES = ("council.", "agenda.", "meetings.", "pub-")

# Subdomains that indicate a department (right city, wrong front door).
DEPARTMENT_SUBDOMAIN_PREFIXES = (
    "opendata.", "data.", "maps.", "gis.",
    "parks.", "planning.", "works.", "transit.",
)


class Bucket(str, Enum):
    ROOT = "ROOT"
    COUNCIL_PLATFORM = "COUNCIL_PLATFORM"
    DEPARTMENT_SUBDOMAIN = "DEPARTMENT_SUBDOMAIN"
    UNKNOWN = "UNKNOWN"


def classify(url: Optional[str]) -> Bucket:
    if not url:
        return Bucket.UNKNOWN
    try:
        host = urlparse(url).hostname or ""
    except Exception:
        return Bucket.UNKNOWN
    if not host:
        return Bucket.UNKNOWN
    host_lower = host.lower()
    # Council platforms (third-party)
    if any(p in host_lower for p in COUNCIL_PLATFORM_HOSTS):
        return Bucket.COUNCIL_PLATFORM
    # Council subdomain of municipal domain
    if any(host_lower.startswith(p) for p in COUNCIL_SUBDOMAIN_PREFIXES):
        return Bucket.COUNCIL_PLATFORM
    # Department subdomain
    if any(host_lower.startswith(p) for p in DEPARTMENT_SUBDOMAIN_PREFIXES):
        return Bucket.DEPARTMENT_SUBDOMAIN
    # Everything else: ROOT. www.city.ca / city.ca / crd.bc.ca etc.
    return Bucket.ROOT


def infer_root_from_department(url: str) -> Optional[str]:
    """opendata.vancouver.ca -> https://www.vancouver.ca"""
    host = urlparse(url).hostname or ""
    parts = host.split(".")
    if len(parts) >= 3:
        # Drop first subdomain label, prefix with www.
        base = ".".join(parts[1:])
        return f"https://www.{base}"
    return None


def process_entry(entry: dict, results: list, province: str) -> Optional[str]:
    """Returns the proposed municipalUrl (or existing value if unchanged)."""
    current = entry.get("municipalUrl")
    bucket = classify(current)
    proposed = current
    if bucket == Bucket.DEPARTMENT_SUBDOMAIN:
        proposed = infer_root_from_department(current)
    # COUNCIL_PLATFORM is not auto-rewritten: too many platform-specific
    # domain conventions to safely infer the municipal front door.
    results.append({
        "province": province,
        "name": entry.get("name"),
        "bucket": bucket.value,
        "before": current,
        "after": proposed,
        "flagged": bucket in (Bucket.COUNCIL_PLATFORM, Bucket.UNKNOWN) and bool(current),
    })
    return proposed


def load_province(prov: str) -> list:
    with open(DATA_DIR / f"{prov}_research.json", encoding="utf-8") as f:
        data = json.load(f)
    # Real data shape is {province, provinceName, lastUpdated, entities: [...], standards: ...}
    # Return the entities list so walk() can iterate dict entries.
    if isinstance(data, dict) and "entities" in data:
        return data["entities"]
    return data  # fallback: already a list


def save_province(prov: str, records: list) -> None:
    path = DATA_DIR / f"{prov}_research.json"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    # Re-pack into the original wrapper if present.
    if isinstance(data, dict) and "entities" in data:
        data["entities"] = records
        payload = data
    else:
        payload = records
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def walk(records: list, results: list, apply: bool, province: str) -> int:
    """Walk records (including related[]). Returns number of rewrites proposed."""
    changes = 0
    for entry in records:
        proposed = process_entry(entry, results, province)
        if proposed and proposed != entry.get("municipalUrl"):
            changes += 1
            if apply:
                entry["municipalUrl"] = proposed
        for rel in entry.get("related", []) or []:
            proposed_rel = process_entry(rel, results, province)
            if proposed_rel and proposed_rel != rel.get("municipalUrl"):
                changes += 1
                if apply:
                    rel["municipalUrl"] = proposed_rel
    return changes


def write_diff(prov: str, results: list) -> None:
    DIFF_DIR.mkdir(parents=True, exist_ok=True)
    out = DIFF_DIR / f"{prov}.diff"
    with open(out, "w", encoding="utf-8") as f:
        for r in results:
            if r["before"] != r["after"]:
                f.write(f"- {r['province']} / {r['name']} [{r['bucket']}]\n")
                f.write(f"    {r['before']}\n  ->\n    {r['after']}\n\n")


def write_flagged(all_results: list) -> int:
    DIFF_DIR.mkdir(parents=True, exist_ok=True)
    flagged = [r for r in all_results if r["flagged"]]
    with open(FLAGGED_TSV, "w", encoding="utf-8") as f:
        f.write("province\tname\tbucket\tcurrent_url\n")
        for r in flagged:
            f.write(f"{r['province']}\t{r['name']}\t{r['bucket']}\t{r['before']}\n")
    return len(flagged)


def summary(all_results: list) -> None:
    by_bucket = {}
    for r in all_results:
        by_bucket[r["bucket"]] = by_bucket.get(r["bucket"], 0) + 1
    total = len(all_results)
    print(f"\nTotal entries with municipalUrl audited: {total}")
    for b, c in sorted(by_bucket.items()):
        pct = (c / total * 100) if total else 0
        print(f"  {b:22s} {c:5d}  ({pct:5.1f}%)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--province", help="Limit to one province (lowercase code)")
    ap.add_argument("--apply", action="store_true", help="Write changes to research JSONs")
    args = ap.parse_args()

    provinces = [args.province] if args.province else PROVINCES
    all_results = []
    total_changes = 0
    for prov in provinces:
        records = load_province(prov)
        prov_results = []
        changes = walk(records, prov_results, args.apply, prov.upper())
        write_diff(prov, prov_results)
        all_results.extend(prov_results)
        total_changes += changes
        if args.apply:
            save_province(prov, records)
        print(f"{prov.upper()}: {len(prov_results):5d} entries, {changes:4d} proposed rewrites")
    n_flagged = write_flagged(all_results)
    summary(all_results)
    print(f"\nDiffs written to: {DIFF_DIR.relative_to(ROOT)}/")
    print(f"Flagged for manual review: {n_flagged} -> {FLAGGED_TSV.relative_to(ROOT)}")
    if not args.apply:
        print("\n(Dry run. Re-run with --apply to write changes.)")


if __name__ == "__main__":
    main()
