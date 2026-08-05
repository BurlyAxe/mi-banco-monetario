/**
 * Lo que el cliente necesita saber sobre la lectura de tickets.
 *
 * El servidor manda `nivel` (baja | media | alta | muyAlta) y la etiqueta ya
 * redactada; aquí solo vive cómo se PINTA eso. La regla de negocio —cuándo un
 * nivel es bajo, qué texto le toca— se queda del lado del servidor, que es
 * donde vive el resto de la voz de Nivis.
 */

/**
 * Espejo de server/src/servicios/imagenes.js: si cambias uno, cambia el otro.
 * `image/heif` va solo aquí, en el `accept` del selector: algunos iPhone
 * etiquetan así la misma foto que el servidor reconocerá como HEIC por su
 * firma, y dejarla fuera escondería fotos válidas en el selector.
 */
export const TIPOS_ACEPTADOS = 'image/jpeg,image/png,image/webp,image/heic,image/heif';

/**
 * Espejo de TICKET_MAX_BYTES. Se comprueba también aquí para no subir 8 MB por
 * una red móvil y enterarse del rechazo treinta segundos después; el servidor
 * lo vuelve a comprobar igual, porque esta validación es comodidad, no defensa.
 */
export const MAX_BYTES = 4.5 * 1024 * 1024;

/** Cómo se ve cada nivel de confianza: cuánto se llena la barra y de qué color. */
export const ASPECTO_CONFIANZA = {
  muyAlta: { llenado: 100, clase: 'confianza--muy-alta' },
  alta: { llenado: 75, clase: 'confianza--alta' },
  media: { llenado: 50, clase: 'confianza--media' },
  baja: { llenado: 25, clase: 'confianza--baja' },
};

/** Advertencia fija cuando la lectura no es de fiar. */
export const ADVERTENCIA_BAJA =
  'Revisa cada dato con calma antes de guardar, sobre todo el monto: esta foto no se leyó con claridad.';

/** Los campos del formulario que la IA no logró detectar, para señalarlos. */
export const CAMPO_DEL_TICKET = {
  comercio: 'nota',
  fecha: 'fecha',
  monto: 'monto',
  categoria: 'categoria',
};

export const camposSinDetectar = (faltantes = []) => faltantes.map((f) => CAMPO_DEL_TICKET[f] || f);
