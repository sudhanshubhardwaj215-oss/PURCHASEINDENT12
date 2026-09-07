// Simple service worker for Steelco Gujarat Ltd - Indent Approval Dashboard
// Enables "Add to Home Screen" / "Install App" on Android, iOS (Safari 16.4+), and desktop browsers.

const CACHE_NAME = "sgl-indent-cache-v1";
const APP_SHELL = [
  "./index (5).html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Install: cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for live data (Google Sheets / Apps Script calls),
// cache-first fallback for the app shell so it still opens offline.
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Never cache Google Sheets / Apps Script API calls - always go live
  if (url.includes("script.google.com") || url.includes("docs.google.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
