# Municipal Map Link Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relabel the MunicipalMap table/popup links for a geomatics audience (Data → GIS, Council → Municipal), rename the underlying `councilUrl` field to `municipalUrl` everywhere, and normalize existing values toward municipal front-door URLs.

**Architecture:** Three sequential phases: (1) fix the pre-existing `check-links.js` bug so we can verify later work; (2) perform a single atomic field-rename commit across all consumers (UI, data, pipeline scripts); (3) normalize URL values with a dry-run-by-default script plus manual triage. No backwards-compat alias — clean rename.

**Tech Stack:** React 19 + Vite 7 (UI), Python 3 (research pipeline), Node 22 (link checker), Vitest (existing JS tests; not extended), JSON at rest. Maplibre GL JS for the map.

**Spec:** [docs/superpowers/specs/2026-04-23-municipal-map-link-overhaul-design.md](../specs/2026-04-23-municipal-map-link-overhaul-design.md)

---

## File Structure

**Modified (existing files):**
- `src/data/entityCategories.js` — `getCoverageScore` field reference
- `src/components/ui/MunicipalMap.jsx` — `buildFeature` property assignment
- `src/components/ui/MunicipalTable.jsx` — link cell: ternary guard + render + labels + tooltips
- `src/components/ui/MunicipalMapPopup.jsx` — pills: main entry + related-entities labels
- `public/municipalities.json` — field rename in every record
- `data/open-data-portals/{ab,bc,mb,nb,nl,ns,nt,nu,on,pe,qc,sk,yt}_research.json` (×13) — field rename
- `scripts/check-links.js` — fix pre-existing bug + field rename + preserve `--province`
- `scripts/research_pipeline.py`, `scripts/assemble_research.py`, `scripts/sync_municipalities_js.py`, `scripts/tier1_portals_fill.py`, `scripts/tier2_fill.py`, `scripts/tier3_fill.py`, `scripts/url_remediation.py`, `scripts/provincial_bulk_fill.py`, `scripts/qc_stub_fill.py`, `scripts/expand_quebec.py`, `scripts/stub_triage.py`, `scripts/build_excel.py`, `scripts/build_province_excel.py` (×13) — field rename in reads/writes/docstrings

**Created:**
- `scripts/municipal_url_normalize.py` — two-pass normalize script (classify, propose, apply)

**Explicitly unchanged:** `data/open-data-portals/baseline/**` (historical snapshots, per spec §2); scripts `clean_phantom_portals.py`, `statcan_reconcile.py`, `tier1_standards_fill.py`, `validate_portals.py` (contain no `councilUrl` references, verified by grep).

---

## Phase 1 — Fix pre-existing check-links.js bug

`check-links.js` reads from `src/data/municipalities.js`, which no longer exists (the data moved to `public/municipalities.json` in commit `29e956b`). Fix first so we have a working verification tool for later phases.

### Task 1: Rewrite check-links.js for current data layout

**Files:**
- Modify: `scripts/check-links.js` (full rewrite of `extractUrls` + `main`; keep `tryFetch`, `checkUrl`, `runBatch`, `shuffle`, `BROWSER_HEADERS` as-is)

- [ ] **Step 1: Replace the input-reading and extraction logic**

Replace the existing `extractUrls` function and the top of `main()`. New behavior:

```javascript
function extractUrls(records, provinceFilter) {
  const urls = new Set();
  for (const m of records) {
    if (provinceFilter && m.province !== provinceFilter) continue;
    if (m.portalUrl) urls.add(m.portalUrl);
    if (m.councilUrl) urls.add(m.councilUrl);       // renamed in Phase 2
    if (m.surveyStandards) urls.add(m.surveyStandards);
    if (Array.isArray(m.related)) {
      for (const r of m.related) {
        if (r.portalUrl) urls.add(r.portalUrl);
        if (r.councilUrl) urls.add(r.councilUrl);   // renamed in Phase 2
        if (r.surveyStandards) urls.add(r.surveyStandards);
      }
    }
  }
  return [...urls];
}
```

And in `main()`, replace the first two lines of the function body with:

```javascript
const raw = readFileSync(join(ROOT, "public/municipalities.json"), "utf-8");
const records = JSON.parse(raw);
let urls = extractUrls(records, provinceFilter);
```

Also update the file header comment block (lines 2-11) so the docstring matches the new source path.

- [ ] **Step 2: Run it — all provinces, small timeout, verify it works**

```bash
cd "C:/Users/BCKGeoPC/Documents/_bckgeoai-infrastructure/bckgeoai-dashboard-v3"
node scripts/check-links.js --sample 20 --timeout 6
```

Expected: prints "Found N unique URLs" with N > 0, then checks 20 random URLs, prints OK/broken summary, exits 0 or 1. If it prints 0 URLs found, the JSON parse succeeded but the walker is wrong — investigate.

- [ ] **Step 3: Run it with a province filter — verify `--province` flag still works**

```bash
node scripts/check-links.js --province BC --sample 10 --timeout 6
```

Expected: "Found N unique URLs for BC" where N is notably smaller than the all-province count. Non-zero.

- [ ] **Step 4: Commit**

```bash
git add scripts/check-links.js
git commit -m "fix: point check-links.js at public/municipalities.json

The script previously read from src/data/municipalities.js, which
was removed in commit 29e956b (perf: split data from code). Rewrite
to parse the runtime JSON and walk records (including related[]),
preserving the --province filter."
```

---

## Phase 2 — Atomic field rename (councilUrl → municipalUrl)

One conceptual change, one commit. The field is renamed in lockstep across UI, runtime data, research JSONs, pipeline scripts, and the link checker. Also updates the per-link labels and tooltips per spec §1. No backwards-compat alias.

### Task 2: Rename in the React UI layer

**Files:**
- Modify: `src/data/entityCategories.js:55`
- Modify: `src/components/ui/MunicipalMap.jsx:42`
- Modify: `src/components/ui/MunicipalTable.jsx:167,169`
- Modify: `src/components/ui/MunicipalMapPopup.jsx:25,58`

- [ ] **Step 1: `entityCategories.js` — rename field in coverage score**

In `src/data/entityCategories.js`, change line 55:

```javascript
// BEFORE
return [entry.portalUrl, entry.councilUrl, entry.surveyStandards].filter(Boolean).length;
// AFTER
return [entry.portalUrl, entry.municipalUrl, entry.surveyStandards].filter(Boolean).length;
```

- [ ] **Step 2: `MunicipalMap.jsx` — rename in buildFeature**

In `src/components/ui/MunicipalMap.jsx`, change line 42:

```javascript
// BEFORE
councilUrl: m.councilUrl || "",
// AFTER
municipalUrl: m.municipalUrl || "",
```

- [ ] **Step 3: `MunicipalTable.jsx` — rename ternary guard + render, update label + tooltip**

In `src/components/ui/MunicipalTable.jsx`, replace the links cell block (current lines 166-172):

```jsx
<td style={{ ...cellStyle, textAlign: "center", fontSize: 10 }}>
  {r.portalUrl || r.municipalUrl || r.surveyStandards ? (<>
    {r.portalUrl && <a href={r.portalUrl} target="_blank" rel="noopener noreferrer" title="Open Data / GIS Portal" style={{ color: B.pri, textDecoration: "none", marginRight: 4 }}>GIS</a>}
    {r.municipalUrl && <a href={r.municipalUrl} target="_blank" rel="noopener noreferrer" title="Municipal Website" style={{ color: B.pri, textDecoration: "none", marginRight: 4 }}>Municipal</a>}
    {r.surveyStandards && <a href={r.surveyStandards} target="_blank" rel="noopener noreferrer" title="Survey Standards" style={{ color: "#4caf50", textDecoration: "none" }}>Stds</a>}
  </>) : <span style={{ color: "#555" }}>--</span>}
</td>
```

Three changes from the original: (a) ternary guard uses `municipalUrl`; (b) second anchor uses `municipalUrl` + label `Municipal` + title `Municipal Website`; (c) first anchor label `Data` → `GIS`, title `Open Data Portal` → `Open Data / GIS Portal`.

- [ ] **Step 4: `MunicipalMapPopup.jsx` — rename both pill blocks + update labels**

In `src/components/ui/MunicipalMapPopup.jsx`, replace the main pill block (current lines 23-27):

```jsx
<div style={{ marginTop: 4 }}>
  {m.portalUrl && <a href={m.portalUrl} target="_blank" rel="noopener noreferrer" style={pillStyle(m.portalUrl)}>Data Portal &#x2197;</a>}
  {m.municipalUrl && <a href={m.municipalUrl} target="_blank" rel="noopener noreferrer" style={pillStyle(m.municipalUrl)}>Municipal &#x2197;</a>}
  {m.surveyStandards && <a href={m.surveyStandards} target="_blank" rel="noopener noreferrer" style={pillStyle(m.surveyStandards)}>Standards &#x2197;</a>}
</div>
```

And the related-entities pill block (current lines 57-59):

```jsx
{r.portalUrl && <a href={r.portalUrl} target="_blank" rel="noopener noreferrer" style={pillStyle(r.portalUrl)}>Data &#x2197;</a>}
{r.municipalUrl && <a href={r.municipalUrl} target="_blank" rel="noopener noreferrer" style={pillStyle(r.municipalUrl)}>Municipal &#x2197;</a>}
{r.surveyStandards && <a href={r.surveyStandards} target="_blank" rel="noopener noreferrer" style={pillStyle(r.surveyStandards)}>Standards &#x2197;</a>}
```

(Only the middle pill label + field change; first and third are label-preserving in the popup per spec §1.)

- [ ] **Step 5: Quick interim grep — UI files are clean**

```bash
cd "C:/Users/BCKGeoPC/Documents/_bckgeoai-infrastructure/bckgeoai-dashboard-v3"
```

```powershell
# PowerShell substring count across src/
Get-Content -Raw src/data/entityCategories.js, src/components/ui/MunicipalMap.jsx, src/components/ui/MunicipalTable.jsx, src/components/ui/MunicipalMapPopup.jsx | Select-String -Pattern "councilUrl" -AllMatches | ForEach-Object { $_.Matches.Count } | Measure-Object -Sum
```

Expected: Sum = 0. Do **not** commit yet — rename must be atomic across data + scripts too.

### Task 3: Rename in the Python pipeline scripts (×13)

**Files:**
- Modify all 13 scripts listed under File Structure.

- [ ] **Step 1: Rename the literal string `councilUrl` → `municipalUrl` in each script**

This is a mechanical find-replace. Each script uses the field either as a dict key (`entry["councilUrl"]`, `entry.get("councilUrl")`) or in output JSON key assignments. Literal-string rename is safe because the scripts do not import or re-export the field symbolically.

Run the replace one script at a time so any conditional logic around the field is visible in diffs:

For each of the 13 scripts in `scripts/`, open the file and replace every occurrence of `"councilUrl"` with `"municipalUrl"`. If a script references the old name in a comment or docstring, update the comment/docstring to match.

- [ ] **Step 2: Verify — zero hits across scripts/**

```powershell
Get-ChildItem scripts/*.py | Get-Content -Raw | Select-String -Pattern "councilUrl" -AllMatches | ForEach-Object { $_.Matches.Count } | Measure-Object -Sum
```

Expected: Sum = 0.

### Task 4: Rename in the research JSONs (×13) and runtime JSON

**Files:**
- Modify: `data/open-data-portals/{ab,bc,mb,nb,nl,ns,nt,nu,on,pe,qc,sk,yt}_research.json`
- Modify: `public/municipalities.json`

- [ ] **Step 1: Rename the JSON key across all 13 research files**

These files contain the key as `"councilUrl": "<url>"`. Substring replacement `"councilUrl":` → `"municipalUrl":` is safe (URL values never contain `councilUrl:`).

On Windows PowerShell, do one file at a time to keep diffs small in case of any oddity:

```powershell
foreach ($prov in @("ab","bc","mb","nb","nl","ns","nt","nu","on","pe","qc","sk","yt")) {
  $path = "data/open-data-portals/${prov}_research.json"
  (Get-Content -Raw $path) -replace '"councilUrl":', '"municipalUrl":' | Set-Content -NoNewline -Encoding utf8 $path
}
```

- [ ] **Step 2: Rename in `public/municipalities.json`**

```powershell
(Get-Content -Raw public/municipalities.json) -replace '"councilUrl":', '"municipalUrl":' | Set-Content -NoNewline -Encoding utf8 public/municipalities.json
```

- [ ] **Step 3: Verify — zero substring hits across data JSONs and public/**

```powershell
Get-ChildItem -Path data/open-data-portals/*_research.json, public/municipalities.json | ForEach-Object {
  $count = (Select-String -Path $_ -Pattern "councilUrl" -AllMatches).Matches.Count
  "{0,-45} {1}" -f $_.Name, $count
}
```

Expected: all lines show count `0`.

### Task 5: Rename in `scripts/check-links.js`

**Files:**
- Modify: `scripts/check-links.js`

- [ ] **Step 1: Update field reference + header doc-comment**

In the `extractUrls` function written in Task 1, change both `m.councilUrl` references (main entry + `related[]`) to `m.municipalUrl`. Also update the file-header comment block: `portalUrl, councilUrl, and surveyStandards` → `portalUrl, municipalUrl, and surveyStandards`.

### Task 6: Final verification of the atomic rename

- [ ] **Step 1: Substring-count grep across the repo (the gate)**

```powershell
# Windows PowerShell — substring occurrences, respecting exclusion list from spec §7
$excluded = @(
  "node_modules",
  "docs/superpowers/specs",
  "data/open-data-portals/baseline",
  "diff/municipal_url_normalize"
)
Get-ChildItem -Recurse -File | Where-Object {
  $p = $_.FullName.Replace('\','/')
  -not ($excluded | Where-Object { $p -like "*$_*" })
} | Select-String -Pattern "councilUrl" -AllMatches
```

Expected: no output (zero matches). If any hit surfaces, investigate before proceeding.

- [ ] **Step 2: Build cleanly**

```bash
npm run build
```

Expected: exit 0, no warnings or errors about missing fields. `dist/` populated.

- [ ] **Step 3: Link-checker smoke — all-provinces small sample**

```bash
node scripts/check-links.js --sample 30 --timeout 6
```

Expected: runs to completion, prints OK/broken summary. Some broken are acceptable at this stage (cleanup in Phase 3 will improve, but dead council URLs can exist today).

- [ ] **Step 4: Dev-server visual check**

```bash
npm run dev
```

Open the printed local URL, navigate to Jurisdictions, and confirm:
- Table link labels read `GIS` / `Municipal` / `Stds` (not `Data` / `Council` / `Stds`).
- Tooltip on hover: `Open Data / GIS Portal`, `Municipal Website`, `Survey Standards`.
- Click a pin → popup pills read `Data Portal` / `Municipal` / `Standards`.
- Coverage colours still render for known-good entries: Vancouver should stay green (all three fields populated). Stop the dev server.

- [ ] **Step 5: Commit the atomic rename**

```bash
git add src/ scripts/ data/open-data-portals/*_research.json public/municipalities.json
git commit -m "refactor: rename councilUrl -> municipalUrl end-to-end

The field was already inconsistently used (commit ca0e40a stripped
many council URLs to bare domains), so the name was lying. Rename
to match what the field actually targets — the municipal website —
and update the UI labels to reflect the geomatics audience:

- Data  -> GIS       (tooltip: Open Data / GIS Portal)
- Council -> Municipal (tooltip: Municipal Website)
- Stds unchanged

Spec: docs/superpowers/specs/2026-04-23-municipal-map-link-overhaul-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — Data cleanup: normalize municipalUrl values

With the field renamed, existing values are still a mix of municipal front doors and council-platform URLs. A two-pass audit normalizes them toward root municipal domains.

### Task 7: Write the normalize script (dry-run by default)

**Files:**
- Create: `scripts/municipal_url_normalize.py`

The script classifies every `municipalUrl` value and either proposes a rewrite, flags for manual review, or leaves as-is.

- [ ] **Step 1: Write a minimal pytest for the classifier**

**File:** `scripts/test_municipal_url_normalize.py` (new, colocated with the script in the repo's existing convention — no `tests/` tree).

```python
"""Tests for the classify() function in municipal_url_normalize.py."""
import pytest
from municipal_url_normalize import classify, Bucket


@pytest.mark.parametrize("url,expected", [
    # ROOT — clean municipal domains
    ("https://www.surrey.ca", Bucket.ROOT),
    ("https://www.crd.bc.ca", Bucket.ROOT),
    ("https://burnaby.ca", Bucket.ROOT),
    # COUNCIL_PLATFORM — third-party meeting systems
    ("https://pub-burnaby.escribemeetings.com", Bucket.COUNCIL_PLATFORM),
    ("https://edmonton.civicweb.net", Bucket.COUNCIL_PLATFORM),
    ("https://council.vancouver.ca", Bucket.COUNCIL_PLATFORM),
    ("https://agenda.toronto.ca", Bucket.COUNCIL_PLATFORM),
    ("https://somewhere.icompasscanada.com", Bucket.COUNCIL_PLATFORM),
    # DEPARTMENT_SUBDOMAIN — right city, wrong front door
    ("https://opendata.vancouver.ca", Bucket.DEPARTMENT_SUBDOMAIN),
    ("https://parks.edmonton.ca", Bucket.DEPARTMENT_SUBDOMAIN),
    # Empty / None
    ("", Bucket.UNKNOWN),
    (None, Bucket.UNKNOWN),
])
def test_classify(url, expected):
    assert classify(url) == expected
```

- [ ] **Step 2: Run it, verify it fails (script doesn't exist yet)**

```bash
cd scripts
python -m pytest test_municipal_url_normalize.py -v
```

Expected: ModuleNotFoundError for `municipal_url_normalize`.

- [ ] **Step 3: Write the script — minimal implementation to pass tests + useful CLI**

**File:** `scripts/municipal_url_normalize.py`

```python
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


def process_entry(entry: dict, results: list) -> Optional[str]:
    """Returns the proposed municipalUrl (or existing value if unchanged)."""
    current = entry.get("municipalUrl")
    bucket = classify(current)
    proposed = current
    if bucket == Bucket.DEPARTMENT_SUBDOMAIN:
        proposed = infer_root_from_department(current)
    # COUNCIL_PLATFORM is not auto-rewritten: too many platform-specific
    # domain conventions to safely infer the municipal front door.
    results.append({
        "province": entry.get("province"),
        "name": entry.get("name"),
        "bucket": bucket.value,
        "before": current,
        "after": proposed,
        "flagged": bucket in (Bucket.COUNCIL_PLATFORM, Bucket.UNKNOWN) and bool(current),
    })
    return proposed


def load_province(prov: str) -> list:
    with open(DATA_DIR / f"{prov}_research.json", encoding="utf-8") as f:
        return json.load(f)


def save_province(prov: str, records: list) -> None:
    with open(DATA_DIR / f"{prov}_research.json", "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


def walk(records: list, results: list, apply: bool) -> int:
    """Walk records (including related[]). Returns number of rewrites proposed."""
    changes = 0
    for entry in records:
        proposed = process_entry(entry, results)
        if proposed and proposed != entry.get("municipalUrl"):
            changes += 1
            if apply:
                entry["municipalUrl"] = proposed
        for rel in entry.get("related", []) or []:
            proposed_rel = process_entry(rel, results)
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
        changes = walk(records, prov_results, args.apply)
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
```

- [ ] **Step 4: Run the test, verify pass**

```bash
cd scripts
python -m pytest test_municipal_url_normalize.py -v
```

Expected: all parametrized cases pass.

- [ ] **Step 5: Commit the normalize script + its test**

```bash
git add scripts/municipal_url_normalize.py scripts/test_municipal_url_normalize.py
git commit -m "feat: add municipal_url_normalize audit script

Classifies every municipalUrl in data/open-data-portals/*_research.json
as ROOT / COUNCIL_PLATFORM / DEPARTMENT_SUBDOMAIN / UNKNOWN. Proposes
automatic rewrites for DEPARTMENT_SUBDOMAIN (trim subdomain), flags
COUNCIL_PLATFORM and UNKNOWN for manual review. Dry-run by default.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 8: Pass 1 — dry-run and review

- [ ] **Step 1: Dry-run across all provinces**

```bash
python scripts/municipal_url_normalize.py
```

Expected: prints per-province counts, a bucket summary, and writes diffs + flagged TSV. No `*_research.json` files modified.

- [ ] **Step 2: Spot-check 2-3 per-province diffs**

Open `diff/municipal_url_normalize/bc.diff`, `on.diff`, and `qc.diff`. Verify proposed rewrites look sensible (e.g. `opendata.vancouver.ca` → `https://www.vancouver.ca`). If any look wrong, adjust the classifier heuristics in the script and re-run.

- [ ] **Step 3: Apply the dry-run proposals**

Only after spot-check passes.

```bash
python scripts/municipal_url_normalize.py --apply
```

Expected: same counts as dry-run, but research JSONs now updated.

- [ ] **Step 4: Commit Pass 1 rewrites**

```bash
git add data/open-data-portals/*_research.json
git commit -m "chore(data): apply Pass 1 municipal URL normalization

Trimmed department-subdomain values (e.g. opendata.vancouver.ca)
to the municipal root domain. See diff/municipal_url_normalize/*.diff
for per-province details.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Task 9: Pass 2 — manual triage of flagged entries

- [ ] **Step 1: Open the flagged TSV and triage**

Open `diff/municipal_url_normalize/_flagged.tsv` in a spreadsheet tool. Sort by province, then by bucket. For each row, decide one of:

- **Rewrite**: replace with the correct municipal front door (e.g. `pub-burnaby.escribemeetings.com` → `https://www.burnaby.ca`).
- **Null**: the municipality genuinely has no public web presence — set `municipalUrl: null`.
- **Keep**: the flagged URL is actually fine — e.g. a smaller municipality where the "council platform" is their only web presence. Document in a triage-notes column.

Make these edits directly in the `*_research.json` files. Keep the scope bounded — if the flagged list exceeds ~250 rows, triage by tier first (tier 1 and 2 municipalities have the most user impact).

- [ ] **Step 2: Regenerate `public/municipalities.json` from the updated research JSONs**

```bash
python scripts/sync_municipalities_js.py
```

Expected: rewrites `public/municipalities.json` with the triaged values.

- [ ] **Step 3: Commit Pass 2 triage**

```bash
git add data/open-data-portals/*_research.json public/municipalities.json
git commit -m "chore(data): manual triage of flagged municipal URLs

Resolved council-platform and unknown-bucket entries flagged by
the Pass 1 normalize script. See diff/municipal_url_normalize/_flagged.tsv
for the worklist.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4 — Final verification

### Task 10: End-to-end verification

- [ ] **Step 1: Link-checker clean across all provinces (or near-clean)**

```bash
node scripts/check-links.js --timeout 8
```

Expected: summary of OK vs broken. Compare broken-list against pre-cleanup state — should be strictly smaller or similar, with known dead hosts addressed. Nulls in the research JSONs for any entries whose municipal URL is now confirmed dead; commit the nulls and regenerate `public/municipalities.json` if needed.

- [ ] **Step 2: Build clean**

```bash
npm run build
```

Expected: exit 0, no warnings.

- [ ] **Step 3: Dev-server spot-check, 10 random pins**

```bash
npm run dev
```

In the dashboard, click 10 pins spread across provinces and verify:
- Coverage colour (green/amber/grey) is sensible for what the record actually has.
- Each `Municipal` link opens a municipal front-door page, not an escribe/civicweb portal.
- Table labels still read `GIS` / `Municipal` / `Stds`.

Stop the dev server.

- [ ] **Step 4: Substring-count grep — final gate**

```powershell
$excluded = @(
  "node_modules",
  "docs/superpowers/specs",
  "data/open-data-portals/baseline",
  "diff/municipal_url_normalize"
)
Get-ChildItem -Recurse -File | Where-Object {
  $p = $_.FullName.Replace('\','/')
  -not ($excluded | Where-Object { $p -like "*$_*" })
} | Select-String -Pattern "councilUrl" -AllMatches
```

Expected: no output.

- [ ] **Step 5: Push (deploy)**

```bash
git push origin main
```

Cloudflare Pages picks this up and deploys to dashboard.bckgeo.ca automatically.

- [ ] **Step 6: Post-deploy: smoke-check production**

Wait ~2 minutes, visit https://dashboard.bckgeo.ca, navigate to Jurisdictions, confirm labels read `GIS` / `Municipal` / `Stds`, click one pin, confirm popup pills read `Data Portal` / `Municipal` / `Standards`.

---

## Out-of-scope / Follow-up

- Regenerating the 13 per-province Excel deliverables from the cleaned data (run `scripts/build_province_excel.py` if desired).
- Reintroducing a separate `councilRecordsUrl` field if a use case surfaces.
- Expanding URL coverage for municipalities that currently have no `municipalUrl` at all.
- Investigating whether `data/open-data-portals/baseline/` should be purged from the repo entirely now that it's acknowledged as frozen historical data.
