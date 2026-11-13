const CACHE_NAME = 'karaoke-upds-v7';
const ARCHIVOS = ['./', './index.html', './styles.css', './script.js', './manifest.json', './data/canciones.json', './img/logo.png'];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ARCHIVOS)));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
