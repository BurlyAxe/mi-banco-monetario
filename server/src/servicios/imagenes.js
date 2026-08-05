/**
 * Recepción de imágenes: todo lo que hay que comprobar ANTES de gastar una
 * llamada a Gemini.
 *
 * Regla de la casa: lo que dice el cliente no cuenta. El navegador manda un
 * `Content-Type` por cada archivo y ese dato lo elige quien hace la petición,
 * no el archivo; renombrar un .exe a .jpg es cuestión de dos clics. Aquí el
 * tipo se decide leyendo los primeros bytes —la firma del formato— y ese es el
 * que viaja a Gemini.
 *
 * También se detecta lo truncado: una foto que el celular no terminó de subir
 * llega "bien" a nivel HTTP y solo revienta del otro lado, con un error de
 * Google que no le dice nada al usuario. Es más barato y más claro atajarlo.
 */
import { env } from '../config/env.js';
import { ErrorHttp } from '../middleware/errores.js';

/**
 * Formatos que aceptamos. Son exactamente los que Gemini entiende como imagen
 * y los que produce un celular: JPEG y PNG de siempre, WEBP de Android y HEIC
 * de iPhone (que iOS entrega tal cual al elegir de la galería).
 *
 *   https://ai.google.dev/gemini-api/docs/image-understanding
 */
const FORMATOS = [
  {
    tipoMime: 'image/jpeg',
    nombre: 'JPEG',
    firma: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    // Toda imagen JPEG termina en FF D9 (End Of Image). Algunas cámaras pegan
    // basura después, así que se busca en la cola en vez de exigirlo al final.
    completa: (b) => b.subarray(-64).includes(Buffer.from([0xff, 0xd9])),
  },
  {
    tipoMime: 'image/png',
    nombre: 'PNG',
    firma: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    // El PNG cierra siempre con el bloque IEND: 4 bytes de largo, el nombre
    // "IEND" y 4 de CRC. El nombre queda a ocho bytes del final.
    completa: (b) => b.subarray(-8, -4).toString('latin1') === 'IEND',
  },
  {
    tipoMime: 'image/webp',
    nombre: 'WEBP',
    firma: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
    // La cabecera RIFF declara cuánto mide el resto: si no cuadra, falta cola.
    completa: (b) => b.readUInt32LE(4) + 8 <= b.length,
  },
  {
    tipoMime: 'image/heic',
    nombre: 'HEIC',
    firma: (b) =>
      b.subarray(4, 8).toString('latin1') === 'ftyp' &&
      ['heic', 'heix', 'hevc', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'].includes(
        b.subarray(8, 12).toString('latin1'),
      ),
    // HEIC es un contenedor de cajas anidadas: comprobar que está entero
    // exigiría recorrerlo. No vale la pena; el tamaño mínimo ya filtra lo peor.
    completa: () => true,
  },
];

export const TIPOS_ACEPTADOS = FORMATOS.map((f) => f.tipoMime);

/** Etiqueta legible para el mensaje de error ("JPEG, PNG, WEBP o HEIC"). */
const NOMBRES = FORMATOS.map((f) => f.nombre);
const LISTA_FORMATOS = `${NOMBRES.slice(0, -1).join(', ')} o ${NOMBRES.at(-1)}`;

/**
 * Por debajo de esto no hay foto que valga: ni la cámara más modesta produce
 * un JPEG de menos de 1 KB. Casi siempre significa una subida cortada.
 */
const MINIMO_BYTES = 1024;

export const megas = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Revisa el archivo recibido y devuelve la imagen lista para mandar a Gemini.
 *
 * @param {{ buffer: Buffer, mimetype?: string, size?: number }} archivo  Lo que dejó multer.
 * @returns {{ buffer: Buffer, tipoMime: string, bytes: number }}
 * @throws {ErrorHttp} 400 con un mensaje que el usuario pueda entender.
 */
export function validarImagen(archivo) {
  if (!archivo?.buffer?.length) {
    throw new ErrorHttp(400, 'No recibimos ninguna foto. Vuelve a intentarlo.');
  }

  const { buffer } = archivo;

  if (buffer.length > env.ticket.maxBytes) {
    throw new ErrorHttp(
      413,
      `La foto pesa ${megas(buffer.length)} y el máximo son ${megas(env.ticket.maxBytes)}. Tómala de nuevo con menos resolución.`,
    );
  }

  if (buffer.length < MINIMO_BYTES) {
    throw new ErrorHttp(400, 'La foto llegó incompleta. Vuelve a tomarla.');
  }

  const formato = FORMATOS.find((f) => f.firma(buffer));
  if (!formato) {
    throw new ErrorHttp(400, `Ese archivo no es una imagen. Manda una foto en ${LISTA_FORMATOS}.`);
  }

  if (!formato.completa(buffer)) {
    throw new ErrorHttp(400, 'La foto está dañada o se subió a medias. Vuelve a tomarla.');
  }

  return { buffer, tipoMime: formato.tipoMime, bytes: buffer.length };
}
