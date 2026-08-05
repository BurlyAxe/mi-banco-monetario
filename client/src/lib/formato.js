const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const dosDigitos = (n) => String(n).padStart(2, '0');

export const dinero = (n) => '$' + Math.round(n || 0).toLocaleString('es-MX');

/** Fecha local de hoy como "YYYY-MM-DD" (nunca UTC: ver server/src/dominio/fechas.js). */
export function hoyISO(fecha = new Date()) {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

export function horaAhora(fecha = new Date()) {
  return `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

export function sumarDias(iso, n) {
  const [a, m, d] = iso.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d) + n * 86400000);
  return `${f.getUTCFullYear()}-${dosDigitos(f.getUTCMonth() + 1)}-${dosDigitos(f.getUTCDate())}`;
}

/** "Hoy", "Ayer" o "mié 22 jul". */
export function etiquetaDeFecha(iso, hoy) {
  if (iso === hoy) return 'Hoy';
  if (iso === sumarDias(hoy, -1)) return 'Ayer';
  const [a, m, d] = iso.split('-').map(Number);
  return `${DIAS[new Date(a, m - 1, d).getDay()]} ${d} ${MESES[m - 1]}`;
}

/** "Julio 2026" — el mes al que pertenece la fecha dada. */
export function etiquetaDeMes(iso) {
  const [a, m] = iso.split('-').map(Number);
  return `${MESES_LARGOS[m - 1]} ${a}`;
}

/* ------------------------------------------------------------- calendario */

/** Iniciales de la fila de encabezado del calendario, de lunes a domingo. */
export const INICIALES_DIA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** El mes "YYYY-MM" al que pertenece una fecha ISO. */
export const mesDeFecha = (iso) => iso.slice(0, 7);

/** Suma (o resta) meses a un "YYYY-MM". */
export function sumarMeses(mes, n) {
  const [a, m] = mes.split('-').map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${dosDigitos((total % 12) + 1)}`;
}

/**
 * Cuántas casillas vacías van antes del día 1 en una cuadrícula que empieza en
 * lunes. `getUTCDay()` cuenta desde el domingo, de ahí el corrimiento.
 */
export function huecoInicial(mes) {
  const [a, m] = mes.split('-').map(Number);
  return (new Date(Date.UTC(a, m - 1, 1)).getUTCDay() + 6) % 7;
}

/** El número de día de una fecha ISO, sin construir un Date. */
export const numeroDeDia = (iso) => Number(iso.slice(8, 10));

/** Minúsculas y sin acentos, para que "educacion" encuentre "Educación". */
export const normalizar = (s) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
