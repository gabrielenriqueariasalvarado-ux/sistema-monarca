// ==========================================================================
// SERVICE WORKER - SISTEMA MONARCA PWA (OFFLINE FIRST & CACHE-BUSTING)
// ==========================================================================

const CACHE_NAME = 'emily-os-v11.43';

const STATIC_ASSETS = [
  './',
  'index.html',
  'style.css?v=11.43',
  'app.js',
  'js/core.js?v=11.43',
  'js/permisos.js?v=11.43',
  'js/perfil.js?v=11.43',
  'js/progresion.js?v=11.43',
  'js/estado-personal.js?v=11.43',
  'js/finanzas.js?v=11.43',
  'js/ideas.js?v=11.43',
  'js/mqtt-autopc.js?v=11.43',
  'js/dinamicas.js?v=11.43',
  'js/calendario.js?v=11.43',
  'js/inventario.js?v=11.43',
  'js/reproductor.js?v=11.43',
  'js/ia-monarca-tools.js?v=11.43',
  'js/ia.js?v=11.43',
  'js/jarvis-voz.js?v=11.43',
  'js/firebase-config.js?v=11.43',
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

  // Las consultas de versión nunca se cachean en Service Worker para evitar falsos positivos
  if (event.request.url.indexOf('version.json') !== -1 || event.request.url.indexOf('api.github.com') !== -1) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
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

// ==========================================================================
// MANEJADOR DE CLICS EN NOTIFICACIONES DE QUESTS, CALENDARIO Y SISTEMA
// ==========================================================================
self.addEventListener('notificationclick', function(event) {
    var notifData = (event.notification && event.notification.data) ? event.notification.data : {};
    var accion = event.action || 'tap';
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                try {
                    client.postMessage({
                        type: 'MONARCA_NOTIF_ACTION',
                        actionId: accion,
                        extra: notifData
                    });
                } catch(e) {}
                if (accion !== 'okey' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (accion !== 'okey' && clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});
