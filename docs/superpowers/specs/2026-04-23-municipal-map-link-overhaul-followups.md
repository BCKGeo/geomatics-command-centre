# Municipal Map Link Overhaul — Follow-ups

**Status:** main work landed; this doc captures non-blocking residual items for a separate session.

**Spec:** [2026-04-23-municipal-map-link-overhaul-design.md](./2026-04-23-municipal-map-link-overhaul-design.md)
**Plan:** [../plans/2026-04-23-municipal-map-link-overhaul.md](../plans/2026-04-23-municipal-map-link-overhaul.md)
**Final shipped commits:** `5f0bd09` → `9bd46ad` on `main`

## Kickoff prompt (paste into a fresh Claude Code session)

> I want to clean up the remaining backlog from the municipal-map-link-overhaul work. The full context lives in `docs/superpowers/specs/2026-04-23-municipal-map-link-overhaul-followups.md`. Read that file first, then triage which items are worth doing in this session vs deferring further. The dashboard is live in production; nothing here is blocking.

That's it. The rest of this doc is the context the new session needs.

---

## Where things stand

The original work shipped over commits `5f0bd09 → 9bd46ad` on main. Production is verified live at https://dashboard.bckgeo.ca with:

- Field rename `councilUrl` → `municipalUrl` end-to-end
- Table labels `GIS / Municipal / Standards` (amber `#c08800` / blue `B.pri` / green `#4caf50`)
- 153 entities with restored / corrected `municipalUrl` (142 auto-triage + 8 retry-restore + 3 dept-subdomain)
- Service worker dropped; HTTP cache headers in `public/_headers` handle freshness
- 4 helper scripts checked in: `municipal_url_normalize.py`, `triage_flagged.py`, `triage_apply.py`, `strip_muniurl_paths.py`, `restore_nulled_muniurls.py`

## Backlog

### Data quality

#### 1. 7 truly-dead `municipalUrl` values to investigate

These all returned persistent connection failures or a 404 on root. Some may be rebrands / domain moves rather than genuinely dead.

| Entity | Province | Last-known URL | Probe result |
| --- | --- | --- | --- |
| Iqaluit (City of) | NU | `https://www.city.iqaluit.nu.ca` | connection fail |
| Wheatland County | AB | `https://www.wheatlandcounty.ca` | connection fail |
| Yellowhead County | AB | `https://www.yellowheadcounty.ab.ca` | connection fail |
| Northern Rockies Regional District (NCRD)? | BC | `https://www.ncrd.bc.ca` | connection fail |
| Spallumcheen | BC | `https://www.spallumcheen.ca` | connection fail |
| Bradford West Gwillimbury | ON | `https://bradfordwestgwillimbury.civicweb.net` | civicweb, DNS dead |
| Regional District of Kootenay Boundary (RDKB) | BC | `https://www.rdkb.com` | 404 on root |

**Approach for each:**
1. Search the web for the municipality's actual current website (rebrand check)
2. If found: update the entity's `municipalUrl` directly in `data/open-data-portals/<prov>_research.json`
3. Regenerate via `python scripts/sync_municipalities_js.py && node scripts/data-to-json.mjs`
4. Verify in `public/municipalities.json`
5. Commit + push

Effort: 5-15 min per entity, mostly research.

#### 2. 22 deferred council-platform URLs

Live in `diff/municipal_url_normalize/_flagged_deferred.tsv` (gitignored; regenerate by running the triage if needed). The auto-triager in `scripts/triage_flagged.py` couldn't confidently derive a parent municipal domain. Most are dead `civicweb.net` hosts that are simply no longer used.

**Approach:**
- Sort by province; tackle one province at a time
- For each, manual web search to find the city's current municipal site
- Edit the research JSON, regenerate, commit

Effort: 2-3 hours total if done all at once. Could be batched / split.

### Code quality

#### 3. ESLint baseline

The project has no ESLint config. Adding a baseline `eslint.config.js` would catch unused vars, missing deps in hooks, accessibility regressions.

**Approach:**
```bash
npm install -D eslint @vitejs/plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh
# create eslint.config.js with React + React Hooks + a11y rules
# add "lint": "eslint ." to package.json scripts
# fix anything red, commit
```

Effort: 30 min. Be ready for some yelling on initial run; auto-fix what's safe, manually triage the rest.

#### 4. `npm audit fix` for postcss CVE

```bash
npm audit fix
```

Moderate severity, low real-risk for this site (no user-controlled CSS), but free fix.

Effort: <2 min. Verify build still passes; commit.

#### 5. Drop legacy SW update-trigger

`src/main.jsx:15-19` calls `getRegistrations().forEach(r.update())` to make existing legacy SW installs notice the kill-switch. Once the kill-switch has been live ~1 week, this code is dead.

**Approach:**
- Wait until ~2026-04-30 (one week post-deploy)
- Delete lines 15-19 from `src/main.jsx`
- Commit, push

Effort: <2 min.

#### 6. Outdated deps (selective bumps)

Most are major-version jumps and warrant their own session, but minor-version bumps are safe:

```bash
# safe minor bumps
npm update maplibre-gl react-map-gl react-router-dom vitest
```

Major bumps (defer): React 18→19, Vite 6→8, @vitejs/plugin-react 4→6.

Effort: 15 min for minor; defer major.

### Tests

#### 7. Unit tests for the rename-touched components

The rename was wide. A small snapshot-style test would lock in:

- `MunicipalTable.jsx` renders the three links with correct `href`s when fields are populated
- `MunicipalMapPopup.jsx` renders the three pills with correct labels
- `entityCategories.js` `getCoverageScore` counts `municipalUrl` (regression catch if someone reverts the rename)

**Approach:**
- Add `src/components/ui/MunicipalTable.test.jsx` and `MunicipalMapPopup.test.jsx`
- Use vitest + @testing-library/react (need to install if not already there)
- Add `getCoverageScore` test to `src/data/entityCategories.test.js` (new file)

Effort: 45 min including setup of testing-library if not present.

### UX

#### 8. Mobile narrow-viewport label width

"GIS Municipal Standards" wraps awkwardly on narrow Android viewports. Cell is `whiteSpace: "nowrap"` so it scrolls horizontally — not broken, just ugly.

**Approach:** at viewport width < 480px, switch the labels back to short forms (`GIS`, `Mun`, `Stds`). Conditional via `window.matchMedia` or a `useMediaQuery` hook.

Effort: 20 min. Low priority.

## Suggested order

If doing one focused session, in order of value:

1. **#4 npm audit fix** (2 min, free)
2. **#1 7 truly-dead URLs** (research + fix, biggest user-visible win)
3. **#3 ESLint baseline** (catches future bugs)
4. **#5 drop legacy SW code** (only if past 2026-04-30)
5. **#2 deferred council-platform URLs** (only if you want to grind through all 22)
6. **#7 component tests** (nice to have, not urgent)
7. **#8 mobile label width** (cosmetic)
8. **#6 minor deps** (optional)

Skip / defer: major dependency bumps (React 19, Vite 8) — own session.

## Constraints / project conventions

- Shell: Git Bash on Windows. Avoid PowerShell `Set-Content -Encoding utf8` for JSON files (BOM hazard breaks Python json.load). Prefer `sed` / Python file I/O.
- Encoding: explicit `encoding='utf-8'` on every Python file open. JSON writes use `ensure_ascii=False, indent=2` + trailing newline.
- Auto-deploy: pushes to `main` go live via Cloudflare Pages auto-build (~90s). Withhold push until verifications pass.
- Cache: `public/_headers` already handles freshness. No SW touches needed unless you're adding offline support back.
- Test command: `npm test` (vitest, 241 tests). Python: `cd scripts && python -m pytest test_municipal_url_normalize.py` (17 tests).
- Build verify: `npm run build` should exit 0; only the pre-existing maplibre chunk-size warning is acceptable.
- Grep gate: substring count, not lines (`public/municipalities.json` is minified). Use `rg --count-matches` or `grep -o ... | wc -l`.
- Excluded paths from grep gate: `node_modules/`, `docs/superpowers/specs/`, `docs/superpowers/plans/`, `data/open-data-portals/baseline/`, `diff/municipal_url_normalize/`, `dist/`, `.worktrees/`.

## Files of interest

| File | Why |
| --- | --- |
| `data/open-data-portals/{ab,bc,…}_research.json` | Source of truth for entities |
| `public/municipalities.json` | Runtime data (regenerated from research JSONs) |
| `scripts/sync_municipalities_js.py` | Research JSONs → `src/data/municipalities.js` |
| `scripts/data-to-json.mjs` | `src/data/municipalities.js` → `public/municipalities.json` |
| `scripts/check-links.js` | Link-checker (run manually) |
| `scripts/strip_muniurl_paths.py` | One-shot URL cleanup (already ran) |
| `scripts/restore_nulled_muniurls.py` | Reverses false-negative nullings |
| `src/components/ui/MunicipalTable.jsx` | Table rendering with the `GIS / Municipal / Standards` links |
| `src/components/ui/MunicipalMapPopup.jsx` | Popup with the three pills |
| `src/data/entityCategories.js` | `getCoverageScore`, marker shape mapping |
| `public/_headers` | CF Pages cache rules |
| `public/sw.js` | Self-unregistering kill-switch (legacy SW cleanup) |

## Out-of-scope (do not touch in a quick follow-up session)

- Re-introducing offline support / a real service worker — that's a feature, not a cleanup
- Reorganizing the dashboard taxonomy or adding tabs (settled by prior decisions)
- Regenerating the 13 provincial Excel deliverables — they regenerate from the JSONs if needed, ad hoc
- Anything in `data/open-data-portals/baseline/` — frozen historical snapshots
