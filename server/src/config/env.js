import 'dotenv/config';

/**
 * Variables que en producción se quedaron sin poner y acabaron tirando del
 * valor de desarrollo.
 *
 * Existe porque esa caída es silenciosa y cara. `MONGODB_URI` sin poner no
 * daba un error al arrancar: dejaba el servidor apuntando a localhost, donde
 * no hay ninguna base, y el sitio publicado contestaba a cada intento de
 * entrar con un "no se pudo conectar" que parecía un problema de red o de
 * permisos de Atlas. Se perdió más de un rato buscando en el sitio equivocado.
 *
 * Y `JWT_SECRET` sin poner es peor que una avería: firma las sesiones con una
 * cadena que está escrita en el repositorio, o sea a la vista de cualquiera
 * que sepa leer. Por eso no se calla y por eso `autenticar` se niega a usarla.
 */
const faltantes = [];

const requerido = (clave, porDefecto) => {
  const valor = process.env[clave];
  if (valor !== undefined && valor !== '') return valor;

  // En producción no existe el "valor por defecto razonable": apuntar a
  // localhost o firmar con un secreto público no es un default, es una avería
  // que además no se ve. Se anota para poder contarla.
  if (process.env.NODE_ENV === 'production') faltantes.push(clave);

  if (porDefecto === undefined || porDefecto === '') {
    throw new Error(`Falta la variable de entorno ${clave}. Copia server/.env.example a server/.env.`);
  }
  return porDefecto;
};

/** Qué falta por configurar. Vacío = todo en su sitio. */
export const faltanVariables = () => [...faltantes];

export const env = {
  puerto: Number(process.env.PORT || 4000),
  entorno: process.env.NODE_ENV || 'development',
  mongoUri: requerido('MONGODB_URI', 'mongodb://127.0.0.1:27017/mi-banco-monetario'),
  jwtSecret: requerido('JWT_SECRET', 'secreto-de-desarrollo-no-usar-en-produccion'),
  jwtExpiraEn: process.env.JWT_EXPIRES_IN || '30d',
  origenesCors: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  /**
   * Gemini, el motor del chat de apoyo. Es OPCIONAL a propósito: sin llave la
   * app arranca igual y Nivis responde con el plan que calcula el servidor con
   * tus propios números (ver dominio/asesor.js). Nunca se rompe por esto.
   */
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    // Alias que sigue apuntando al flash más reciente sin tener que tocar código.
    modelo: process.env.GEMINI_MODEL || 'gemini-flash-latest',
    urlBase: (process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, ''),
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS || 25000),
    /**
     * Los modelos flash actuales razonan antes de contestar, y esos tokens de
     * pensamiento SALEN DE ESTE MISMO TOPE. Medido contra la API real, una
     * respuesta del chat se gasta ~650 pensando: con 900 el modelo termina en
     * MAX_TOKENS sin haber escrito una sola palabra. 2500 deja margen de sobra.
     */
    maxTokens: Number(process.env.GEMINI_MAX_TOKENS || 2500),
  },

  /**
   * Lectura de tickets con la cámara.
   *
   * El tope de 4.5 MB no es capricho: es el límite de cuerpo que aceptan las
   * funciones serverless donde suele vivir este API (Vercel, Netlify). Si el
   * archivo pasa de ahí, la petición muere ANTES de llegar a nuestro código y
   * el usuario ve un error genérico que no explica nada. Rechazarlo aquí, con
   * un mensaje claro, es mucho mejor que dejarlo reventar allá arriba.
   */
  ticket: {
    maxBytes: Number(process.env.TICKET_MAX_BYTES || 4.5 * 1024 * 1024),
    /**
     * Un ticket es texto: casi todo el presupuesto se va en leerlo, no en
     * redactar. Aun así el flash razona antes de contestar y esos tokens salen
     * del mismo tope, así que se le deja el mismo margen que al chat.
     */
    maxTokens: Number(process.env.TICKET_MAX_TOKENS || 2500),
    /**
     * Leer una foto tarda más que contestar un mensaje: la imagen viaja a
     * Google y el modelo la procesa entera antes de escribir la primera letra.
     */
    timeoutMs: Number(process.env.TICKET_TIMEOUT_MS || 45000),
  },
};

export const esProduccion = env.entorno === 'production';
