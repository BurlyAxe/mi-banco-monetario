/**
 * ¿Hay conexión de verdad?
 *
 * La app instalada se abre sin barra de navegador, así que el usuario no tiene
 * dónde ver que la página no cargó: sin este aviso, quedarse sin señal se veía
 * igual que la app rota. Todo lo que se enseña —saldo, veredicto, movimientos—
 * viene del servidor y a propósito no se cachea, así que saber si hay línea no
 * es un adorno, es la diferencia entre "no funciona" y "ahorita no se puede".
 *
 * `navigator.onLine` sirve de poco por sí solo: dice que sí en cuanto hay wifi,
 * aunque ese wifi sea el de un café que todavía no te ha dejado pasar por su
 * pantalla de bienvenida. Solo es de fiar cuando dice que NO. Por eso se
 * combina con lo que de verdad importa —si nuestras peticiones llegan o no— y
 * es `lib/api.js` quien lo cuenta desde donde se ve la verdad.
 */

let sinRed = false;
let fallo = false;
const suscriptores = new Set();

const avisar = () => suscriptores.forEach((fn) => fn());

/** Se avisa solo si el estado cambió: si no, cada petición repintaría la app. */
const cambiar = (clave, valor) => {
  if (clave === 'sinRed' && sinRed !== valor) {
    sinRed = valor;
    avisar();
  }
  if (clave === 'fallo' && fallo !== valor) {
    fallo = valor;
    avisar();
  }
};

export function iniciarConexion() {
  // El navegador dice que no hay red: eso siempre es cierto.
  window.addEventListener('offline', () => cambiar('sinRed', true));
  // Que diga que volvió es solo una pista. Se le cree para quitar el aviso,
  // porque la siguiente petición que falle lo volverá a encender enseguida.
  window.addEventListener('online', () => {
    cambiar('sinRed', false);
    cambiar('fallo', false);
  });

  sinRed = navigator.onLine === false;
}

/** Una petición no llegó al servidor. Lo llama `pedir` en lib/api.js. */
export const reportarFalloDeRed = () => cambiar('fallo', true);

/** Una petición sí llegó: haya lo que haya dicho el navegador, hay línea. */
export const reportarRespuesta = () => {
  cambiar('fallo', false);
  cambiar('sinRed', false);
};

export const suscribirse = (fn) => {
  suscriptores.add(fn);
  return () => suscriptores.delete(fn);
};

/** Para `useSyncExternalStore`: devuelve el mismo booleano mientras no cambie. */
export const hayConexion = () => !sinRed && !fallo;
