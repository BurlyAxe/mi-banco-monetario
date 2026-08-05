import { z } from 'zod';
import { CATEGORIAS, FUENTES, TONOS, GRAFICAS, PERIODOS } from './dominio/constantes.js';
import { esFechaISO, esHoraISO, esMesISO, hoyISO } from './dominio/fechas.js';

const fecha = z.string().refine(esFechaISO, 'usa el formato YYYY-MM-DD');
const hora = z.string().refine(esHoraISO, 'usa el formato HH:mm');
const monto = z.coerce.number().positive('el monto debe ser mayor a 0').max(99_999_999);
const texto = (max) => z.string().trim().max(max);

export const esquemaRegistro = z.object({
  nombre: texto(60).min(2, 'dinos cómo te llamas'),
  correo: z.string().trim().toLowerCase().email('correo inválido'),
  contrasena: z.string().min(8, 'mínimo 8 caracteres').max(200),
});

export const esquemaLogin = z.object({
  correo: z.string().trim().toLowerCase().email('correo inválido'),
  contrasena: z.string().min(1, 'escribe tu contraseña'),
});

export const esquemaAjustes = z
  .object({
    nombre: texto(60).min(2).optional(),
    tono: z.enum(TONOS).optional(),
    colorAcento: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'usa un color #RRGGBB').optional(),
    graficaPorDefecto: z.enum(GRAFICAS).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'no mandaste nada que cambiar');

export const esquemaGasto = z.object({
  label: texto(80).optional(),
  categoria: z.enum(CATEGORIAS),
  monto,
  fecha: fecha.default(() => hoyISO()),
  hora: hora.default('12:00'),
});

export const esquemaIngreso = z.object({
  label: texto(80).optional(),
  fuente: z.enum(FUENTES),
  monto,
  fecha: fecha.default(() => hoyISO()),
});

/**
 * Corrección de un movimiento ya anotado, de gasto o de ingreso.
 *
 * Solo el nombre y el monto: son los dos datos que uno teclea mal (un cero de
 * más, "Ubre" en vez de "Uber"). La categoría, la fuente y la fecha describen
 * un hecho que ya ocurrió, y dejarlas mover convertiría el historial en algo
 * que se puede reescribir para que las cuentas salgan bonitas.
 *
 * Se manda solo lo que cambió, así que ambos campos son opcionales pero al
 * menos uno tiene que venir.
 */
export const esquemaEdicionMovimiento = z
  .object({
    label: texto(80).min(1, 'el nombre no puede quedar vacío').optional(),
    monto: monto.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'no mandaste nada que cambiar');

/**
 * Filtro de periodo. `hoy` lo manda el cliente con *su* fecha local, para que
 * "esta semana" signifique lo mismo en el celular y en el servidor.
 */
export const esquemaConsultaPeriodo = z.object({
  periodo: z.enum(PERIODOS).default('mes'),
  hoy: fecha.optional(),
});

/** Un día exacto del calendario: de sus 00:00 a sus 23:59. */
export const esquemaConsultaDia = z.object({
  fecha,
});

/**
 * Lo único que acompaña a la foto de un ticket: la fecha local del usuario.
 * Va en la query y no en el formulario porque el cuerpo lo parsea multer, y
 * así este filtro puede correr antes de tocar un solo byte de la imagen.
 */
export const esquemaConsultaHoy = z.object({
  hoy: fecha.optional(),
});

/** Un mes de la cuadrícula del calendario. Sin `mes`, el mes en curso. */
export const esquemaConsultaMes = z.object({
  mes: z.string().refine(esMesISO, 'usa el formato YYYY-MM').optional(),
});

/**
 * Un turno del chat con Nivis. Los topes no son burocracia: el historial se
 * reenvía completo a Gemini en cada mensaje, así que dejarlo crecer sin
 * límite sería pagar por un prompt cada vez más caro y más lento.
 */
export const esquemaChat = z.object({
  mensajes: z
    .array(
      z.object({
        rol: z.enum(['usuario', 'nivis']),
        texto: z.string().trim().min(1, 'escribe algo').max(1000, 'mensaje demasiado largo'),
      }),
    )
    .min(1, 'no mandaste ningún mensaje')
    .max(24, 'la conversación es demasiado larga, empieza una nueva'),
  periodo: z.enum(PERIODOS).default('mes'),
  hoy: fecha.optional(),
});

/**
 * La respuesta de Gemini al leer un ticket, antes de que nadie la crea.
 *
 * Comprueba la FORMA, no el contenido: que estén los cinco campos y que cada
 * uno sea de un tipo con el que se pueda trabajar. Que la fecha exista de
 * verdad, que el monto sea razonable o que la categoría esté en el catálogo lo
 * decide el dominio (dominio/ticket.js), que es donde vive ese criterio.
 *
 * Los campos pueden ser null a propósito: un ticket ilegible es un resultado
 * válido —el usuario llena el formulario a mano— y no un error. Lo que sí es
 * un error es que falte un campo: eso significa que el modelo se salió del
 * esquema y no hay nada que mostrar con confianza.
 *
 * `monto_total` y `confianza` aceptan también texto: el modelo devuelve
 * "1234.50" de vez en cuando, y tirar una lectura buena por unas comillas
 * sería absurdo. El dominio los pasa por Number().
 */
const numeroDelModelo = z.union([z.number(), z.string()]);

export const esquemaTicketIA = z.object({
  comercio: z.string().nullable(),
  fecha: z.string().nullable(),
  monto_total: numeroDelModelo.nullable(),
  categoria_sugerida: z.string().nullable(),
  confianza: numeroDelModelo,
});
