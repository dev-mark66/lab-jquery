const CACHE_NAME = 'karaoke-upds-v8'; // Sube el número cada vez que subas cambios
const ARCHIVOS = ['./', './index.html', './styles.css', './script.js', './manifest.json', './data/canciones.json', './img/logo.png'];

// 1. INSTALACIÓN: Guarda los archivos nuevos
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Fuerza al SW nuevo a instalarse de inmediato
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ARCHIVOS)));
});

// 2. ACTIVACIÓN: Borra el caché viejo y toma el control
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key)) // Elimina versiones viejas
            );
        }).then(() => self.clients.claim()) // Toma el control de las pestañas abiertas
    );
});

// 3. FETCH: Primero busca en internet (para tener lo último), si falla usa caché
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Si hay internet, guarda la nueva versión en caché
                if(response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return response;
            })
            .catch(() => caches.match(event.request)) // Si no hay internet, usa el caché
    );
});
