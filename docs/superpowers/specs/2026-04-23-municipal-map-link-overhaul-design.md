# Municipal Map Link Overhaul — Design

**Date:** 2026-04-23
**Author:** Ben Koops (with Claude)
**Status:** Draft
**Related:** `2026-04-08-municipal-map-redesign-design.md`, `2026-04-07-canadian-open-data-research-design.md`

## Context

The Jurisdictions tab renders `MunicipalMap`, which includes a results table with a `Links` column. Each row exposes up to three outbound links:

| Label (current) | Field (current)   | Tooltip (current)   |
| --------------- | ----------------- | ------------------- |
| `Data`          | `portalUrl`       | Open Data Portal    |
| `Council`       | `councilUrl`      | Council Meetings    |
| `Stds`          | `surveyStandards` | Survey Standards    |

Two problems:

1. **Label quality.** `Data` is too generic for a geomatics audience; it should read as domain-specific (the link goes to GIS / open data hubs). `Council` is actively misleading — commit `ca0e40a` stripped many council URLs down to their root municipal domains to fix dead-link issues, so the field is already half-morphed into "municipal website" (e.g. Surrey is `www.surrey.ca`, CRD is `www.crd.bc.ca`) while other entries still point at council-specific platforms (`pub-burnaby.escribemeetings.com`, `council.vancouver.ca`).

2. **Data inconsistency.** Because `councilUrl` values mix two concepts (actual council portals vs. municipal home pages), the user value is uneven: clicking `Council` sometimes reaches agendas and sometimes just the home page. Going forward, the target should consistently be the **municipal front door**, from which council records are findable as a bonus.

## Goals

1. Relabel the table links and update their tooltips so they accurately describe what each link targets for a geomatics professional.
2. Rename the underlying data field so its name matches the new target (municipal website, not council portal).
3. Normalize the existing data so all entries under the renamed field consistently point to the municipal front door.
4. Keep the existing Data (GIS) and Standards links unchanged in semantics; only the former "Council" link changes targets.

## Non-Goals

- **Not** adding a separate field to preserve council-specific URLs. One outbound link per row; council records are a bonus if the municipal site links them.
- **Not** retrofitting the 13 existing per-province Excel deliverables. They regenerate from updated research JSONs — a regeneration is optional follow-up, out of scope here.
- **Not** restructuring the dashboard taxonomy, tabs, or nav hierarchy (settled by prior dashboard decisions).
- **Not** adding new columns, sorting, or filters to the table.
- **Not** re-researching municipalities that currently have no URL at all — this project cleans existing values, it does not expand coverage.

## Terminology

- **"Municipal website"** / **"municipal front door"**: the root public-facing site a municipality publishes, e.g. `www.surrey.ca`, `www.burnaby.ca`, `www.crd.bc.ca`. For regional districts, rural municipalities, and townships, this is whatever the governing body publishes as its primary web presence. It is **not** an escribe / civicweb / agenda subdomain.
- **"Council platform"**: a third-party meeting-records system hosting council agendas and minutes, including but not limited to:
  - `*.escribemeetings.com`
  - `*.civicweb.net`
  - `pub-*.ca` (older CivicPlus hosts)
  - `*.icompasscanada.com`
  - `council.*` subdomains that are clearly dedicated to council records

## Design

### 1. UI labels and tooltips

The two affordances use different label lengths on purpose: the table cell is space-constrained (short labels), the popup pill has room (longer labels). This follows the existing convention in the codebase (current popup uses `Data Portal` / `Standards` long-form already).

**Table** — `MunicipalTable.jsx`:

| Slot   | Label (new) | Tooltip (new)          |
| ------ | ----------- | ---------------------- |
| slot 1 | `GIS`       | Open Data / GIS Portal |
| slot 2 | `Municipal` | Municipal Website      |
| slot 3 | `Stds`      | Survey Standards       |

**Popup** — `MunicipalMapPopup.jsx` (main entry **and** related-entities section — 2 occurrences):

| Slot   | Label (new)    |
| ------ | -------------- |
| slot 1 | `Data Portal`  |
| slot 2 | `Municipal`    |
| slot 3 | `Standards`    |

The table `Links` column header itself is unchanged.

### 2. Data model — field rename

- `councilUrl` → `municipalUrl` everywhere:
  - `public/municipalities.json` (runtime source of truth for the UI)
  - `data/open-data-portals/{ab,bc,mb,nb,nl,ns,nt,nu,on,pe,qc,sk,yt}_research.json` (research source of truth, per-province)
  - All Python pipeline scripts that read or write the field (`research_pipeline.py`, `assemble_research.py`, `sync_municipalities_js.py`, `tier1_portals_fill.py`, `tier2_fill.py`, `tier3_fill.py`, `url_remediation.py`, `provincial_bulk_fill.py`, `qc_stub_fill.py`, `expand_quebec.py`, `stub_triage.py`, `build_excel.py`, `build_province_excel.py`)
  - `src/components/ui/MunicipalMap.jsx` — `buildFeature` property assignment
  - `src/components/ui/MunicipalTable.jsx` — two references: the empty-state ternary guard (currently `r.portalUrl || r.councilUrl || r.surveyStandards`) **and** the cell-render branch. Both must be updated together or the empty-state check silently diverges from what renders.
  - `src/components/ui/MunicipalMapPopup.jsx` — two references: main entry and related-entities section.
  - `src/data/entityCategories.js` — `getCoverageScore` reads this field; **this is a hard dependency** (coverage score drives marker color/shape, so the rename must be atomic with the field rename).
  - `scripts/check-links.js` — comment reference (and see §4 on pre-existing bug).

- **Rename ordering.** The rename is executed first as an atomic pass across all consumers (mechanical, one commit). The data-cleanup passes in §3 then operate on the already-renamed field. This avoids the normalize script needing to handle both field names simultaneously.

- **Out of scope: baseline JSONs.** Files under `data/open-data-portals/baseline/` (18 files: `*_baseline.json`, `*_municipalities.json`, `*_tier1.json`, `*_tier2.json`, `*_qa_report.json`, `national_qa_report.json`) contain ~2,478 `councilUrl` occurrences but are **historical intermediate snapshots**, not runtime or pipeline inputs. They're produced by earlier stages of the research pipeline and are only consumed by downstream scripts that have since been superseded by the `*_research.json` files. Leaving them with the old field name preserves their value as point-in-time artifacts. They are therefore explicitly excluded from both the rename and the grep-check gate (§7). Note: these are likely gitignored, which is why naive ripgrep passes may miss them — any verification grep must use `--no-ignore` or target the directory explicitly to see them.

- **No backwards-compat alias.** The field disappears; clean rename. Any consumer that still reads `councilUrl` will break loudly at runtime or silently render blank cells — both are surfaced in the verification step.

### 3. Data cleanup — two-pass audit

The field rename is mechanical. The data cleanup is the substantive part.

**Pass 1 — programmatic normalization** (`scripts/municipal_url_normalize.py`, new):

- Walks every entry in every `data/open-data-portals/*_research.json` and inspects the current `councilUrl` value (before rename, script handles both names during transition).
- Classifies each value into one of:
  - **ROOT** — hostname looks like a root municipal domain (heuristics: 2-3 label domain, no subdomain like `council.` / `pub-` / `agenda`, not on a known council-platform TLD list). Leave as-is.
  - **COUNCIL_PLATFORM** — hostname matches known council-platform patterns. Attempt to derive a root municipal domain by (a) checking the entry's `name` for a known municipal domain, (b) falling back to a domain registry maintained in the script. If derivable with confidence, rewrite. If not, flag.
  - **DEPARTMENT_SUBDOMAIN** — hostname is the right municipality but a sub-path like `parks.` or `opendata.` — flag for manual review (may be intentional, may be wrong).
  - **UNKNOWN / FLAG** — cannot classify automatically; flag for manual review.
- Emits:
  - A unified diff per province (`diff/municipal_url_normalize/<prov>.diff`) showing before → after.
  - A flagged-for-manual-review TSV with `province | name | current_url | suggested_action`.
  - A summary report: counts per bucket, per province.
- The script is **idempotent and non-destructive by default** — writes to a `.proposed.json` sidecar. A `--apply` flag copies the proposed file over the real one.

**Pass 2 — manual triage.** Open the flagged TSV, resolve each row by either approving the suggested rewrite, hand-rewriting, or nulling. Expected volume: under 200 rows based on prior experience with the dataset.

**Regenerate `public/municipalities.json`** via `scripts/sync_municipalities_js.py` after both passes complete.

### 4. Fix pre-existing bug: check-links.js

`scripts/check-links.js` reads from `src/data/municipalities.js`, which no longer exists (data moved to `public/municipalities.json` per the commit `29e956b` "perf: split data from code"). The script is currently broken. Since we need it working for verification, fix it as part of this work:

- Change `readFileSync("src/data/municipalities.js")` → `readFileSync("public/municipalities.json")` + `JSON.parse`.
- Update the URL-extraction logic: it currently regex-matches URLs out of a JS source file; switch to walking the parsed JSON and extracting `portalUrl`, `municipalUrl`, `surveyStandards` from each entry (including `related[]`).
- **Preserve the `--province` flag.** The old implementation filtered by matching `province: "XX"` on the same source line as a URL (a JS-source artifact). The JSON-based implementation must replicate the filter by iterating records and comparing the `province` field before extracting URLs.
- Update the inline doc comment to match.

### 5. Data flow (unchanged shape, renamed symbol)

```
data/open-data-portals/*_research.json   (research source of truth)
        │
        ▼  scripts/sync_municipalities_js.py
public/municipalities.json               (runtime source of truth)
        │
        ▼  fetch() in MunicipalMap.jsx
buildFeature() → GeoJSON properties
        │
        ├──▶ MunicipalTable.jsx   (GIS / Municipal / Stds links)
        └──▶ MunicipalMapPopup.jsx (Data Portal / Municipal / Standards pills)
```

### 6. Error handling

- **Missing `municipalUrl` on a row**: renders `-` in the table cell and omits the pill in the popup. Same behavior as the current `councilUrl` fallback.
- **Coverage score change**: because `getCoverageScore` sums three boolean-cast fields, swapping the field name is semantically identical as long as every consumer is renamed in lockstep. If the rename is incomplete, scores silently drop and markers shift color — this is caught by the post-change visual verification (§7).
- **Broken URLs introduced by rewrite**: caught by `check-links.js` rerun after cleanup. Any 4xx/5xx is nulled in the research JSON and regenerated.

### 7. Testing / verification

- **Build check**: `npm run build` completes without errors or warnings about missing fields.
- **Grep check**: zero **substring occurrences** (not lines) of `councilUrl` in the repo. Because `public/municipalities.json` is minified to a single line, a line-counting grep (default `rg -c` / `grep -c`) would report at most `1` per file and hide hundreds of missed instances. The gate must count substring matches — e.g. `rg --count-matches councilUrl` or `grep -o councilUrl <file> | wc -l` — and sum across files. Paths excluded from the gate:
  - `node_modules/`
  - `docs/superpowers/specs/` (historical spec docs including this one reference the old name for context)
  - `data/open-data-portals/baseline/` (historical snapshots, see §2)
  - Any `*.proposed.json` sidecar output from the normalize script (see §3)
  - Git history itself (only the working tree is gated)
- **Link check**: `node scripts/check-links.js` runs clean end-to-end (fix in §4 makes this possible). Also verify `node scripts/check-links.js --province BC` exercises the restored province filter.
- **Visual spot-check**: load the dashboard locally, navigate to Jurisdictions, confirm:
  - Column links read `GIS` / `Municipal` / `Stds`.
  - Hovering shows the updated tooltips.
  - Popup pills read `Data Portal` / `Municipal` / `Standards`.
  - Coverage colors (green/amber/grey) still render correctly for known-good entries (e.g. Vancouver should stay green; it has all three fields).
  - Spot-check 10 random `Municipal` links across provinces — each should open the root municipal site, not an escribe / civicweb page.
- **Unit test**: none added — existing test coverage (`src/geo.test.js`) does not cover the table renderer, and adding a dedicated renderer test for a label/field change is disproportionate. Visual check is the verification gate.

## Components touched

| File                                                 | Change                                                   |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `src/components/ui/MunicipalMap.jsx`                 | `buildFeature` property rename                           |
| `src/components/ui/MunicipalTable.jsx`               | Link label + tooltip; field name                         |
| `src/components/ui/MunicipalMapPopup.jsx`            | Pill label; field name (main + related)                  |
| `src/data/entityCategories.js`                       | `getCoverageScore` field reference                       |
| `public/municipalities.json`                         | Field rename in every record                             |
| `data/open-data-portals/*_research.json` (×13)       | Field rename in every record                             |
| `scripts/*.py` (×13, see §2)                         | Field rename in reads/writes/docs                        |
| `scripts/check-links.js`                             | Fix pre-existing bug + field rename                      |
| `scripts/municipal_url_normalize.py`                 | **New** — audit + normalize script                       |

## Risks and mitigations

| Risk                                                        | Mitigation                                                      |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| Rename misses a consumer → silent blank cells + wrong color | Post-rename grep for `councilUrl` must return zero; visual spot |
| Normalizer rewrites confidently but incorrectly             | `.proposed.json` sidecar + per-province diff review before apply |
| Manual triage backlog larger than expected                  | Flagged TSV is bounded and sortable; can be done incrementally  |
| Council-platform heuristics too aggressive or too loose     | Classification is logged per entry; inspect buckets before apply |

## Out-of-scope follow-ups

- Regenerate the 13 provincial Excel deliverables from the cleaned data.
- Consider re-introducing a separate `councilRecordsUrl` field later if a use case surfaces.
- Expand URL coverage for municipalities that currently have no `municipalUrl` at all.
