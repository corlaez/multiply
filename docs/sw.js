self.addEventListener('install', (event) => {
  // This ensures the service worker is activated immediately
  self.skipWaiting();
});

const CACHE_NAME = 'multiplication-app-v1';

self.addEventListener('fetch', (event) => {
    event.respondWith(caches.match(event.request).then((res) => res || fetchAndCacheSuccess(event.request)));
});

function fetchAndCacheSuccess(request) {
    return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
            });
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
