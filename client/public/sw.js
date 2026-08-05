/**
 * Service worker mínimo: deja la cáscara de la app disponible sin conexión.
 *
 * A propósito NO cachea /api: los movimientos y el veredicto deben venir
 * siempre del servidor, y una respuesta vieja aquí sería peor que un error.
 */
const CACHE = 'mbm-cascara-v1';
const ESENCIALES = ['/', '/index.html', '/manifest.webmanifest', '/nivis.svg'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESENCIALES)));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((llaves) => Promise.all(llaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);
  if (evento.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  // Navegación: red primero, cáscara cacheada como respaldo si no hay señal.
  if (evento.request.mode === 'navigate') {
    evento.respondWith(fetch(evento.request).catch(() => caches.match('/index.html')));
    return;
  }

  evento.respondWith(
    caches.match(evento.request).then(
      (guardada) =>
        guardada ||
        fetch(evento.request).then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE).then((c) => c.put(evento.request, copia));
          }
          return respuesta;
        }),
    ),
  );
});
