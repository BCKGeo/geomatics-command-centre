#!/usr/bin/env python3
"""
Re-probe entities whose `municipalUrl` was nulled by a prior run of
`scripts/strip_muniurl_paths.py`. Restore the root URL when the host is
reachable today.

Why: the original strip script lacked retry semantics, so a transient
network failure during its single run could null an otherwise-valid host.
This script reverses those false negatives by replaying the strip-and-probe
operation against the pre-strip URL recovered from git, with the new
retry-aware probe in `strip_muniurl_paths.probe`.

Default behaviour replays exactly the 18 entities nulled in commit 3efc90b
(strip pass 1). Pass --since-ref <ref> to point at a different baseline.

Usage: python scripts/restore_nulled_muniurls.py
       python scripts/restore_nulled_muniurls.py --since-ref 3efc90b^
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

# Re-use the (now retry-aware) probe + helpers.
from strip_muniurl_paths import (
    DATA_DIR,
    DELAY,
    DIFF_DIR,
    probe,
    root_of,
    iter_entities,
)

ROOT = DATA_DIR.parent.parent
RESTORE_TSV = DIFF_DIR / "_restore_nulled.tsv"

# Default baseline = parent of the strip commit.
DEFAULT_SINCE_REF = "3efc90b^"


def git_show_at(ref: str, path_from_repo_root: Path) -> str:
    """Return file contents at <ref>, or empty string if missing at that ref."""
    rel = path_from_repo_root.relative_to(ROOT).as_posix()
    proc = subprocess.run(
        ["git", "show", f"{ref}:{rel}"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        return ""
    return proc.stdout


def index_by_name(data: dict) -> dict[str, str | None]:
    """Map entity name -> municipalUrl from a research-JSON-shaped dict.
    Walks both top-level and `related[]`. Names within a province are
    expected to be unique; if duplicates appear, the last one wins
    (acceptable for this use — we only need a hint of the prior URL)."""
    by_name: dict[str, str | None] = {}
    for _parent, entry in iter_entities(data):
        name = entry.get("name")
        if name:
            by_name[name] = entry.get("municipalUrl")
    return by_name


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--since-ref",
        default=DEFAULT_SINCE_REF,
        help=f"Git ref to compare against (default: {DEFAULT_SINCE_REF})",
    )
    args = ap.parse_args()

    DIFF_DIR.mkdir(parents=True, exist_ok=True)

    # Walk every research JSON.
    plan = []  # list of dicts: {prov, name, before_url, root, entry_ref, prov_path}
    province_jsons: dict[str, dict] = {}

    for prov_path in sorted(DATA_DIR.glob("*_research.json")):
        with prov_path.open("r", encoding="utf-8") as f:
            current = json.load(f)
        province_jsons[prov_path.name] = current
        prov_code = current.get("province") or prov_path.stem.split("_")[0].upper()

        # Look up the file at the baseline ref.
        old_text = git_show_at(args.since_ref, prov_path)
        if not old_text:
            print(f"WARN: {prov_path.name} not in {args.since_ref}; skipping")
            continue
        try:
            old = json.loads(old_text)
        except json.JSONDecodeError as e:
            print(f"WARN: {prov_path.name} at {args.since_ref} not parseable: {e}")
            continue
        old_by_name = index_by_name(old)

        # For every entity currently null, look up the pre-strip URL.
        for _parent, entry in iter_entities(current):
            if entry.get("municipalUrl") is not None:
                continue
            name = entry.get("name")
            if not name:
                continue
            before = old_by_name.get(name)
            if not before or not isinstance(before, str):
                continue
            try:
                r = root_of(before)
            except Exception:
                continue
            if not r.startswith("http"):
                continue
            plan.append({
                "prov": prov_code,
                "name": name,
                "before_url": before,
                "root": r,
                "entry": entry,
                "prov_path_name": prov_path.name,
            })

    print(f"Nulled entities with a recoverable pre-strip URL: {len(plan)}")
    if not plan:
        print("Nothing to do.")
        return 0

    # Probe unique roots once. Use the retry-aware probe.
    unique_roots = sorted({p["root"] for p in plan})
    print(f"Unique roots to re-probe: {len(unique_roots)}")
    root_status: dict[str, bool] = {}
    for i, r in enumerate(unique_roots, start=1):
        root_status[r] = probe(r)
        print(f"  [{i}/{len(unique_roots)}] {'ALIVE' if root_status[r] else 'DEAD '}  {r}")
        if i < len(unique_roots):
            time.sleep(DELAY)

    # Apply restorations.
    restored = 0
    still_dead = 0
    rows: list[tuple[str, str, str, str, str]] = []
    for p in plan:
        alive = root_status[p["root"]]
        if alive:
            p["entry"]["municipalUrl"] = p["root"]
            restored += 1
            status = "RESTORED"
        else:
            still_dead += 1
            status = "STILL_DEAD"
        rows.append((p["prov"], p["name"], p["before_url"], p["root"], status))

    # Write restoration log.
    with RESTORE_TSV.open("w", encoding="utf-8", newline="") as f:
        f.write("province\tname\tbefore_url\troot\tstatus\n")
        for row in rows:
            f.write("\t".join(row) + "\n")

    # Write any province JSONs that changed.
    if restored > 0:
        for path_name, data in province_jsons.items():
            out_path = DATA_DIR / path_name
            with out_path.open("w", encoding="utf-8", newline="\n") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write("\n")

    print("---")
    print(f"Restored: {restored}")
    print(f"Still dead: {still_dead}")
    print(f"Log: {RESTORE_TSV}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
