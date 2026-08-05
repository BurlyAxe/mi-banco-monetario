/**
 * Qué es un ticket para esta app: qué se le pide al modelo, con qué forma debe
 * contestar y cómo se traduce esa respuesta al vocabulario de la aplicación.
 *
 * Aquí no se habla con nadie ni se lee ningún archivo: es conocimiento del
 * dominio puro, y por eso se puede leer, discutir y cambiar sin tocar la
 * comunicación con Gemini (servicios/gemini.js) ni la orquestación
 * (servicios/lectorDeTickets.js).
 *
 * Lo que sale de aquí es una PROPUESTA. La IA nunca registra un gasto: el
 * gasto se crea cuando el usuario presiona Guardar, con el POST /gastos de
 * siempre y sus mismas validaciones.
 */

import { esFechaISO } from './fechas.js';

/**
 * Valor centinela para "ninguna categoría encaja".
 *
 * El enum del esquema no se marca como `nullable`: un campo que es enum Y
 * puede ser nulo a la vez confunde al modelo, que termina inventando la cadena
 * "null" o eligiendo la primera opción de la lista con tal de contestar algo.
 * Darle una opción explícita para decir "no sé" es mucho más fiable, y aquí se
 * convierte en `null` antes de que nadie más lo vea.
 */
export const SIN_CATEGORIA = 'NINGUNA';

/** Los datos que el usuario espera ver prellenados. */
export const CAMPOS = ['comercio', 'fecha', 'monto', 'categoria'];

/**
 * Qué tan lejos hacia atrás tiene sentido un ticket. Más de cinco años casi
 * siempre significa que el modelo leyó mal el año (un "2019" borroso, o un
 * folio confundido con una fecha).
 */
const ANIOS_HACIA_ATRAS = 5;

/** El tope de monto que acepta el modelo de gastos. Un ticket no lo pasa. */
const MONTO_MAXIMO = 99_999_999;

/* ----------------------------------------------------------- confianza */

/**
 * Los cuatro niveles, de menos a más. El orden importa: `limitarNivel()` se
 * apoya en él para bajar la confianza cuando faltan datos.
 */
export const NIVELES = ['baja', 'media', 'alta', 'muyAlta'];

export const ETIQUETA_NIVEL = {
  muyAlta: 'Muy alta',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

/** Cortes de la confianza que reporta el modelo (0 a 1). */
const CORTES = [
  { desde: 0.85, nivel: 'muyAlta' },
  { desde: 0.7, nivel: 'alta' },
  { desde: 0.45, nivel: 'media' },
];

const nivelPorValor = (confianza) => CORTES.find((c) => confianza >= c.desde)?.nivel || 'baja';

const limitarNivel = (nivel, tope) =>
  NIVELES[Math.min(NIVELES.indexOf(nivel), NIVELES.indexOf(tope))];

/**
 * La confianza final no es solo la que dice el modelo.
 *
 * Un modelo puede estar convencidísimo de una lectura y aun así no haber
 * encontrado el total; lo que le importa al usuario es cuánto de lo que va a
 * guardar viene prellenado. Sin monto no hay gasto que valga, así que ese caso
 * cae directo a "baja" por más seguro que se sienta el modelo.
 */
function nivelFinal(confianza, faltantes) {
  const nivel = nivelPorValor(confianza);
  if (faltantes.includes('monto')) return 'baja';
  if (faltantes.includes('fecha')) return limitarNivel(nivel, 'media');
  if (faltantes.length) return limitarNivel(nivel, 'alta');
  return nivel;
}

/* ------------------------------------------------------ esquema y prompt */

/**
 * El esquema que Gemini tiene que respetar (subconjunto de OpenAPI).
 *
 *   https://ai.google.dev/gemini-api/docs/structured-output
 *
 * Las categorías llegan por parámetro y no importadas: así el enum es siempre
 * el catálogo real de la app y el modelo no puede devolver una categoría que
 * no exista. Si mañana el catálogo lo elige cada usuario, esto ya funciona.
 *
 * `propertyOrdering` no es cosmético. El modelo escribe el JSON en ese orden,
 * así que dejar `confianza` al final lo obliga a evaluarse DESPUÉS de haber
 * extraído los datos, no antes. Una autoevaluación a toro pasado sale mucho
 * mejor calibrada que una prometida de entrada.
 */
export const esquemaDeTicket = (categorias) => ({
  type: 'OBJECT',
  properties: {
    comercio: {
      type: 'STRING',
      nullable: true,
      description: 'Nombre comercial de la tienda tal como aparece impreso. null si no se distingue.',
    },
    fecha: {
      type: 'STRING',
      nullable: true,
      description: 'Fecha de la compra en formato YYYY-MM-DD. null si no se distingue.',
    },
    monto_total: {
      type: 'NUMBER',
      nullable: true,
      description: 'Total finalmente pagado, con decimales y sin símbolo de moneda. null si no se distingue.',
    },
    categoria_sugerida: {
      type: 'STRING',
      format: 'enum',
      enum: [...categorias, SIN_CATEGORIA],
      description: `Categoría del catálogo que mejor describe la compra, o "${SIN_CATEGORIA}" si ninguna encaja.`,
    },
    confianza: {
      type: 'NUMBER',
      description: 'Qué tan seguro estás de los datos anteriores, de 0 a 1.',
    },
  },
  required: ['comercio', 'fecha', 'monto_total', 'categoria_sugerida', 'confianza'],
  propertyOrdering: ['comercio', 'fecha', 'monto_total', 'categoria_sugerida', 'confianza'],
});

/**
 * La instrucción de sistema.
 *
 * Está escrita contra los problemas reales de una foto tomada al vuelo: el
 * ticket doblado, la luz del changarro, la mano temblorosa. Y sobre todo
 * contra el error caro, que no es dejar un campo vacío sino rellenarlo con
 * algo inventado: un dato faltante el usuario lo teclea en diez segundos, uno
 * inventado se guarda sin que nadie lo note.
 *
 * @param {string[]} categorias  El catálogo real de la app.
 * @param {string}   hoy         Fecha local del usuario "YYYY-MM-DD".
 */
export const instruccionDeTicket = (categorias, hoy) => `
Eres un lector experto de tickets de compra mexicanos. Recibes UNA fotografía y
extraes de ella cuatro datos: comercio, fecha, total pagado y categoría.

CONDICIONES DE LA FOTO
Las fotos son de celular, tomadas de prisa. Espera y tolera:
- Tickets doblados, arrugados o con una esquina volteada.
- Fotos inclinadas o giradas: lee el ticket en cualquier orientación.
- Poca luz, sombras, flash quemado, reflejos sobre el papel térmico.
- Tinta desvanecida, papel arrugado, texto parcialmente cortado.
Si una parte no se alcanza a leer, esa parte es null. El resto se sigue leyendo.

QUÉ IGNORAR POR COMPLETO
- Publicidad, leyendas del tipo "gracias por su compra", encuestas, teléfonos.
- Promociones, cupones, "ahorraste", puntos de lealtad, montos tachados.
- Números de autorización, folio, terminal, referencia, arqueo, caja, cajero.
- Códigos QR y códigos de barras, y cualquier número largo debajo de ellos.
- RFC, dirección fiscal, régimen y datos de facturación.
- Cualquier monto que no sea el que el cliente terminó pagando.

CÓMO SACAR CADA DATO

comercio
  El nombre de la tienda, normalmente impreso arriba y en letra más grande.
  Escríbelo como marca legible ("Oxxo", "Walmart", "Farmacia Guadalupe"), sin
  el número de sucursal, sin S.A. de C.V. y sin la dirección. Máximo 80
  caracteres. Si arriba solo hay un logo ilegible o datos fiscales, usa null.

fecha
  Devuélvela SIEMPRE como YYYY-MM-DD.
  En México se imprime día/mes/año: "05/08/26" es 2026-08-05, no 5 de mayo.
  Con año de dos dígitos, asume el siglo actual.
  Hoy es ${hoy}. Un ticket NUNCA es de una fecha futura: si lo que leíste da
  una fecha posterior a hoy, la leíste mal, así que devuelve null.
  No confundas la fecha con la hora, el folio ni la vigencia de una promoción.

monto_total
  El monto que el cliente pagó de verdad. Búscalo junto a "TOTAL", "TOTAL A
  PAGAR", "IMPORTE TOTAL" o "SU PAGO", casi siempre el más grande y el último
  de la columna de importes.
  NO uses subtotal, IVA, "efectivo recibido", "su cambio", saldo de tarjeta,
  ahorro, propina sugerida ni el precio de un artículo suelto.
  Si el ticket paga con efectivo, el total es lo que se cobró, no lo que se
  entregó ni el cambio devuelto.
  Devuelve un número, con punto decimal y sin "$" ni comas: 1234.50.

categoria_sugerida
  Elige UNA del catálogo, según lo que se compró (el giro de la tienda y los
  artículos del detalle, si se ven):
${categorias.map((c) => `    - ${c}`).join('\n')}
  Si ninguna encaja de verdad, devuelve exactamente "${SIN_CATEGORIA}".
  Nunca inventes una categoría que no esté en esa lista.

confianza
  Un número de 0 a 1 con qué tan seguro estás de lo que extrajiste, pesando
  sobre todo el total. Sé honesto: 0.9 o más solo si el ticket se lee sin
  esfuerzo; 0.5 o menos si estás adivinando entre dos cifras posibles o la
  foto está muy dañada. No infles este número.

REGLA QUE NO SE ROMPE
Nunca inventes ni completes un dato que no está en la imagen. Ante la duda,
null. Un campo vacío lo corrige el usuario en segundos; un dato inventado se
guarda sin que nadie se dé cuenta.
Si la foto no es un ticket de compra, devuelve todo en null y confianza 0.

FORMATO
Responde ÚNICAMENTE con el objeto JSON del esquema. Nada de texto antes o
después, nada de markdown, nada de bloques de código, ninguna explicación.
`.trim();

/* ------------------------------------------------------- transformación */

/** Recorta y limpia el nombre del comercio; devuelve null si no queda nada. */
const limpiarComercio = (valor) => {
  const texto = (valor || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  return texto || null;
};

/**
 * Acepta la fecha solo si es una fecha real, no futura y no absurdamente
 * vieja. Cualquier otra cosa es una mala lectura y vale más un campo vacío.
 */
function limpiarFecha(valor, hoy) {
  if (!valor || !esFechaISO(valor)) return null;
  if (valor > hoy) return null;

  const limite = `${Number(hoy.slice(0, 4)) - ANIOS_HACIA_ATRAS}${hoy.slice(4)}`;
  return valor < limite ? null : valor;
}

/** El monto solo sirve si es un número positivo dentro de lo que acepta un gasto. */
function limpiarMonto(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero <= 0 || numero > MONTO_MAXIMO) return null;
  // Dos decimales: es dinero, no una medición.
  return Math.round(numero * 100) / 100;
}

/** La categoría solo se acepta si existe de verdad en el catálogo. */
const limpiarCategoria = (valor, categorias) => (categorias.includes(valor) ? valor : null);

/**
 * Traduce la respuesta cruda de Gemini (snake_case, "cómo habla la IA") al
 * vocabulario de la app (camelCase, "cómo habla el gasto").
 *
 * Esta frontera es el punto donde el resto del sistema deja de saber que hubo
 * una IA de por medio: de aquí sale un borrador de gasto igual al que llenaría
 * una persona a mano. Cambiar de modelo, o leer facturas en vez de tickets,
 * solo obliga a reescribir esta función.
 *
 * Nada se da por bueno por venir del esquema: el esquema disciplina al modelo,
 * no lo garantiza. Todo campo que no pase su propia comprobación se vuelve
 * null y se anota en `faltantes`.
 *
 * @param {object}   crudo       Respuesta ya parseada de Gemini.
 * @param {string[]} categorias  Catálogo con el que se armó el enum.
 * @param {string}   hoy         Fecha local del usuario "YYYY-MM-DD".
 */
export function aBorradorDeGasto({ crudo, categorias, hoy }) {
  const propuesta = {
    comercio: limpiarComercio(crudo.comercio),
    fecha: limpiarFecha(crudo.fecha, hoy),
    monto: limpiarMonto(crudo.monto_total),
    categoria: limpiarCategoria(crudo.categoria_sugerida, categorias),
  };

  const faltantes = CAMPOS.filter((campo) => propuesta[campo] === null);
  const confianza = Math.min(Math.max(Number(crudo.confianza) || 0, 0), 1);

  return {
    ...propuesta,
    faltantes,
    confianza,
    nivel: nivelFinal(confianza, faltantes),
  };
}
