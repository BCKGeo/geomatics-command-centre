#!/usr/bin/env python3
"""Apply triage decisions to open-data-portal research JSONs.

Reads diff/municipal_url_normalize/_triage_decisions.tsv. For every row
with decision == "REWRITE", updates the matching entity's municipalUrl
in data/open-data-portals/{province.lower()}_research.json. Walks
entities[] and nested related[] arrays. Writes DEFER rows to
_flagged_deferred.tsv for later manual review.

Does NOT modify public/municipalities.json directly — run
scripts/sync_municipalities_js.py after this.
"""
from __future__ import annotations

import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DECISIONS = ROOT / "diff" / "municipal_url_normalize" / "_triage_decisions.tsv"
DEFERRED_OUT = ROOT / "diff" / "municipal_url_normalize" / "_flagged_deferred.tsv"
PORTALS_DIR = ROOT / "data" / "open-data-portals"


def load_decisions() -> list[dict]:
    if not DECISIONS.exists():
        raise SystemExit(f"ERROR: decisions TSV not found: {DECISIONS}")
    with DECISIONS.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        return [row for row in reader]


def update_entity_tree(entities: list, name: str, new_url: str) -> int:
    """Walk entities[] and nested related[] arrays. Update matching
    entity's municipalUrl. Returns count of updates made."""
    count = 0
    for ent in entities:
        if not isinstance(ent, dict):
            continue
        if ent.get("name") == name:
            if ent.get("municipalUrl") != new_url:
                ent["municipalUrl"] = new_url
                count += 1
        related = ent.get("related")
        if isinstance(related, list):
            count += update_entity_tree(related, name, new_url)
    return count


def main() -> int:
    decisions = load_decisions()
    if not decisions:
        print("No decisions to apply.", file=sys.stderr)
        return 1

    # Group rewrites per province.
    rewrites_by_province: dict[str, list[dict]] = defaultdict(list)
    defers: list[dict] = []
    for row in decisions:
        if row["decision"] == "REWRITE" and row["proposed_url"]:
            rewrites_by_province[row["province"]].append(row)
        elif row["decision"] == "DEFER":
            defers.append(row)

    # Apply per province.
    per_province_updates: dict[str, int] = {}
    per_province_missing: dict[str, list[str]] = defaultdict(list)
    for province, rows in rewrites_by_province.items():
        path = PORTALS_DIR / f"{province.lower()}_research.json"
        if not path.exists():
            print(f"WARN: research JSON missing for {province}: {path}",
                  file=sys.stderr)
            continue
        with path.open(encoding="utf-8") as f:
            data = json.load(f)
        entities = data.get("entities")
        if not isinstance(entities, list):
            print(f"WARN: {path.name} has no entities[] array", file=sys.stderr)
            continue
        updates = 0
        for row in rows:
            n = update_entity_tree(entities, row["name"], row["proposed_url"])
            if n == 0:
                per_province_missing[province].append(row["name"])
            else:
                updates += n
        if updates > 0:
            with path.open("w", encoding="utf-8", newline="\n") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")
            per_province_updates[province] = updates
            print(f"{province}: updated {updates} entity municipalUrl field(s) "
                  f"in {path.name}")
        else:
            print(f"{province}: no updates needed in {path.name}")

    # Write deferred rows TSV.
    DEFERRED_OUT.parent.mkdir(parents=True, exist_ok=True)
    with DEFERRED_OUT.open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter="\t", lineterminator="\n")
        w.writerow(["province", "name", "current_url", "reason"])
        for row in defers:
            w.writerow([row["province"], row["name"], row["current_url"],
                        row.get("reason", "")])
    print(f"\nWrote {len(defers)} deferred rows to {DEFERRED_OUT.name}")

    # Summary.
    total_rw = sum(len(v) for v in rewrites_by_province.values())
    total_up = sum(per_province_updates.values())
    print("\n=== SUMMARY ===")
    print(f"Rewrite decisions:   {total_rw}")
    print(f"Entities updated:    {total_up}")
    print(f"Deferred:            {len(defers)}")
    for prov in sorted(rewrites_by_province):
        n_req = len(rewrites_by_province[prov])
        n_up = per_province_updates.get(prov, 0)
        print(f"  {prov}: {n_up}/{n_req} updated")
        missing = per_province_missing.get(prov, [])
        if missing:
            print(f"    MISSING (no matching entity name): {missing}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
