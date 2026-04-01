import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/geomatics-command-centre/',
  resolve: {
    alias: {
      // satellite.js v7 re-exports WASM modules that use top-level await
      // and node:module, breaking Vite's iife bundling. Redirect to our
      // shim that only re-exports the pure-JS SGP4 code.
      'satellite.js': path.resolve(__dirname, 'src/lib/satellite-shim.js'),
    },
  },
  server: {
    // SPA fallback for dev server
    historyApiFallback: true,
  },
})
