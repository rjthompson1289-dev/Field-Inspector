// Field Inspector — Service Worker
// Cache name — bump this string any time you push an update
// so all devices pick up the new version automatically
const CACHE_NAME = 'field-inspector-v1';

const APP_SHELL = [
  './',
  './index.html'
];

// ── Install: cache the app shell ──────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL).catch(function() {
        // First load offline — can't pre-cache, that's OK
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting(); // activate immediately without waiting for old SW to die
});

// ── Activate: clean up old cache versions ────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return k !== CACHE_NAME; })
          .map(function(k)    { return caches.delete(k); })
      );
    })
  );
  self.clients.claim(); // take control of all open tabs immediately
});

// ── Fetch: cache-first strategy ───────────────────────
// Serve from cache if available, otherwise fetch from network
// and cache the response for next time.
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;

      return fetch(e.request).then(function(response) {
        // Cache valid responses for future offline use
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Offline and not in cache — return the app shell as fallback
        return caches.match('./') || caches.match('./index.html');
      });
    })
  );
});
