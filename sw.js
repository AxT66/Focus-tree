const CACHE_NAME = 'bank-war-mode-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.html',
    './css/styles.css',
    './js/db.js',
    './js/app.js',
    './js/subjects.js',
    './js/topics.js',
    './js/study.js',
    './js/streak.js',
    './js/battlePlan.js',
    './js/mockTests.js',
    './js/focusMode.js',
    './js/futureSelf.js',
    './js/analytics.js',
    './js/backup.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
