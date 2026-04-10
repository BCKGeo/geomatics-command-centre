const CACHE_NAME = "bckgeo-v5";
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
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and chrome-extension
  if (e.request.method !== "GET" || url.protocol === "chrome-extension:") return;

  // API calls: network-first with short cache fallback
  if (
    url.hostname.includes("swpc.noaa.gov") ||
    url.hostname.includes("open-meteo.com") ||
    url.hostname.includes("weather.gc.ca") ||
    url.hostname.includes("workers.dev") ||
    url.hostname.includes("bigdatacloud.net")
  ) {
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
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
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
