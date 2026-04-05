# Cloudflare Pages Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Geomatics Command Centre from GitHub Pages to Cloudflare Pages at dashboard.bckgeo.ca

**Architecture:** Remove all GitHub Pages workarounds (base path prefix, 404.html SPA hack, query-param redirect script), add Cloudflare Pages native SPA routing via `_redirects`, delete the GH Actions deploy workflow. The result is a cleaner Vite config serving from root `/`.

**Tech Stack:** Vite, React, Cloudflare Pages

**Spec:** `docs/superpowers/specs/2026-04-02-cloudflare-pages-migration-design.md`

---

### Task 1: Remove GitHub Pages base path from Vite config

**Files:**
- Modify: `vite.config.js`

- [ ] **Step 1: Edit vite.config.js**

Remove the `isProd` variable and the `base` property. The file should become:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // satellite.js v7 re-exports WASM modules that use top-level await
      // and node:module, breaking Vite's iife bundling. Redirect to our
      // shim that only re-exports the pure-JS SGP4 code.
      'satellite.js': path.resolve(__dirname, 'src/lib/satellite-shim.js'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-satellite': ['satellite.js'],
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
  server: {
    // SPA fallback for dev server
    historyApiFallback: true,
  },
})
```

- [ ] **Step 2: Verify build works**

Run: `npm run build`
Expected: Build succeeds, `dist/index.html` contains `src="/assets/..."` (root-relative, no `/geomatics-command-centre/` prefix)

- [ ] **Step 3: Commit**

```bash
git add vite.config.js
git commit -m "chore: remove GitHub Pages base path from Vite config"
```

---

### Task 2: Remove GitHub Pages SPA routing hacks

**Files:**
- Delete: `public/404.html`
- Modify: `index.html` (remove lines 20-23, the SPA redirect script)

- [ ] **Step 1: Delete public/404.html**

Remove the file entirely. It was a GitHub Pages workaround that redirected unknown routes to `/?p=<encoded-path>`.

- [ ] **Step 2: Remove the redirect script from index.html**

Remove the script block on lines 20-23:

```html
    <script>
      // GitHub Pages SPA: restore route from 404.html redirect
      (function(){var q=window.location.search.match(/[?&]p=([^&]*)/);if(q){var p=decodeURIComponent(q[1]);window.history.replaceState(null,null,window.location.pathname.replace(/\/$/,'')+p);}})();
    </script>
```

The resulting index.html body section should be:

```html
  <body style="margin:0;padding:0;">
    <script>try{document.body.style.background=localStorage.getItem('bckgeo-theme')==='light'?'#f0f3f8':'#060e20';}catch(e){document.body.style.background='#060e20';}</script>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
```

- [ ] **Step 3: Commit**

```bash
git add -u public/404.html index.html
git commit -m "chore: remove GitHub Pages SPA routing hacks"
```

---

### Task 3: Add Cloudflare Pages SPA routing

**Files:**
- Create: `public/_redirects`

- [ ] **Step 1: Create public/_redirects**

```
/* /index.html 200
```

This tells Cloudflare Pages to serve `index.html` for all routes with a 200 status, enabling client-side React Router to handle routing.

- [ ] **Step 2: Verify it will be included in build output**

Run: `npm run build`
Expected: `dist/_redirects` exists with the redirect rule

- [ ] **Step 3: Commit**

```bash
git add public/_redirects
git commit -m "feat: add Cloudflare Pages SPA routing"
```

---

### Task 4: Remove GitHub Pages deploy workflow

**Files:**
- Delete: `.github/workflows/deploy.yml`

- [ ] **Step 1: Delete .github/workflows/deploy.yml**

Remove the file. Cloudflare Pages handles builds and deploys via its own Git integration.

- [ ] **Step 2: Clean up empty directory if needed**

If `.github/workflows/` is now empty, the directory will be removed by git automatically on next commit.

- [ ] **Step 3: Commit**

```bash
git add -u .github/workflows/deploy.yml
git commit -m "chore: remove GitHub Pages deploy workflow"
```

---

### Task 5: Final verification

- [ ] **Step 1: Full build test**

Run: `npm run build`
Expected: Clean build, no warnings. Verify:
- `dist/index.html` has no `/geomatics-command-centre/` references
- `dist/_redirects` exists
- No `dist/404.html`

- [ ] **Step 2: Local preview test**

Run: `npm run preview`
Expected: Dashboard loads at `http://localhost:4173/`. Navigate to a deep route and hard-refresh - should still work (Vite preview handles this in dev).

- [ ] **Step 3: Grep for stale references**

Run: `grep -r "geomatics-command-centre" --include="*.js" --include="*.jsx" --include="*.html" --include="*.json" . --exclude-dir=node_modules --exclude-dir=dist`
Expected: Only hits in `package.json`, `package-lock.json` (the npm package name field, not a path), and `docs/` files (spec/plan references).

- [ ] **Step 4: Push to GitHub**

```bash
git push origin main
```

---

### Task 6: Manual steps (developer, not agent)

- [ ] **Step 1: Create Cloudflare Pages project** - Dashboard > Pages > Create > Connect to Git > select BCKGeo/geomatics-command-centre. Build command: `npm run build`, output: `dist`. Set env var `NODE_VERSION=20`.
- [ ] **Step 2: Verify** the `*.pages.dev` preview URL loads the dashboard correctly.
- [ ] **Step 3: Add custom domain** `dashboard.bckgeo.ca` (CF auto-creates CNAME since DNS is already on Cloudflare).
- [ ] **Step 4: Disable GitHub Pages** in repo settings (Settings > Pages > disable).
