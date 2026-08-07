/**
 * Instalar la app en la pantalla de inicio.
 *
 * El navegador avisa de que la app se puede instalar con `beforeinstallprompt`,
 * y ese evento llega CUANDO ÉL QUIERE: casi siempre antes de que React haya
 * montado un solo componente. Por eso el oyente se registra aquí, en un módulo
 * que se importa desde main.jsx antes de pintar nada, y no dentro de un
 * `useEffect` que llegaría tarde. Lo que se guarda es el evento, porque es el
 * único objeto capaz de abrir el diálogo del sistema y solo sirve una vez.
 *
 * En iOS este evento no existe y no hay forma de abrir ese diálogo desde la
 * web: Safari obliga a pasar por Compartir → Añadir a inicio. Así que ahí no se
 * promete un botón que no funciona, se explica el camino.
 */

const LLAVE_RECHAZO = 'mbm.instalacion-rechazada';

let evento = null;
let instalada = false;
const suscriptores = new Set();

const avisar = () => suscriptores.forEach((fn) => fn());

/** ¿La app ya se está viendo instalada, fuera del navegador? */
export const enModoApp = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  // El de siempre en iOS, que nunca implementó display-mode.
  window.navigator.standalone === true;

const esIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS se hace pasar por Mac; el táctil lo delata.
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Safari es el único navegador de iOS que puede instalar a la pantalla de inicio. */
const esSafari = () => /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);

export function iniciarInstalacion() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Sin esto Chrome pinta su propia barra abajo, que tapa los botones
    // flotantes justo donde está el pulgar.
    e.preventDefault();
    evento = e;
    avisar();
  });

  window.addEventListener('appinstalled', () => {
    instalada = true;
    evento = null;
    // Ya no hay nada que ofrecer, y si algún día la desinstala volverá a
    // llegar `beforeinstallprompt` solo.
    localStorage.removeItem(LLAVE_RECHAZO);
    avisar();
  });
}

export const suscribirse = (fn) => {
  suscriptores.add(fn);
  return () => suscriptores.delete(fn);
};

/**
 * Qué se le puede ofrecer al usuario ahora mismo:
 *   'boton'         → hay evento guardado; un toque y lo instala.
 *   'instruccionesIOS' → no hay diálogo posible, toca explicarlo.
 *   null            → ya está instalada, no se puede, o ya dijo que no.
 */
export function estadoDeInstalacion() {
  if (instalada || enModoApp()) return null;
  if (localStorage.getItem(LLAVE_RECHAZO)) return null;
  if (evento) return 'boton';
  if (esIOS() && esSafari()) return 'instruccionesIOS';
  return null;
}

/**
 * Abre el diálogo del sistema. Devuelve si aceptó.
 *
 * El evento se suelta pase lo que pase: ya está gastado y volver a usarlo tira
 * una excepción. Si dijo que no, el navegador mandará otro más adelante.
 */
export async function pedirInstalacion() {
  if (!evento) return false;
  const actual = evento;
  evento = null;
  actual.prompt();
  const { outcome } = await actual.userChoice;
  if (outcome !== 'accepted') avisar();
  return outcome === 'accepted';
}

/** El usuario cerró el aviso: no se le vuelve a enseñar hasta que él quiera. */
export function rechazarInstalacion() {
  localStorage.setItem(LLAVE_RECHAZO, '1');
  avisar();
}
