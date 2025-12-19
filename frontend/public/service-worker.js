/* eslint-disable no-restricted-globals */

// Service Worker for IoT Dashboard PWA
// Provides offline support and caching for faster load times

const CACHE_NAME = 'iot-dashboard-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/static/css/main.css',
    '/static/js/main.js',
    '/manifest.json'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
            })
            .catch((err) => {
                console.warn('[SW] Cache installation failed:', err);
                // Don't fail installation if caching fails
                return Promise.resolve();
            })
    );

    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    // Claim all clients immediately
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip WebSocket and non-GET requests
    if (request.url.includes('/ws/') || request.method !== 'GET') {
        return;
    }

    // Skip API calls - always fetch fresh data
    if (request.url.includes('/api/')) {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    // Return a basic offline response for API calls
                    return new Response(
                        JSON.stringify({ error: 'offline', message: 'No network connection' }),
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                })
        );
        return;
    }

    // For all other requests: Network first, fallback to cache
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone the response before caching
                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(request)
                    .then((response) => {
                        if (response) {
                            console.log('[SW] Serving from cache:', request.url);
                            return response;
                        }

                        // If not in cache and offline, return offline page
                        return new Response(
                            '<h1>Offline</h1><p>You are currently offline and this page is not cached.</p>',
                            { headers: { 'Content-Type': 'text/html' } }
                        );
                    });
            })
    );
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-telemetry') {
        event.waitUntil(
            // Implement background sync logic here
            Promise.resolve()
        );
    }
});

// Push notification support (future enhancement)
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
    };

    event.waitUntil(
        self.registration.showNotification('IoT Dashboard', options)
    );
});
