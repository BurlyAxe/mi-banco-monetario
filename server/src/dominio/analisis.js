/**
 * El análisis del periodo: convierte los movimientos en números y decide QUÉ
 * hay que decir. El CÓMO se dice (según el tono elegido) vive en voz.js.
 */
import { CATEGORIAS, FUENTES, vibraDeGasto, normalizarTono } from './constantes.js';
import { dinero, porcentaje, etiquetaLargaDeFecha } from './formato.js';
import {
  textoDeVeredicto,
  textosDeConsejo,
  textoDeGasto,
  textoDeIngreso,
  textoDeDia,
  textoDeTicket,
  mensajeDeFuente,
  TITULAR_INGRESOS,
  CIERRE_INGRESOS,
} from './voz.js';
import { CAMPOS as CAMPOS_DE_TICKET } from './ticket.js';

export { dinero } from './formato.js';

const RE_SUSCRIPCIONES = /netflix|spotify|totalplay|disney|hbo|prime|max\b|izzi|megacable/i;
const RE_DELIVERY = /rappi|didi\s*food|uber\s*eats|sin\s*delantal/i;
/** Comida que claramente no salió de la cocina de tu casa. */
const RE_COMIDA_FUERA = /restaurante|starbucks|caf[eé]|bar\b|cantina|antro|tacos|sushi|pizza|hamburgues|oxxo|seven|antojo|postre|helado|cerveza|mcdonal|burger|kfc|domino/i;

/** Suma por categoría; siempre devuelve todas las llaves, aunque valgan 0. */
export function totalesPorCategoria(gastos) {
  const t = Object.fromEntries(CATEGORIAS.map((c) => [c, 0]));
  for (const g of gastos) {
    if (t[g.categoria] === undefined) t[g.categoria] = 0;
    t[g.categoria] += g.monto;
  }
  return t;
}

/** Categorías ordenadas de la que más pesa a la que menos. */
export const rankear = (totales) =>
  Object.keys(totales).sort((a, b) => totales[b] - totales[a]);

/**
 * Los números del periodo, ya con la distinción que le importa a Nivis:
 * qué fue necesario y qué fue puro gusto.
 *
 * El reparto se hace gasto por gasto (no por categoría) porque la despensa
 * cargada en "Comida" o el shampoo cargado en "Compras" siguen siendo
 * necesidades: ver `vibraDeGasto` en constantes.js.
 */
export function medir({ gastos, ingresos, dias }) {
  const totales = totalesPorCategoria(gastos);
  const ranked = rankear(totales);

  let esencial = 0;
  let gusto = 0;
  let mixto = 0; // comida que no se rescató como despensa: comer fuera, pues
  let antojo = 0; // todo lo que se comió fuera de casa, venga de donde venga
  const porGusto = {}; // solo lo prescindible, por categoría

  for (const g of gastos) {
    const vibra = vibraDeGasto(g);
    if (vibra === 'vale') esencial += g.monto;
    else if (vibra === 'mixto') mixto += g.monto;
    else if (vibra === 'gusto') {
      gusto += g.monto;
      porGusto[g.categoria] = (porGusto[g.categoria] || 0) + g.monto;
    }

    // Comer fuera: todo lo que no se rescató como despensa cuenta, más
    // cualquier gasto con nombre de restaurante o de app de comida.
    if (vibra === 'mixto' || (vibra === 'gusto' && (RE_DELIVERY.test(g.label) || RE_COMIDA_FUERA.test(g.label)))) {
      antojo += g.monto;
    }
  }

  // Lo que Nivis puede señalar sin equivocarse: nunca es una categoría esencial.
  const categoriaGusto =
    Object.keys(porGusto).sort((a, b) => porGusto[b] - porGusto[a])[0] || null;

  const totalGastado = Object.values(totales).reduce((a, b) => a + b, 0);
  const totalIngresos = ingresos.reduce((a, i) => a + i.monto, 0);
  // El diseño divide entre el total; con 0 gastos evitamos un NaN en pantalla.
  const base = totalGastado || 1;

  return {
    totalGastado,
    totalIngresos,
    balance: totalIngresos - totalGastado,
    porcentajeDelIngreso: porcentaje(totalGastado, totalIngresos),
    categoriaTop: ranked[0],
    porcentajeTop: porcentaje(totales[ranked[0]], base),
    porDia: totalGastado / dias,
    numeroDeGastos: gastos.length,
    puroGusto: gusto,
    porcentajeGusto: porcentaje(gusto, base),
    esencial,
    porcentajeEsencial: porcentaje(esencial, base),
    antojo,
    // Todo lo que Nivis podría señalar sin faltarle el respeto a una necesidad.
    prescindible: gusto + mixto,
    porcentajePrescindible: porcentaje(gusto + mixto, base),
    categoriaGusto,
    totales,
    ranked,
  };
}

/**
 * Qué situación describe mejor el periodo. De esto depende si Nivis felicita,
 * comenta o reclama — y por eso nunca devuelve un caso de reclamo cuando el
 * gasto fue esencial.
 */
export function situacionDelPeriodo(m) {
  if (m.totalGastado === 0) return m.totalIngresos > 0 ? 'arranqueConIngresos' : 'arranque';

  const seExcedio = m.totalIngresos > 0 && m.totalGastado > m.totalIngresos;
  const casiTodoEsencial = m.porcentajeEsencial >= 70;
  // Sin gasto prescindible de por medio no hay nada que reclamar: si se pasó,
  // se pasó por la vida, no por antojo.
  const hayAlgoQueReclamar = m.porcentajePrescindible >= 15;

  if (seExcedio) {
    if (casiTodoEsencial || !hayAlgoQueReclamar) return 'excedidoEsencial';
    // Se pasó, y lo prescindible fue sobre todo comida fuera.
    return m.porcentajeGusto >= 15 ? 'excedido' : 'comidaFuera';
  }
  if (m.porcentajeGusto >= 35) return 'gustoAlto';
  if (porcentaje(m.antojo, m.totalGastado) >= 25) return 'comidaFuera';
  if (m.totalIngresos > 0 && m.porcentajeDelIngreso >= 85) return 'ajustado';
  if (casiTodoEsencial) return 'esencial';
  return 'sano';
}

/** El veredicto: el texto grande que resume el periodo con el tono elegido. */
export function construirVeredicto({ tono, metricas, etiquetaPeriodo }) {
  const t = normalizarTono(tono);
  const m = metricas;

  return textoDeVeredicto({
    tono: t,
    situacion: situacionDelPeriodo(m),
    hayIngresos: m.totalIngresos > 0,
    datos: {
      total: m.totalGastado,
      ingresos: m.totalIngresos,
      queda: Math.max(m.balance, 0),
      pct: m.porcentajeDelIngreso,
      gusto: m.puroGusto,
      pctGusto: m.porcentajeGusto,
      esencial: m.esencial,
      pctEsencial: m.porcentajeEsencial,
      antojo: m.antojo,
      ahorro: m.antojo * 0.4,
      top: m.categoriaTop,
      // Lo que Nivis señala en un reclamo: jamás una categoría esencial.
      topGusto: m.categoriaGusto || m.categoriaTop,
      etiquetaPeriodo,
    },
  });
}

/**
 * Qué situación describe un día suelto (00:00 a 23:59 de esa fecha).
 *
 * `promedio` es lo que esa persona gasta en un día normal: sin esa referencia
 * no hay forma honesta de decir si un día fue caro. Y como en el periodo,
 * ninguna situación de reclamo se alcanza cuando el día fue de puras
 * necesidades.
 */
export function situacionDelDia(m, promedio) {
  if (m.totalGastado === 0) return m.totalIngresos > 0 ? 'soloIngresos' : 'sinNada';

  if (m.porcentajeEsencial >= 70) return 'esencial';
  if (m.porcentajeGusto >= 40) return 'antojos';
  if (porcentaje(m.antojo, m.totalGastado) >= 40) return 'comidaFuera';
  // Solo se llama "caro" si hay con qué comparar y el exceso no fue esencial.
  if (promedio > 0 && m.totalGastado >= promedio * 2) return 'caro';
  return 'tranquilo';
}

/** El resumen que Nivis da al abrir un día en el calendario. */
export function construirResumenDeDia({ tono, fecha, metricas, promedio }) {
  const t = normalizarTono(tono);
  const m = metricas;

  return textoDeDia({
    tono: t,
    situacion: situacionDelDia(m, promedio),
    datos: {
      dia: etiquetaLargaDeFecha(fecha),
      total: m.totalGastado,
      ingresos: m.totalIngresos,
      movimientos: m.numeroDeGastos,
      gusto: m.puroGusto,
      pctGusto: m.porcentajeGusto,
      esencial: m.esencial,
      pctEsencial: m.porcentajeEsencial,
      antojo: m.antojo,
      top: m.categoriaTop,
      topGusto: m.categoriaGusto || m.categoriaTop,
      promedio,
      veces: promedio > 0 ? (m.totalGastado / promedio).toFixed(1) : '—',
    },
  });
}

/** Los consejos que la tarjeta de Nivis va rotando, ya en el tono del usuario. */
export function construirConsejos({ tono, metricas, gastos }) {
  const suscripciones = gastos
    .filter((g) => RE_SUSCRIPCIONES.test(g.label))
    .reduce((a, g) => a + g.monto, 0);
  const delivery = gastos.filter((g) => RE_DELIVERY.test(g.label)).reduce((a, g) => a + g.monto, 0);

  return textosDeConsejo({
    tono: normalizarTono(tono),
    totales: metricas.totales,
    total: metricas.totalGastado || 1,
    ranked: metricas.ranked,
    ingresos: metricas.totalIngresos,
    gusto: metricas.puroGusto,
    delivery,
    suscripciones,
  });
}

/**
 * El desglose de ingresos: cuánto vino de cada fuente y por qué vale la pena
 * seguirle. Es la mitad motivadora de la app — la que no regaña.
 */
export function construirIngresos({ tono, ingresos, totalGastado }) {
  const t = normalizarTono(tono);
  const total = ingresos.reduce((a, i) => a + i.monto, 0);

  const fuentes = FUENTES.map((fuente) => {
    const propios = ingresos.filter((i) => i.fuente === fuente);
    return {
      fuente,
      total: propios.reduce((a, i) => a + i.monto, 0),
      movimientos: propios.length,
      porcentaje: porcentaje(
        propios.reduce((a, i) => a + i.monto, 0),
        total,
      ),
      mensaje: mensajeDeFuente(fuente, t),
    };
  })
    .filter((f) => f.movimientos > 0)
    .sort((a, b) => b.total - a.total);

  const mejor = fuentes[0];

  const titular = mejor
    ? TITULAR_INGRESOS.conDatos[t]({
        total: dinero(total),
        mejor: mejor.fuente,
        pctMejor: mejor.porcentaje,
      })
    : TITULAR_INGRESOS.vacio[t];

  // Sin ingresos anotados no hay comparación honesta que hacer.
  let estado = null;
  if (total > 0) {
    if (totalGastado > total) estado = 'corto';
    else if (total - totalGastado < total * 0.15) estado = 'parejo';
    else estado = 'creciendo';
  }

  return {
    total,
    titular,
    fuentes,
    cierre: estado ? CIERRE_INGRESOS[estado][t] : null,
    estado,
  };
}

/** Mensaje efímero que aparece al registrar un gasto. */
export function mensajeDeGasto({ tono, categoria, label, monto }) {
  return textoDeGasto({
    tono: normalizarTono(tono),
    categoria,
    monto,
    vibra: vibraDeGasto({ categoria, label }),
  });
}

/** Mensaje efímero al registrar un ingreso. */
export function mensajeDeIngreso({ tono, fuente, monto }) {
  return textoDeIngreso({ tono: normalizarTono(tono), fuente, monto });
}

/**
 * Lo que Nivis dice al terminar de leer un ticket, antes de que el usuario
 * revise nada. Acompaña la revisión; no decide ni registra.
 *
 * La situación sale de lo que se pudo extraer, no del tono: primero se decide
 * QUÉ hay que decir y voz.js decide CÓMO, igual que en el resto de la app.
 */
export function mensajeDeTicket({ tono, borrador }) {
  const { faltantes, nivel, categoria, comercio } = borrador;

  const situacion =
    faltantes.length === CAMPOS_DE_TICKET.length
      ? 'vacio'
      : nivel === 'baja'
        ? 'dudoso'
        : faltantes.length
          ? 'parcial'
          : 'completo';

  return textoDeTicket({
    tono: normalizarTono(tono),
    situacion,
    // Sin categoría sugerida no hay forma de saberlo, y ante la duda Nivis se
    // guarda el reclamo: es la misma regla de siempre.
    esencial: !categoria || vibraDeGasto({ categoria, label: comercio || '' }) === 'vale',
  });
}
