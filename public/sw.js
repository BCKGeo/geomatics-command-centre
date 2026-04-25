// Self-unregistering kill-switch.
//
// The dashboard previously used a cache-first service worker for offline
// support. We've moved to plain HTTP cache headers (see public/_headers) for
// fresher updates without manual cache-name bumps. This SW exists only to
// clean up after legacy v5/v6/v7 installations on returning users.
//
// On install: skip waiting so we activate immediately.
// On activate: delete every cache, unregister this SW, then reload all open
// clients so they pick up the cache-controlled HTTP behaviour without the
// user having to refresh themselves.
const CACHE_NAME = "bckgeo-killswitch-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch { /* ignore */ }
    try {
      await self.registration.unregister();
    } catch { /* ignore */ }
    try {
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        try { client.navigate(client.url); } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  })());
});

// While this SW is briefly active, do not intercept fetches — let the network
// (and HTTP cache headers) handle them.
self.addEventListener("fetch", () => { /* no-op */ });
