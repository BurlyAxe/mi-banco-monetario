/**
 * Lectura de un ticket, de punta a punta.
 *
 * Este servicio no sabe leer tickets: sabe en qué orden pedirle a cada quien
 * lo suyo y qué hacer cuando algo falla. Los cuatro pasos viven aparte y se
 * pueden cambiar por separado:
 *
 *   1. servicios/imagenes.js    ¿esto es de verdad una foto y está entera?
 *   2. servicios/categorias.js  ¿cuáles son las categorías de HOY?
 *   3. dominio/ticket.js        ¿qué se le pide al modelo y con qué forma?
 *   4. servicios/gemini.js      hablarlo con Google.
 *   5. esquemas.js + dominio    validar lo que volvió y traducirlo al dominio.
 *
 * Nada de esto registra un gasto. Lo que se devuelve es un borrador para que
 * el usuario lo revise; el alta sigue pasando por POST /gastos.
 */
import { env } from '../config/env.js';
import { ErrorHttp } from '../middleware/errores.js';
import { esquemaTicketIA } from '../esquemas.js';
import { aBorradorDeGasto, esquemaDeTicket, instruccionDeTicket } from '../dominio/ticket.js';
import { ErrorGemini, generarJson, geminiConfigurado, parteDeArchivo } from './gemini.js';
import { obtenerCategorias } from './categorias.js';
import { validarImagen } from './imagenes.js';

export const lectorDisponible = geminiConfigurado;

/**
 * Traduce una falla de Gemini al error que verá el usuario.
 *
 * El mensaje técnico se queda en la bitácora del servidor: a quien está
 * parado en la tienda con el ticket en la mano no le sirve saber que hubo un
 * 429, le sirve saber si vuelve a intentar o si mejor lo teclea a mano.
 */
function errorDeLectura(err) {
  if (!(err instanceof ErrorGemini)) return err;

  console.error('[gastos/desde-ticket]', err.message);

  if (err.agotado) {
    return new ErrorHttp(504, 'La lectura tardó demasiado. Prueba con una foto más nítida o anótalo a mano.');
  }
  if (err.estado === 429) {
    return new ErrorHttp(429, 'Se agotaron las lecturas de ticket por ahora. Intenta más tarde o anótalo a mano.');
  }
  if (err.estado === 400 || err.estado === 415) {
    return new ErrorHttp(400, 'No pudimos abrir esa foto. Vuelve a tomarla.');
  }
  return new ErrorHttp(502, 'El lector de tickets no está disponible en este momento. Anótalo a mano por ahora.');
}

/**
 * @param {{ buffer: Buffer, mimetype?: string }} archivo  La foto recibida.
 * @param {string} hoy  Fecha local del usuario "YYYY-MM-DD".
 * @returns {Promise<object>} Borrador de gasto con su confianza. Nunca se guarda solo.
 */
export async function leerTicket({ archivo, hoy }) {
  const imagen = validarImagen(archivo);

  if (!lectorDisponible()) {
    throw new ErrorHttp(503, 'La lectura de tickets no está configurada en este servidor.');
  }

  // Las categorías se piden ANTES de hablar con Gemini, y con ellas se arma el
  // enum: el modelo solo puede elegir entre las que existen de verdad.
  const categorias = await obtenerCategorias();

  let crudo;
  try {
    crudo = await generarJson({
      instruccion: instruccionDeTicket(categorias, hoy),
      partes: [
        parteDeArchivo(imagen.buffer, imagen.tipoMime),
        { text: 'Lee este ticket y devuelve el JSON del esquema.' },
      ],
      esquema: esquemaDeTicket(categorias),
      maxTokens: env.ticket.maxTokens,
      timeoutMs: env.ticket.timeoutMs,
    });
  } catch (err) {
    throw errorDeLectura(err);
  }

  const validado = esquemaTicketIA.safeParse(crudo);
  if (!validado.success) {
    console.error('[gastos/desde-ticket] respuesta fuera de esquema:', JSON.stringify(crudo));
    throw new ErrorHttp(502, 'La lectura llegó incompleta. Vuelve a intentarlo o anótalo a mano.');
  }

  return aBorradorDeGasto({ crudo: validado.data, categorias, hoy });
}
