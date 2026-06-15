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
        // Vite 8 bundles with Rolldown, whose manualChunks only accepts the
        // function form (Rollup's object shorthand is no longer supported).
        manualChunks: (id) => {
          const p = id.replace(/\\/g, '/')
          if (!p.includes('/node_modules/')) return
          if (/\/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(p)) return 'vendor-react'
          if (p.includes('/node_modules/satellite.js/')) return 'vendor-satellite'
          if (p.includes('/node_modules/maplibre-gl/')) return 'vendor-maplibre'
        },
      },
    },
  },
  server: {
    // SPA fallback for dev server
    historyApiFallback: true,
  },
})
