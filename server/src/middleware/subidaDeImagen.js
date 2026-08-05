/**
 * Recepción del archivo: convierte un `multipart/form-data` en un buffer en
 * memoria y traduce las fallas de multer a errores nuestros.
 *
 * En memoria y no en disco a propósito: la foto se manda a Gemini y se tira.
 * Guardarla en el servidor obligaría a limpiarla después y dejaría copias del
 * ticket de alguien en un disco, que es exactamente lo que no queremos.
 *
 * Los mensajes de multer están en inglés y hablan de "field names" y "limits".
 * Aquí se cambian por algo que un usuario pueda leer sin saber qué es multer.
 */
import multer from 'multer';

import { env } from '../config/env.js';
import { ErrorHttp } from './errores.js';
import { TIPOS_ACEPTADOS, megas } from '../servicios/imagenes.js';

/** Nombre del campo del formulario. El cliente manda `imagen`. */
export const CAMPO_IMAGEN = 'imagen';

const subida = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.ticket.maxBytes,
    files: 1,
    // La petición no lleva más campos que el archivo: cerrar la puerta al
    // resto evita que alguien engorde el cuerpo con texto que nadie va a leer.
    fields: 2,
  },
  /**
   * Primer filtro, por el tipo que declara el navegador. Es barato y corta la
   * subida antes de tragarse megas, pero NO es la validación de verdad: el
   * cliente puede mentir. Los bytes se revisan luego en servicios/imagenes.js.
   */
  fileFilter: (_req, archivo, cb) => {
    if (TIPOS_ACEPTADOS.includes(archivo.mimetype)) return cb(null, true);
    cb(new ErrorHttp(400, 'Ese archivo no es una foto. Usa la cámara o elige una imagen.'));
  },
}).single(CAMPO_IMAGEN);

/** Traduce el código de multer al error HTTP que verá el frontend. */
const errorDeSubida = (err) => {
  if (err instanceof ErrorHttp) return err;

  if (err.code === 'LIMIT_FILE_SIZE') {
    return new ErrorHttp(
      413,
      `La foto pesa más de ${megas(env.ticket.maxBytes)}. Tómala de nuevo con menos resolución.`,
    );
  }
  if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ErrorHttp(400, 'Manda una sola foto por ticket.');
  }
  return new ErrorHttp(400, 'No pudimos leer la foto que enviaste. Vuelve a intentarlo.');
};

/** Deja el archivo en `req.file` o corta con un error entendible. */
export const recibirImagen = (req, res, next) =>
  subida(req, res, (err) => next(err ? errorDeSubida(err) : undefined));
