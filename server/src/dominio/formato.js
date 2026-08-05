/** "$1,234" con separadores mexicanos. */
export const dinero = (n) => '$' + Math.round(n || 0).toLocaleString('es-MX');

/** Porcentaje entero y seguro: sin base no hay porcentaje que dar. */
export const porcentaje = (parte, base) => (base > 0 ? Math.round((parte / base) * 100) : 0);

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * "miércoles 22 de julio" — cómo se nombra un día cuando lo platicas, que es
 * justo lo que Nivis hace en el resumen del calendario.
 */
export function etiquetaLargaDeFecha(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return `${DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]} ${d} de ${MESES[m - 1]}`;
}

/** "julio de 2026". */
export function etiquetaDeMes(mes) {
  const [a, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} de ${a}`;
}
