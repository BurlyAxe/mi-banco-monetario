/**
 * El service worker y las versiones nuevas de la app.
 *
 * Instalada en la pantalla de inicio, la app no tiene botón de recargar: quien
 * la abre así se queda con la versión que tenía hasta que el navegador decida
 * lo contrario. Y el worker nuevo, por su parte, no se activa mientras haya una
 * pestaña usando el viejo. Sin nadie que junte las dos cosas, un arreglo
 * publicado hoy podía tardar días en llegarle a quien más usa la app.
 *
 * Así que se avisa y se deja elegir. Tomar el relevo a la fuerza —`skipWaiting`
 * en cuanto se instala— tampoco vale: el worker nuevo borra al activarse la
 * caché de la versión anterior, y hacerlo mientras alguien está a media captura
 * de un gasto es cambiarle el suelo bajo los pies.
 */

let registro = null;
let esperando = null;
let recargando = false;
const suscriptores = new Set();

const avisar = () => suscriptores.forEach((fn) => fn());

/**
 * ¿Había ya un worker al arrancar?
 *
 * Se mira ANTES de registrar nada, y es la respuesta a "¿esto es una versión
 * nueva o es la primera vez?". En la primera visita el worker se activa y
 * reclama la página él solo; sin esta marca, esa activación se confundiría con
 * una actualización y la app se recargaría sola nada más abrirla por primera
 * vez.
 */
const habiaControlador = Boolean(navigator.serviceWorker?.controller);

const marcar = (trabajador) => {
  esperando = trabajador;
  avisar();
};

export function iniciarActualizacion() {
  // En desarrollo el worker estorba: cachea la cáscara y tapa los cambios en
  // caliente de Vite.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Solo cuenta como relevo si había alguien a quien relevar.
    if (!habiaControlador || recargando) return;
    recargando = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registro = reg;

        // Ya estaba esperando de una visita anterior que se cerró sin aceptar.
        if (reg.waiting && habiaControlador) marcar(reg.waiting);

        reg.addEventListener('updatefound', () => {
          const nuevo = reg.installing;
          if (!nuevo) return;
          nuevo.addEventListener('statechange', () => {
            // 'installed' con un controlador ya presente = hay versión nueva
            // lista y esperando turno. Sin controlador es la primera visita.
            if (nuevo.state === 'installed' && navigator.serviceWorker.controller) marcar(nuevo);
          });
        });
      })
      .catch(() => {
        /* sin service worker la app sigue funcionando, solo pierde el modo offline */
      });
  });

  // Una app instalada puede pasar semanas abierta en segundo plano. Cada vez
  // que vuelve al frente se pregunta si hay algo nuevo, que es justo cuando el
  // usuario está mirando y el aviso le sirve de algo.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') registro?.update().catch(() => {});
  });
}

export const suscribirse = (fn) => {
  suscriptores.add(fn);
  return () => suscriptores.delete(fn);
};

/** Para `useSyncExternalStore`: ¿hay una versión lista esperando turno? */
export const hayActualizacion = () => esperando !== null;

/**
 * El usuario acepta: el worker nuevo toma el relevo y `controllerchange`
 * recarga la página con la versión recién activada.
 */
export function aplicarActualizacion() {
  if (!esperando) return;
  esperando.postMessage('SKIP_WAITING');
  esperando = null;
  avisar();
}
