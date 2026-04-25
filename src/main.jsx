import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// We no longer register a service worker. Cache freshness is handled by HTTP
// cache headers in public/_headers (no-cache for index.html, immutable for
// hashed assets). The remaining /sw.js endpoint is a self-unregistering
// kill-switch that cleans up legacy SW installs from returning users.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => { /* trigger update check on all */ r.update(); }))
    .catch(() => { /* ignore */ });
}
