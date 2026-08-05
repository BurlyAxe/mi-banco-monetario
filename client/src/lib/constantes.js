/** Espejo de server/src/dominio/constantes.js: si cambias uno, cambia el otro. */

export const CATEGORIAS = [
  'Comida',
  'Despensa',
  'Transporte',
  'Servicios',
  'Entretenimiento',
  'Compras',
  'Ropa',
  'Higiene y hogar',
  'Salud',
  'Educación',
];

/**
 * Qué tanto "vale la pena" cada categoría:
 *
 *   vale  → necesario. Nivis NUNCA reclama por esto, gastes lo que gastes.
 *   mixto → depende de cómo lo hiciste (comer es necesario, pedirlo no tanto).
 *   gusto → puro antojo. Es lo único por lo que Nivis puede picar.
 */
export const VIBRA = {
  Comida: 'mixto',
  Despensa: 'vale',
  Transporte: 'vale',
  Servicios: 'vale',
  Entretenimiento: 'gusto',
  Compras: 'gusto',
  Ropa: 'vale',
  'Higiene y hogar': 'vale',
  Salud: 'vale',
  Educación: 'vale',
};

/**
 * Un gasto puede ser esencial aunque su categoría no lo sea: la despensa
 * cargada en "Comida" o el shampoo cargado en "Compras" siguen siendo
 * necesarios. Estas reglas los rescatan por el nombre del gasto.
 */
const RESCATE_ESENCIAL = [
  /despensa|mandado|super(?:mercado)?|súper|abarrotes|soriana|walmart|chedraui|bodega aurrer|aurrera|costco|sam'?s|heb|mercado|tortiller|carnicer|fruter|verduler/i,
  /jab[oó]n|shampoo|champ[uú]|pasta dental|cepillo|desodorante|papel higi[eé]nico|detergente|cloro|limpieza|higiene|toallas? (?:femenina|sanitaria|h[uú]meda)|pa[ñn]al|escoba|traper|deterg/i,
  /ropa|playera|pantal[oó]n|zapato|tenis|camisa|blusa|vestido|chamarra|su[eé]ter|calcet|ropa interior|uniforme/i,
  /medicina|farmacia|consulta|doctor|dentista|an[aá]lisis|receta|lentes/i,
  /libro|colegiatura|inscripci[oó]n|curso|escuela|universidad|material escolar/i,
];

/** La vibra real de un gasto, ya considerando el rescate por nombre. */
export function vibraDeGasto(gasto) {
  // El servidor ya la calcula y la manda con cada gasto; esto es el respaldo.
  if (gasto.vibra) return gasto.vibra;
  if (VIBRA[gasto.categoria] === 'vale') return 'vale';
  if (RESCATE_ESENCIAL.some((regla) => regla.test(gasto.label || ''))) return 'vale';
  return VIBRA[gasto.categoria] || 'mixto';
}

export const ETIQUETA_VIBRA = {
  vale: 'vale la pena',
  gusto: 'puro gusto',
  mixto: 'necesario-ish',
};

export const FUENTES = ['Sueldo', 'Freelance', 'Venta', 'Regalo', 'Otro'];

/** Rampa de azules: la categoría #1 va con el color de acento del usuario. */
export const RAMPA = [
  '#1F6FA8',
  '#2E86C8',
  '#4B9FDD',
  '#75B6E8',
  '#8FC4EC',
  '#9CCBF0',
  '#AED4F2',
  '#BEDCF4',
  '#CBE2F7',
  '#D8E6F0',
];

/** Qué tan directo quiere el usuario que Nivis le hable. */
export const TONOS = ['Optimista', 'Normal', 'Realista', 'Rudo'];

export const DESCRIPCION_TONO = {
  Optimista: 'Te lo tomas a la ligera y Nivis celebra lo que sí haces bien.',
  Normal: 'Directo, con humor y sin dramas.',
  Realista: 'Sin adornos: los números tal cual, y qué estás haciendo mal.',
  Rudo: 'Nivis te regaña de verdad cuando te pasas. Tú lo pediste.',
};

export const GRAFICAS = ['Dona', 'Barras'];

export const PERIODOS = [
  { clave: 'semana', btn: 'Semana' },
  { clave: 'quincena', btn: 'Quincena' },
  { clave: 'mes', btn: 'Mes' },
];

export const COLORES_ACENTO = ['#1F7FC4', '#2E86C8', '#3AA0E8', '#5C8FB0'];

export const colorDeCategoria = (categoria, ranked) =>
  RAMPA[Math.min(Math.max(ranked.indexOf(categoria), 0), RAMPA.length - 1)];
