// Wealth PWA service worker.
// Strategy: never touch API/auth/data traffic (those must always hit the
// network live); only cache the static app shell so the app opens instantly
// and still launches when briefly offline. Bump CACHE_VERSION to force clients
// onto a fresh shell after a deploy.
const CACHE_VERSION = "wealth-shell-v1";
const OFFLINE_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only handle our own origin. Firebase, Google auth, GREEN-API, fonts, etc.
  // are cross-origin and must always go straight to the network.
  if (url.origin !== self.location.origin) return;

  // Never cache the backend API — reminders/status/auth must be live.
  if (url.pathname.startsWith("/api/")) return;

  // App navigations: network-first, fall back to the cached shell when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put("/", copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match("/", { ignoreSearch: true }).then((r) => r || Response.error()))
    );
    return;
  }

  // Static build assets (hashed JS/CSS/icons): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
