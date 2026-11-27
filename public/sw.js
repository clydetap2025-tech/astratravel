// AstraTravel service worker: the app shell works offline after the first visit.
// Everything is network-first, so a deploy (new bundle, new or replaced photos under the same name)
// shows up at once; the cache is only the offline fallback. The API is never cached.
// Bump CACHE when cached files must be dropped on every device (old photos, old bundle).
const CACHE = "astratravel-v8";
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
  const key = request.mode === "navigate" ? "/" : request;
  const keep = request.mode === "navigate" || SHELL.includes(url.pathname) || url.pathname.startsWith("/assets/");
  event.respondWith(fetch(request).then((response) => {
    if (response.ok && keep) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(key, copy));
    }
    return response;
  }).catch(() => caches.match(key)));
});
