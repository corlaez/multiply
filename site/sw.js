// Fetch: Serve from cache, ignore network when offline
self.addEventListener('fetch', (event) => {
    // Check if this is a navigation request (a browser "page load")
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('/index.html').then((response) => {
                // If found in cache, return it. 
                // If NOT found (e.g., first visit offline), hit the network.
                return response || fetch(event.request);
            })
        );
    } else {
        // For JS/CSS/Images, keep your original Cache-First logic
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
    }
});
