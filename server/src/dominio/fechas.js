/**
 * Las fechas se guardan como texto "YYYY-MM-DD" (y la hora como "HH:mm").
 * Es a propósito: un gasto ocurre en el día *local* de quien lo registra, y
 * guardarlo como Date en UTC hace que un gasto de las 11 p.m. se mueva al día
 * siguiente. Como texto ISO, comparar y ordenar sigue siendo trivial.
 */

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const RE_MES = /^\d{4}-\d{2}$/;

export const esFechaISO = (valor) => typeof valor === 'string' && RE_FECHA.test(valor);
export const esHoraISO = (valor) => typeof valor === 'string' && RE_HORA.test(valor);
export const esMesISO = (valor) => typeof valor === 'string' && RE_MES.test(valor);

/**
 * Un día natural va de las 00:00 a las 23:59 del reloj de quien anota. Como la
 * fecha se guarda aparte de la hora, "los gastos del 14 de julio" es
 * literalmente `fecha === '2026-07-14'`: no hay ventana que recortar ni
 * medianoche que se recorra a otro día.
 */
export const INICIO_DEL_DIA = '00:00';
export const FIN_DEL_DIA = '23:59';

const dosDigitos = (n) => String(n).padStart(2, '0');

/** Fecha de hoy según el reloj local del proceso. */
export function hoyISO(fecha = new Date()) {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/** Suma (o resta, con n negativo) días a una fecha ISO sin sufrir zonas horarias. */
export function sumarDias(iso, n) {
  const [a, m, d] = iso.split('-').map(Number);
  const t = Date.UTC(a, m - 1, d) + n * 86400000;
  const f = new Date(t);
  return `${f.getUTCFullYear()}-${dosDigitos(f.getUTCMonth() + 1)}-${dosDigitos(f.getUTCDate())}`;
}

/** Días transcurridos entre dos fechas ISO, ambas incluidas. */
export function diasEntre(desde, hasta) {
  const [a1, m1, d1] = desde.split('-').map(Number);
  const [a2, m2, d2] = hasta.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000) + 1;
}

/**
 * Ventana de tiempo de un periodo, terminando siempre en `hoy`.
 *   semana   → los últimos 7 días
 *   quincena → los últimos 15 días
 *   mes      → desde el día 1 del mes en curso
 */
export function rangoDePeriodo(periodo, hoy = hoyISO()) {
  const hasta = hoy;
  let desde;
  if (periodo === 'semana') desde = sumarDias(hasta, -6);
  else if (periodo === 'quincena') desde = sumarDias(hasta, -14);
  else desde = `${hasta.slice(0, 7)}-01`;
  return { desde, hasta, dias: diasEntre(desde, hasta) };
}

/** El mes "YYYY-MM" al que pertenece una fecha ISO. */
export const mesDeFecha = (iso) => iso.slice(0, 7);

/**
 * Del día 1 al último día de un mes "YYYY-MM". `Date.UTC(a, m, 0)` es el día
 * cero del mes siguiente, o sea el último del mes pedido — así los febreros
 * bisiestos salen bien sin tabla de días.
 */
export function rangoDeMes(mes) {
  const [a, m] = mes.split('-').map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { desde: `${mes}-01`, hasta: `${mes}-${dosDigitos(ultimo)}`, dias: ultimo };
}

/** Día de la semana de una fecha ISO, 0 = domingo. Sin zonas horarias de por medio. */
export function diaDeSemana(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}
