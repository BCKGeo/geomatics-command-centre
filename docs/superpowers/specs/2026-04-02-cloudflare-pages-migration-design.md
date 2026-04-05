# Cloudflare Pages Migration Design

**Date:** 2026-04-02
**Status:** Draft
**Domain:** dashboard.bckgeo.ca
**Access:** Public (Cloudflare Access can be added later)

## Summary

Migrate the Geomatics Command Centre dashboard from GitHub Pages to Cloudflare Pages. The repo stays on GitHub; only the hosting/deploy target changes. This removes GitHub Pages workarounds (base path prefix, 404.html SPA hack, query-param redirect) and leverages Cloudflare's native SPA support, edge CDN, and the existing bckgeo.ca DNS zone.

## Architecture

```
Developer pushes to main (GitHub)
  -> Cloudflare Pages auto-builds (npm run build)
  -> Static assets deployed to Cloudflare edge CDN
  -> Served at dashboard.bckgeo.ca
  -> SPA routing via _redirects (/* -> /index.html 200)
  -> PWA manifest/service worker served from root /
```

No Cloudflare tunnel involved. Pages serves directly from edge, unlike the NAS-hosted services (rss.bckgeo.ca, chat.bckgeo.ca) that route through the tunnel.

## Code Changes

### 1. vite.config.js - Remove base path

**Before:**
```js
const isProd = process.env.NODE_ENV === 'production';
// ...
base: isProd ? '/geomatics-command-centre/' : '/',
```

**After:**
```js
// Remove isProd variable (no longer needed)
// Remove base property entirely (defaults to '/')
```

### 2. Delete public/404.html

The GitHub Pages SPA routing hack that redirects unknown paths to `/?p=<encoded-path>`. Cloudflare Pages handles SPA fallback natively via `_redirects`.

### 3. Remove SPA redirect script from index.html

The `?p=` query param parser in index.html that pairs with 404.html:

```js
// Remove this script block:
(function(){var q=window.location.search.match(/[?&]p=([^&]*)/);if(q){var p=decodeURIComponent(q[1]);window.history.replaceState(null,null,window.location.pathname.replace(/\/$/,'')+p);}})();
```

### 4. Add public/_redirects

Cloudflare Pages SPA fallback configuration:

```
/* /index.html 200
```

This tells CF Pages to serve index.html for all routes with a 200 status, letting React Router handle client-side routing.

### 5. Delete .github/workflows/deploy.yml

The GitHub Pages deploy workflow. Cloudflare Pages handles builds and deploys via its own Git integration.

### 6. Disable GitHub Pages (manual)

In repo settings, disable GitHub Pages to avoid confusion with the old deploy target.

## Manual Setup Steps (Cloudflare Dashboard)

These are one-time steps performed by the developer:

1. **Cloudflare Dashboard > Pages > Create a project > Connect to Git**
2. **Select repository:** BCKGeo/geomatics-command-centre
3. **Build configuration:**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: 20 (set via environment variable `NODE_VERSION=20`)
4. **Deploy** - CF assigns a `*.pages.dev` URL for verification
5. **Custom domain:** Add `dashboard.bckgeo.ca` - CF auto-creates the CNAME since bckgeo.ca DNS is already on Cloudflare
6. **GitHub repo settings:** Disable GitHub Pages

## Files Unchanged

- `public/manifest.json` - PWA manifest, `start_url: "/"` already correct
- `public/sw.js` - Service worker, no path dependencies
- `public/icon-192.svg`, `public/icon-512.svg` - PWA icons
- `src/**` - All application code, components, routing
- `package.json` - Build scripts unchanged (`npm run build` still produces `dist/`)

## Testing / Verification

1. After code changes, `npm run build` locally and verify `dist/` output has no path prefix references
2. After CF Pages deployment, verify:
   - Root URL loads the dashboard
   - Direct navigation to deep routes (e.g., `/flight-ops`) works (SPA routing)
   - Hard refresh on deep routes works (CF `_redirects` handling)
   - PWA install prompt appears
   - Service worker registers correctly
3. Verify `*.pages.dev` preview URL before pointing custom domain

## Risks

- **Risk:** None material. Static SPA with no backend dependencies.
- **Rollback:** Re-enable GitHub Pages, revert the code changes (single commit revert).
- **Downtime:** Zero. Old GH Pages URL continues working until explicitly disabled. New CF Pages URL is independent.

## Future Considerations

- Cloudflare Access can be added to gate the dashboard if sensitive features are added
- Cloudflare Functions (Workers) are available at the edge if server-side logic is ever needed
- Preview deploys: every PR branch automatically gets a unique preview URL
