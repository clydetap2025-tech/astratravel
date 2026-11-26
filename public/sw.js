// AstraTravel service worker: the app shell works offline after the first visit.
// Pages and the app bundle are network-first so a deploy shows up at once; images and fonts are
// cache-first. The API is never cached.
const CACHE = "astratravel-v6";
const SHELL = ["/", "/app.js", "/styles.css", "/theme.js", "/manifest.webmanifest", "/assets/astratravel.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  const fresh = request.mode === "navigate" || ["/app.js", "/styles.css", "/"].includes(url.pathname);
  if (fresh) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request.mode === "navigate" ? "/" : request, response.clone()));
      return response;
    }).catch(() => caches.match(request.mode === "navigate" ? "/" : request)));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && url.pathname.startsWith("/assets/")) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  })));
});
