#!/usr/bin/env python3
"""
Strip deep-path municipalUrl values in data/open-data-portals/*_research.json
to their root (scheme + hostname). If the root doesn't resolve (2xx), null
the field.

Preserves wrapper shape of each research JSON. Only touches `municipalUrl`
on entities and entities[].related — never `portalUrl` or `surveyStandards`.

Usage: python scripts/strip_muniurl_paths.py
"""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "open-data-portals"
DIFF_DIR = ROOT / "diff" / "municipal_url_normalize"
DIFF_TSV = DIFF_DIR / "_strip_paths.tsv"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0 Safari/537.36"
)
TIMEOUT = 8.0
DELAY = 0.15

# Retry policy: re-probe once after RETRY_DELAY seconds before declaring DEAD.
# This prevents transient network blips from nulling otherwise-valid URLs on
# a re-run. Set to 0 retries for fastest-but-most-destructive runs.
RETRIES = 1
RETRY_DELAY = 5.0


def is_already_root(url: str) -> bool:
    """True if the URL has no meaningful path/query/fragment."""
    parsed = urllib.parse.urlparse(url)
    path = parsed.path or ""
    return path in ("", "/") and not parsed.query and not parsed.fragment


def root_of(url: str) -> str:
    """Return `scheme://netloc`."""
    parsed = urllib.parse.urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


# Status codes considered "host is reachable for a real user even if the
# probe is being deflected." These survive as alive in the eyes of the strip
# script. 401/403 are typical bot-blocks on municipal sites (Cloudflare bot
# fight mode, AWS WAF, UA-based blocking) where a real browser still works.
# Note: 404 is NOT in this set — a literal 404 on the root means the site
# really has no front door at that URL.
ALIVE_STATUS_CODES = {200, 201, 202, 203, 204, 205, 206, 401, 403}


def _probe_once(url: str) -> bool:
    """One probe attempt: HEAD then GET. True if the host responds with a
    status that suggests a real user could reach it (see ALIVE_STATUS_CODES).
    """
    headers = {"User-Agent": USER_AGENT, "Accept": "*/*"}
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(url, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                if resp.status in ALIVE_STATUS_CODES:
                    return True
                # Non-alive final response — try GET if HEAD gave us an ugly code
                if method == "HEAD":
                    continue
                return False
        except urllib.error.HTTPError as e:
            # 401/403 are bot-blocks; treat as alive.
            if e.code in ALIVE_STATUS_CODES:
                return True
            # Some servers reject HEAD with 4xx; try GET before giving up.
            if method == "HEAD" and e.code in (400, 405, 501):
                continue
            return False
        except (urllib.error.URLError, TimeoutError, ConnectionError, OSError):
            if method == "HEAD":
                continue
            return False
        except Exception:
            if method == "HEAD":
                continue
            return False
    return False


def probe(url: str, retries: int = RETRIES, retry_delay: float = RETRY_DELAY) -> bool:
    """Probe with retry. Returns True only if any attempt succeeds (2xx).
    Returns False only if all attempts fail.

    The retry guards against transient network failures (timeout, connection
    reset, intermittent 5xx, DNS hiccups) wrongly nulling live URLs. Most
    failures are real (NXDOMAIN, 4xx) and will fail both attempts quickly,
    so the cost on already-dead URLs is just `retry_delay` extra seconds.
    """
    for attempt in range(retries + 1):
        if _probe_once(url):
            return True
        if attempt < retries:
            time.sleep(retry_delay)
    return False


def iter_entities(data):
    """Yield (parent_entity, entry_dict) for the top-level and its related[]."""
    for ent in data.get("entities", []):
        yield None, ent
        for rel in ent.get("related", []) or []:
            yield ent, rel


def main() -> int:
    DIFF_DIR.mkdir(parents=True, exist_ok=True)
    rows: list[tuple[str, str, str, str, str, str]] = []

    # Pass 1: collect unique roots that need probing + all transformations to make.
    entity_plan = []  # list of dicts: {prov, name, entry_ref, before, root, needs_probe}
    unique_roots: set[str] = set()
    province_jsons: dict[str, dict] = {}

    for prov_path in sorted(DATA_DIR.glob("*_research.json")):
        with prov_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        province_jsons[prov_path.name] = data
        prov_code = data.get("province") or prov_path.stem.split("_")[0].upper()

        for parent, entry in iter_entities(data):
            before = entry.get("municipalUrl")
            if not before:
                continue
            if not isinstance(before, str):
                continue
            try:
                r = root_of(before)
            except Exception:
                continue
            if not r.startswith("http"):
                continue
            name = entry.get("name") or "?"
            already = is_already_root(before)
            if not already:
                unique_roots.add(r)
            entity_plan.append({
                "prov": prov_code,
                "name": name,
                "entry": entry,
                "before": before,
                "root": r,
                "already_root": already,
            })

    print(f"Entities with municipalUrl: {len(entity_plan)}")
    print(f"Unique roots to probe (non-root URLs): {len(unique_roots)}")

    # Pass 2: probe each unique root once.
    root_status: dict[str, bool] = {}
    for i, r in enumerate(sorted(unique_roots), start=1):
        alive = probe(r)
        root_status[r] = alive
        if i % 25 == 0 or i == len(unique_roots):
            print(f"  probed {i}/{len(unique_roots)}")
        time.sleep(DELAY)

    live_count = sum(1 for v in root_status.values() if v)
    dead_count = len(root_status) - live_count
    print(f"Live roots: {live_count}, Dead roots: {dead_count}")

    # Pass 3: apply decisions.
    stripped = 0
    nulled = 0
    unchanged = 0
    for plan in entity_plan:
        before = plan["before"]
        r = plan["root"]
        entry = plan["entry"]
        if plan["already_root"]:
            # Already root. Leave as-is. Don't null even if we later learn it's dead —
            # other tasks own aliveness checks. (We only probe non-roots.)
            status = "UNCHANGED_ALREADY_ROOT"
            after = before
            unchanged += 1
        else:
            alive = root_status.get(r, False)
            if alive:
                entry["municipalUrl"] = r
                status = "OK"
                after = r
                stripped += 1
            else:
                entry["municipalUrl"] = None
                status = "DEAD"
                after = "null"
                nulled += 1
        rows.append((plan["prov"], plan["name"], before, r, status, after))

    # Write diff TSV.
    with DIFF_TSV.open("w", encoding="utf-8", newline="") as f:
        f.write("province\tname\tbefore\troot\tstatus\tafter\n")
        for row in rows:
            f.write("\t".join(row) + "\n")

    # Write updated JSONs.
    for path_name, data in province_jsons.items():
        out_path = DATA_DIR / path_name
        with out_path.open("w", encoding="utf-8", newline="\n") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")

    print("---")
    print(f"Total entities with municipalUrl inspected: {len(entity_plan)}")
    print(f"  Stripped to root (live):   {stripped}")
    print(f"  Nulled (dead root):        {nulled}")
    print(f"  Unchanged (already root):  {unchanged}")
    print(f"Diff TSV: {DIFF_TSV}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
