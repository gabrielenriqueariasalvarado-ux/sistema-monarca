// ==========================================================================
// SERVICE WORKER - SISTEMA MONARCA PWA (OFFLINE FIRST & CACHE-BUSTING)
// ==========================================================================

const CACHE_NAME = 'sistema-monarca-v5.8';

const STATIC_ASSETS = [
  './',
  'index.html',
  'style.css?v=5.8',
  'app.js',
  'js/core.js?v=5.8',
  'js/perfil.js?v=5.8',
  'js/progresion.js?v=5.8',
  'js/estado-personal.js?v=5.8',
  'js/finanzas.js?v=5.8',
  'js/ideas.js?v=5.8',
  'js/dinamicas.js?v=5.8',
  'js/calendario.js?v=5.8',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

// Instalación: Precarga de recursos estáticos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Advertencia en precarga parcial:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activación: Purga obligatoria de todas las cachés anteriores y control inmediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[Service Worker] Purgando caché antigua:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de solicitudes de red (Estrategia: Network-First con fallback a Caché)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('index.html') || caches.match('./');
          }
        });
      })
  );
});
