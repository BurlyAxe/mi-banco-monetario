/**
 * Cliente HTTP del API. En desarrollo Vite hace proxy de /api al servidor
 * Express; en producción se apunta con VITE_API_URL.
 */
import { reportarFalloDeRed, reportarRespuesta } from './conexion';

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const LLAVE_TOKEN = 'mbm.token';
const LLAVE_USUARIO = 'mbm.usuario';

export const leerToken = () => localStorage.getItem(LLAVE_TOKEN);
export const guardarToken = (token) => localStorage.setItem(LLAVE_TOKEN, token);

/**
 * Cerrar sesión borra las dos cosas, siempre.
 *
 * El perfil guardado sin su token no sirve para nada —no abre ninguna
 * petición— y dejarlo suelto solo sirve para que la siguiente persona que use
 * el teléfono vea un nombre que no es el suyo.
 */
export const borrarToken = () => {
  localStorage.removeItem(LLAVE_TOKEN);
  localStorage.removeItem(LLAVE_USUARIO);
};

/**
 * Copia del perfil, para poder abrir la app sin señal.
 *
 * No es una caché de datos: los números siguen viniendo siempre del servidor y
 * sin conexión no se enseña ni uno. Esto contesta a otra pregunta, la de "¿de
 * quién es esta sesión?", y es la que hacía falta para no mandar a la pantalla
 * de acceso a alguien que ya entró. Sin ella, abrir la app instalada en el
 * metro te dejaba mirando un formulario de acceso que tampoco podía enviarse:
 * un callejón sin salida, y con toda la pinta de que la app se había roto y te
 * había cerrado la sesión.
 *
 * Aquí no va nada secreto —nombre y ajustes— y el token, que sí lo es, ya vive
 * en este mismo cajón.
 */
export const leerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem(LLAVE_USUARIO));
  } catch {
    // Un JSON a medias es basura de una versión anterior, no un error que
    // haya que contarle a nadie: se ignora y se revalida contra el servidor.
    return null;
  }
};

export const guardarUsuario = (usuario) =>
  localStorage.setItem(LLAVE_USUARIO, JSON.stringify(usuario));

export class ErrorApi extends Error {
  constructor(mensaje, estado, detalles) {
    super(mensaje);
    this.estado = estado;
    this.detalles = detalles;
  }
}

/**
 * @param {object}          cuerpo      Se manda como JSON.
 * @param {FormData}        formulario  Se manda tal cual (subida de archivos).
 * @param {AbortSignal}     signal      Para poder cancelar desde la pantalla.
 */
async function pedir(ruta, { metodo = 'GET', cuerpo, formulario, params, signal } = {}) {
  const url = new URL(`${BASE}${ruta}`, window.location.origin);
  for (const [clave, valor] of Object.entries(params || {})) {
    if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(clave, valor);
  }

  const token = leerToken();
  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: {
        // Con FormData el Content-Type lo pone el navegador: lleva el
        // "boundary" que separa las partes, y escribirlo a mano lo rompe.
        ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formulario || (cuerpo ? JSON.stringify(cuerpo) : undefined),
      signal,
    });
  } catch (err) {
    // Cancelar no es fallar: quien abortó ya sabe por qué y decide qué hacer.
    if (err.name === 'AbortError') throw err;
    // Aquí es donde se ve de verdad si hay línea. `navigator.onLine` se
    // conforma con que haya wifi; esto es una petición nuestra que no llegó.
    reportarFalloDeRed();
    throw new ErrorApi('No hay conexión con el servidor. Revisa tu internet.', 0);
  }

  // Contestó el servidor. Da igual con qué: un 500 es un problema del API, no
  // de la red, y dejar encendido el aviso de "sin conexión" señalaría al sitio
  // equivocado.
  reportarRespuesta();

  // Que la respuesta traiga 200 no significa que la haya escrito nuestro API.
  // Un despliegue mal configurado, un proxy o el wifi de una cafetería pueden
  // devolver una página HTML con 200 en lugar del JSON esperado. Dando eso por
  // bueno, `pedir` devolvía un objeto vacío y la app "iniciaba sesión" con un
  // token `undefined`: sin error, sin datos y con el botón trabado en
  // "Un momento…" para siempre. Es mucho mejor decir que algo no cuadra.
  const esJson = (respuesta.headers.get('content-type') || '').includes('application/json');
  const datos = esJson ? await respuesta.json().catch(() => null) : null;

  if (!respuesta.ok) {
    // 401 = el token murió: fuera, y que el contexto de sesión reaccione.
    if (respuesta.status === 401) borrarToken();
    throw new ErrorApi(datos?.error || 'Algo salió mal', respuesta.status, datos?.detalles);
  }

  if (!datos) {
    throw new ErrorApi(
      'El servidor no respondió lo que esperábamos. Revisa que la dirección del API sea la correcta.',
      respuesta.status,
    );
  }

  return datos;
}

export const api = {
  registro: (cuerpo) => pedir('/auth/registro', { metodo: 'POST', cuerpo }),
  login: (cuerpo) => pedir('/auth/login', { metodo: 'POST', cuerpo }),
  yo: () => pedir('/auth/yo'),
  guardarAjustes: (cuerpo) => pedir('/auth/ajustes', { metodo: 'PATCH', cuerpo }),

  resumen: (params) => pedir('/resumen', { params }),

  crearGasto: (cuerpo) => pedir('/gastos', { metodo: 'POST', cuerpo }),
  /**
   * Manda la foto de un ticket y devuelve un BORRADOR de gasto. No registra
   * nada: el alta sigue siendo `crearGasto`, cuando el usuario lo confirme.
   */
  leerTicket: (imagen, { hoy, signal } = {}) => {
    const formulario = new FormData();
    formulario.append('imagen', imagen, imagen.name || 'ticket.jpg');
    return pedir('/gastos/desde-ticket', { metodo: 'POST', formulario, params: { hoy }, signal });
  },
  // Corregir un movimiento: se manda solo { label, monto } y solo lo que cambió.
  editarGasto: (id, cuerpo) => pedir(`/gastos/${id}`, { metodo: 'PATCH', cuerpo }),
  borrarGasto: (id) => pedir(`/gastos/${id}`, { metodo: 'DELETE' }),

  crearIngreso: (cuerpo) => pedir('/ingresos', { metodo: 'POST', cuerpo }),
  editarIngreso: (id, cuerpo) => pedir(`/ingresos/${id}`, { metodo: 'PATCH', cuerpo }),
  borrarIngreso: (id) => pedir(`/ingresos/${id}`, { metodo: 'DELETE' }),

  // Calendario: la cuadrícula de un mes y el detalle de un día (00:00 a 23:59).
  calendario: (params) => pedir('/calendario', { params }),
  dia: (fecha) => pedir('/dia', { params: { fecha } }),

  // Chat de apoyo con Nivis.
  inicioChat: (params) => pedir('/nivis/inicio', { params }),
  chat: (cuerpo) => pedir('/nivis/chat', { metodo: 'POST', cuerpo }),
};
