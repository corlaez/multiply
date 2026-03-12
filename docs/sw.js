self.addEventListener('install', (event) => {
  // This ensures the service worker is activated immediately and not wait until all tabs close
  self.skipWaiting();
});

const CACHE_NAME = 'multiplication-app-v1';

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetchAndCacheSuccess(event.request, cache)
        return cachedResponse || fetchPromise;
      });
    })
  );
});

function fetchAndCacheSuccess(request, cache) {
  return fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    return networkResponse;
  });
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  clients.claim();
});
