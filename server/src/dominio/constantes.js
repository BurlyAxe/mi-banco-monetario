/**
 * Vocabulario del dominio. Es el mismo que usa el cliente en
 * client/src/lib/constantes.js: si cambias uno, cambia el otro.
 */

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
 * Qué tanto "vale la pena" cada categoría. Alimenta el tono de los mensajes:
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

/** Categorías que nunca reciben reclamo, por más alto que sea el monto. */
export const CATEGORIAS_ESENCIALES = CATEGORIAS.filter((c) => VIBRA[c] === 'vale');

/**
 * Un gasto puede ser esencial aunque su categoría no lo sea: la despensa
 * cargada en "Comida" o el shampoo cargado en "Compras" siguen siendo
 * necesarios. Estas reglas rescatan esos casos por el nombre del gasto, para
 * que Nivis no regañe a alguien por surtir el súper.
 */
const RESCATE_ESENCIAL = [
  /despensa|mandado|super(?:mercado)?|súper|abarrotes|soriana|walmart|chedraui|bodega aurrer|aurrera|costco|sam'?s|heb|mercado|tortiller|carnicer|fruter|verduler/i,
  /jab[oó]n|shampoo|champ[uú]|pasta dental|cepillo|desodorante|papel higi[eé]nico|detergente|cloro|limpieza|higiene|toallas? (?:femenina|sanitaria|h[uú]meda)|pa[ñn]al|escoba|traper|deterg/i,
  /ropa|playera|pantal[oó]n|zapato|tenis|camisa|blusa|vestido|chamarra|su[eé]ter|calcet|ropa interior|uniforme/i,
  /medicina|farmacia|consulta|doctor|dentista|an[aá]lisis|receta|lentes/i,
  /libro|colegiatura|inscripci[oó]n|curso|escuela|universidad|material escolar/i,
];

/** ¿Este gasto concreto queda fuera del reclamo de Nivis? */
export function esGastoEsencial(gasto) {
  if (VIBRA[gasto.categoria] === 'vale') return true;
  return RESCATE_ESENCIAL.some((regla) => regla.test(gasto.label || ''));
}

/** La vibra real de un gasto, ya considerando el rescate por nombre. */
export function vibraDeGasto(gasto) {
  if (esGastoEsencial(gasto)) return 'vale';
  return VIBRA[gasto.categoria] || 'mixto';
}

export const ETIQUETA_VIBRA = {
  vale: 'vale la pena',
  gusto: 'puro gusto',
  mixto: 'necesario-ish',
};

export const FUENTES = ['Sueldo', 'Freelance', 'Venta', 'Regalo', 'Otro'];

/**
 * Qué tan directo quiere el usuario que Nivis le hable. No es "qué tan duro
 * te regaña": Nivis cuida el gasto, y el tono solo cambia cómo lo dice.
 */
export const TONOS = ['Optimista', 'Normal', 'Realista', 'Rudo'];

export const DESCRIPCION_TONO = {
  Optimista: 'Te lo tomas a la ligera y Nivis celebra lo que sí haces bien.',
  Normal: 'Directo, con humor y sin dramas.',
  Realista: 'Sin adornos: los números tal cual, y qué estás haciendo mal.',
  Rudo: 'Nivis te regaña de verdad cuando te pasas. Tú lo pediste.',
};

export const TONO_POR_DEFECTO = 'Normal';

/** Cuentas creadas con los tres niveles viejos (Suave/Normal/Brutal). */
export const TONO_LEGADO = { Suave: 'Optimista', Normal: 'Normal', Brutal: 'Rudo' };

/** Devuelve siempre un tono válido, venga de donde venga. */
export const normalizarTono = (valor) =>
  TONOS.includes(valor) ? valor : TONO_LEGADO[valor] || TONO_POR_DEFECTO;

export const GRAFICAS = ['Dona', 'Barras'];

export const PERIODOS = ['semana', 'quincena', 'mes'];

export const ETIQUETAS_PERIODO = {
  semana: { label: 'esta semana', corto: '· SEMANA', btn: 'Semana', centro: 'DE LA SEMANA' },
  quincena: { label: 'esta quincena', corto: '· QUINCENA', btn: 'Quincena', centro: 'DE LA QUINCENA' },
  mes: { label: 'este mes', corto: '· MES', btn: 'Mes', centro: 'DEL MES' },
};
