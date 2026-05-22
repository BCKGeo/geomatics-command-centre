# Security Policy

## Reporting a Vulnerability

If you discover a security issue in the BCKGeo Command Centre, please report it privately to **ben@bckgeo.ca**.

Please include:
- A description of the issue and its potential impact
- Steps to reproduce
- Affected URLs, endpoints, or components
- Your contact info (if you want credit)

**Please do not** open a public GitHub issue for security-sensitive problems.

## Response

- Acknowledgement within 7 days (best effort)
- Initial assessment and triage within 14 days
- Coordinated disclosure timeline depending on severity

## Scope

This repository hosts a **static React SPA** deployed to Cloudflare Pages at dashboard.bckgeo.ca.

### In scope
- Client-side XSS, prototype pollution, or other code injection via the React app
- Supply-chain issues in npm dependencies
- Leaked secrets, tokens, or credentials in the repo or build artifacts
- CSRF or open-redirect in any interactive endpoint

### Out of scope
- Issues in third-party services the app consumes read-only (NOAA, Environment Canada, Open-Meteo, BigDataCloud, Celestrak) -- report those upstream
- Municipal website content linked from the Jurisdictions page
- Rate limiting of public information APIs
- Clickjacking on pages with no authenticated or state-changing actions

## Architecture Notes for Researchers

- **No user authentication** as of this writing; nothing behind a login
- **No backend database**; no PII is collected, stored, or transmitted
- **Location data** is used client-side only (GPS or manual coordinate entry) and stored in `localStorage` on the user's device. Coordinates are sent to BigDataCloud for reverse geocoding and to Open-Meteo / NOAA for weather and space weather data
- **Satellite TLE data** is pre-fetched from `celestrak.org` at build time by `scripts/fetch-tles.mjs` and served as a static asset (`public/tles.json`). No runtime relay
- All third-party API calls are from the browser, not proxied through our infrastructure

## Dependencies and Monitoring

- `npm audit` is expected to show **0 vulnerabilities**; any regression is treated as a defect
- Dependabot monitors npm and GitHub Actions weekly (`.github/dependabot.yml`)
- Node version is pinned to 22 LTS via `.node-version`
