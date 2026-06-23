# BCKGeo Command Centre

**Live:** [dashboard.bckgeo.ca](https://dashboard.bckgeo.ca)

A real-time operations dashboard for Canadian geomatics professionals. Aggregates weather, NOAA space weather, GNSS conditions, magnetic declination, and a searchable directory of 3,000+ Canadian municipalities with links to their open data portals, council meetings, and engineering standards.

## Features

- **Command Centre** -- Live weather, Kp index, solar wind, magnetic field, aurora forecasts, and space weather alerts
- **Flight Ops** -- RPAS mission planning resources, NOTAM links, NAV CANADA products
- **Geodesy** -- Magnetic declination calculator, datum transformations, projection tools
- **GIS** -- Spatial operations, Canadian open data catalogue links
- **Remote Sensing** -- Imagery sources, Sentinel / Landsat / RADARSAT resources
- **Jurisdictions** -- Provincial intel + interactive map of 3,061 Canadian municipalities with portal, council, and survey standards links; distance-sort by GPS, viewport filtering
- **Survey Tools** -- Photo scale, curve, area, and intersection calculators
- **Codex** -- Searchable glossary of geomatics terms and standards

## Tech Stack

- **React 19** + **Vite 8** (SPA, code-split per route)
- **MapLibre GL JS** for the jurisdictions map (WebGL, clustered markers, heatmaps)
- **Tailwind-ish** inline styles with a shared theme context (dark/light)
- **Cloudflare Pages** hosting, auto-deploy from `main`
- Satellite TLE data pre-fetched from celestrak.org at build time (see `scripts/fetch-tles.mjs`), refreshed daily by a scheduled GitHub Action

## Development

```bash
npm install
npm run dev      # Start dev server on :5173
npm run build    # Production build -> dist/
npm test         # Run unit tests (vitest)
```

Requires Node 22 LTS (pinned via `.node-version`).

## Scripts

- `scripts/fetch-tles.mjs` -- Pre-fetch GNSS TLEs from celestrak.org into `public/tles.json` (runs automatically via `prebuild`/`predev`)
- `scripts/check-links.js` -- Validate all URLs in `public/municipalities.json`
- `scripts/data-to-json.mjs` -- Regenerate JSON from the master data file
- `scripts/validate_portals.py` -- Detect phantom ArcGIS Hub portal redirects

## Deployment

The dashboard auto-deploys to [dashboard.bckgeo.ca](https://dashboard.bckgeo.ca) on every push to `main` via Cloudflare Pages. No manual deploy step.

A scheduled GitHub Action (`.github/workflows/refresh-tles.yml`) triggers a daily Pages rebuild so the bundled TLE data stays current. To enable, create a deploy hook in the Pages project settings and store the URL as the `CF_PAGES_DEPLOY_HOOK` repo secret.

## Security

See [SECURITY.md](SECURITY.md) for the disclosure policy and scope.

## Author

Ben Koops ([BCKGeo](https://github.com/BCKGeo)) -- Prince George, BC, Canada
