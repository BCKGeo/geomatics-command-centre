const CACHE_NAME = "bckgeo-v6";
const PRECACHE = ["/", "/index.html"];

// Install: cache shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API calls, cache-first for assets
const API_HOSTS = new Set([
  "services.swpc.noaa.gov",
  "api.open-meteo.com",
  "api.weather.gc.ca",
  "celestrak-proxy.bckgeo.workers.dev",
  "api.bigdatacloud.net",
]);

const FONT_HOSTS = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and chrome-extension
  if (e.request.method !== "GET" || url.protocol === "chrome-extension:") return;

  // API calls: network-first with short cache fallback
  // (exact hostname match — previous .includes() would match attacker
  // domains like evil-workers.dev.example.com)
  if (API_HOSTS.has(url.hostname)) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Google Fonts: cache-first (long-lived)
  if (FONT_HOSTS.has(url.hostname)) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // App assets: cache-first, fallback to network
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
