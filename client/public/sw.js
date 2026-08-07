/**
 * Service worker: deja la cáscara de la app disponible sin conexión.
 *
 * A propósito NO cachea /api: los movimientos y el veredicto deben venir
 * siempre del servidor, y una respuesta vieja aquí sería peor que un error.
 * Una app de dinero que te enseña el saldo de anteayer como si fuera el de hoy
 * miente, y mentir sobre el saldo es el único fallo que no se perdona. Lo que
 * hace la app cuando no hay señal es DECIRLO —eso vive en `lib/conexion.js`—
 * en vez de inventarse números.
 *
 * Cada tipo de recurso se sirve como le corresponde:
 *
 *   navegación   → red primero, cáscara guardada como respaldo. Estando en
 *                  línea siempre se ve el despliegue más reciente.
 *   /assets/*    → caché primero, sin caducidad. Vite les mete un hash en el
 *                  nombre, así que un archivo con ese nombre no cambia jamás:
 *                  al publicar una versión nueva cambian los nombres, no el
 *                  contenido de los viejos.
 *   lo demás del sitio → se sirve lo guardado y se revalida por detrás. Aquí
 *                  viven el manifiesto y los iconos, que SÍ cambian sin cambiar
 *                  de nombre; antes eran caché-primero y para siempre, así que
 *                  arreglar el manifiesto no le llegaba nunca a quien ya había
 *                  entrado una vez.
 *   fuentes      → igual, pero en una caché aparte que sobrevive a las
 *                  versiones: pesan y no cambian, no hay por qué volver a
 *                  bajarlas en cada despliegue.
 */

const VERSION = 'v4';
const CASCARA = `mbm-cascara-${VERSION}`;
const ESTATICOS = `mbm-estaticos-${VERSION}`;
// Sin versión en el nombre: las fuentes no dependen de nuestros despliegues.
const FUENTES = 'mbm-fuentes';

const MIAS = [CASCARA, ESTATICOS, FUENTES];

const ESENCIALES = [
  '/manifest.webmanifest',
  '/nivis.svg',
  '/iconos/icono-192.png',
  '/iconos/icono-512.png',
  '/iconos/apple-touch-icon.png',
];

const ORIGENES_DE_FUENTES = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

/** Las rutas con hash que menciona un index.html. */
const assetsDe = (html) => [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))];

/**
 * Guarda la cáscara y, con ella, el JavaScript y el CSS que necesita.
 *
 * Lo segundo no es un extra: en la primera visita el service worker todavía no
 * controla la página, así que los `/assets/…` que el navegador pidió para
 * pintarla no pasaron por aquí y no quedaron guardados. Quien instalaba la app
 * y cerraba el navegador antes de volver a entrar se encontraba una pantalla en
 * blanco la primera vez que la abría sin señal: el index.html estaba, pero el
 * archivo que lo hace funcionar no. Por eso se lee el HTML recién bajado y se
 * precargan las rutas con hash que menciona.
 *
 * Nada de esto aborta la instalación si falla: `allSettled` y no `all`, porque
 * guardar tres de cuatro cosas es infinitamente mejor que no guardar ninguna.
 */
async function precargar() {
  const cascara = await caches.open(CASCARA);
  await Promise.allSettled(ESENCIALES.map((ruta) => cascara.add(ruta)));

  try {
    // `cache: 'reload'` para saltarse la caché HTTP del navegador: si aquí se
    // colara el index.html anterior, se precargarían los assets de la versión
    // vieja y esta instalación no habría servido de nada.
    const respuesta = await fetch('/index.html', { cache: 'reload' });
    if (!respuesta.ok) return;

    // Las dos rutas por las que se entra al sitio apuntan al mismo documento.
    await cascara.put('/index.html', respuesta.clone());
    await cascara.put('/', respuesta.clone());

    const estaticos = await caches.open(ESTATICOS);
    await Promise.allSettled(assetsDe(await respuesta.text()).map((ruta) => estaticos.add(ruta)));
  } catch {
    /* sin red durante la instalación: se reintenta en la siguiente visita */
  }
}

/**
 * Tira los assets que ya no usa nadie.
 *
 * Como llevan un hash en el nombre, cada publicación estrena archivos en vez de
 * pisar los de antes: sin barrer, la caché se queda con el JavaScript de todas
 * las versiones que ha visto ese teléfono, y solo se vacía el día que alguien
 * se acuerde de subir VERSION a mano. Eso no es un plan, es una apuesta.
 *
 * Se hace al activar y no al instalar a propósito: mientras el worker nuevo
 * espera turno hay una pestaña usando la versión anterior, y quitarle sus
 * archivos de debajo no arregla nada. Al activar, en cambio, la página se
 * recarga acto seguido.
 */
async function barrerEstaticos() {
  const cascara = await caches.open(CASCARA);
  const index = await buscar(cascara, '/index.html', true);
  if (!index) return;

  const vigentes = new Set(assetsDe(await index.text()));
  if (!vigentes.size) return;

  const estaticos = await caches.open(ESTATICOS);
  for (const peticion of await estaticos.keys()) {
    if (!vigentes.has(new URL(peticion.url).pathname)) await estaticos.delete(peticion);
  }
}

self.addEventListener('install', (evento) => {
  evento.waitUntil(precargar());
  // Nada de `skipWaiting()` aquí: ver el comentario del mensaje SKIP_WAITING.
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((llaves) => Promise.all(llaves.filter((k) => !MIAS.includes(k)).map((k) => caches.delete(k))))
      .then(barrerEstaticos)
      .then(() => self.clients.claim()),
  );
});

/**
 * El relevo lo pide la página, no se toma solo.
 *
 * Activarse a la fuerza en cuanto se instala —lo que hacía `skipWaiting()` en
 * el install— significa cambiar el suelo bajo los pies de una pestaña abierta:
 * el `activate` borra la caché de la versión anterior mientras alguien la está
 * usando. Ahora el worker nuevo espera, la app avisa con "hay una versión
 * nueva" y solo cuando el usuario acepta se manda este mensaje y se recarga.
 */
self.addEventListener('message', (evento) => {
  if (evento.data === 'SKIP_WAITING') self.skipWaiting();
});

/**
 * Pone al día la cáscara con el index.html que acaba de cargar de verdad.
 *
 * Sin esto, lo guardado se congelaba en la versión del día de la instalación:
 * el worker solo vuelve a instalarse cuando cambia el propio sw.js, y una
 * publicación normal —que solo toca el código de la app— no lo cambia. En línea
 * no se notaba, porque la navegación va a la red primero; pero el mismo
 * teléfono, sin señal, seguía abriendo la app de hace meses y apuntando a unos
 * assets viejos que además nadie borraba nunca. Ahora cada carga buena deja el
 * respaldo igual de nuevo que lo que se está viendo.
 */
async function guardarCascara(respuesta) {
  const cascara = await caches.open(CASCARA);
  await cascara.put('/index.html', respuesta.clone());
  await cascara.put('/', respuesta.clone());
  await barrerEstaticos();
}

/**
 * Buscar en la caché sin que `Vary` estorbe.
 *
 * El servidor manda `Vary: Origin` en los archivos estáticos —Vercel y el
 * `vite preview` de casa, los dos— y eso le dice a la caché que una respuesta
 * solo vale para peticiones con el mismo `Origin`. Pero por aquí una misma URL
 * se guarda y se busca desde sitios distintos: el `add()` de la precarga, la
 * petición del `<script>` de la página, el barrido que abre el index guardado.
 * No todas llevan la misma cabecera, así que la búsqueda encuentra o no
 * encuentra según quién lo guardara — y un fallo así solo se nota sin red, que
 * es cuando ya no hay a qué recurrir.
 *
 * Medido, no supuesto: el mismo `match` sobre la misma entrada falla sin esto y
 * acierta con esto.
 *
 * Se ignora a conciencia y solo para lo nuestro: son archivos con hash en el
 * nombre, la URL ya determina el contenido byte a byte y no hay ninguna
 * variante que distinguir. Para las fuentes de Google no se ignora, que ahí
 * `Vary` sí significa algo (mandan un CSS distinto según el navegador).
 */
const buscar = (cache, peticion, ignorarVary) =>
  cache.match(peticion, ignorarVary ? { ignoreVary: true } : undefined);

/** Caché primero: lo guardado se devuelve sin tocar la red. */
async function deLaCache(peticion, nombre) {
  const cache = await caches.open(nombre);
  const guardada = await buscar(cache, peticion, true);
  if (guardada) return guardada;

  const respuesta = await fetch(peticion);
  if (respuesta.ok) cache.put(peticion, respuesta.clone());
  return respuesta;
}

/**
 * Se devuelve lo guardado al instante y se pide la versión nueva por detrás,
 * que quedará lista para la próxima vez. Si no hay nada guardado, se espera a
 * la red como en cualquier petición normal.
 */
async function revalidando(peticion, nombre, evento) {
  const cache = await caches.open(nombre);
  const guardada = await buscar(cache, peticion, nombre !== FUENTES);

  const enRed = fetch(peticion)
    .then((respuesta) => {
      // Las respuestas opacas (fuentes pedidas sin CORS) no dejan mirar el
      // estado, pero sirven igual para pintar la página.
      if (respuesta.ok || respuesta.type === 'opaque') cache.put(peticion, respuesta.clone());
      return respuesta;
    })
    .catch(() => null);

  if (guardada) {
    // Sin esto el navegador puede matar al worker en cuanto se responde, y la
    // revalidación se quedaría a medias para siempre.
    evento.waitUntil(enRed);
    return guardada;
  }

  return (await enRed) || Response.error();
}

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);

  if (ORIGENES_DE_FUENTES.includes(url.origin)) {
    evento.respondWith(revalidando(peticion, FUENTES, evento));
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;
  // El propio worker se pide siempre a la red: cachearlo es la forma más
  // eficaz de no volver a publicar una actualización nunca.
  if (url.pathname === '/sw.js') return;

  // Navegación: red primero, cáscara guardada como respaldo si no hay señal.
  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          // Y de paso se apunta lo que acaba de cargar bien.
          if (respuesta.ok) evento.waitUntil(guardarCascara(respuesta.clone()));
          return respuesta;
        })
        .catch(async () => {
          // `caches.match` devuelve undefined cuando no hay nada guardado, y
          // responder undefined desde aquí rompe la navegación con un error del
          // navegador. Si de plano no hay cáscara, se dice que falló la red, que
          // es la verdad y lo que el navegador sabe explicar.
          const guardadas = await caches.open(CASCARA);
          const cascara =
            (await buscar(guardadas, '/index.html', true)) || (await buscar(guardadas, '/', true));
          return cascara || Response.error();
        }),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    evento.respondWith(deLaCache(peticion, ESTATICOS));
    return;
  }

  evento.respondWith(revalidando(peticion, CASCARA, evento));
});
