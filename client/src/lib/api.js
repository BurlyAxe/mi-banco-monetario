/**
 * Cliente HTTP del API. En desarrollo Vite hace proxy de /api al servidor
 * Express; en producción se apunta con VITE_API_URL.
 */
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const LLAVE_TOKEN = 'mbm.token';

export const leerToken = () => localStorage.getItem(LLAVE_TOKEN);
export const guardarToken = (token) => localStorage.setItem(LLAVE_TOKEN, token);
export const borrarToken = () => localStorage.removeItem(LLAVE_TOKEN);

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
    throw new ErrorApi('No hay conexión con el servidor. Revisa tu internet.', 0);
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    // 401 = el token murió: fuera, y que el contexto de sesión reaccione.
    if (respuesta.status === 401) borrarToken();
    throw new ErrorApi(datos.error || 'Algo salió mal', respuesta.status, datos.detalles);
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
