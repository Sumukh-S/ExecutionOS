const CACHE_NAME = "execution-os-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/tasks",
  "/calendar",
  "/focus",
  "/goals",
  "/weekly",
  "/monthly",
  "/eisenhower",
  "/analytics",
  "/dashboard",
  "/standards",
  "/backup",
  "/icon.svg",
  "/apple-icon.svg",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests for navigation and static assets
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Do NOT intercept or cache Supabase API calls or realtime websockets
  if (url.hostname.includes("supabase.co") || url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache hit, update cache in background (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => undefined);
        return cachedResponse;
      }

      // Network fallback
      return fetch(event.request).catch(() => {
        // Offline navigation fallback to root if navigation
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
