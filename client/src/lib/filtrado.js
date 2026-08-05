import { normalizar, dinero, etiquetaDeFecha } from './formato';
import { ETIQUETA_VIBRA, colorDeCategoria, vibraDeGasto } from './constantes';

const ES_NUMERO = /^[$\s]*[\d.,]+$/;

/**
 * Del más reciente al más antiguo: lo nuevo siempre queda encima de lo viejo.
 *
 * `fecha` y `hora` son texto ISO de ancho fijo, así que concatenarlos da una
 * llave que ordena sola. El `id` desempata: los ObjectId de Mongo llevan la
 * marca de tiempo de creación, así que dos gastos anotados en el mismo minuto
 * salen en el orden en que se registraron — el último anotado, arriba.
 */
export const masRecientePrimero = (a, b) =>
  (b.fecha + b.hora).localeCompare(a.fecha + a.hora) || String(b.id).localeCompare(String(a.id));

/**
 * Filtra los gastos del periodo por categoría, día y texto.
 *
 * Si lo escrito parece un monto, primero se buscan coincidencias exactas; si no
 * hay ninguna, se devuelven los cinco gastos de monto más cercano — es lo que
 * uno realmente quiere cuando busca "ese cargo de como 200".
 */
export function filtrarGastos({ gastos, seleccion, fecha, consulta, hoy }) {
  const q = consulta.trim();
  let resultado = gastos.filter(
    (g) => (!seleccion || g.categoria === seleccion) && (!fecha || g.fecha === fecha),
  );

  let aviso = '';
  let porCercania = false;

  if (q) {
    const numero = parseFloat(q.replace(/[$,\s]/g, ''));

    if (ES_NUMERO.test(q) && !Number.isNaN(numero)) {
      const exactos = resultado.filter((g) => Math.round(g.monto) === Math.round(numero));
      if (exactos.length) {
        resultado = exactos;
        aviso = `Coincidencia exacta de ${dinero(numero)}.`;
      } else {
        porCercania = true;
        resultado = [...resultado]
          .sort((a, b) => Math.abs(a.monto - numero) - Math.abs(b.monto - numero))
          .slice(0, 5);
        aviso = resultado.length ? `Nada por ${dinero(numero)} exactos. Esto es lo más cercano.` : '';
      }
    } else {
      const nq = normalizar(q);
      resultado = resultado.filter(
        (g) => normalizar(g.label).includes(nq) || normalizar(g.categoria).includes(nq),
      );
    }
  }

  if (!q && seleccion && !fecha) aviso = `Filtrando solo ${seleccion}.`;
  if (fecha) aviso = `${aviso ? aviso + ' ' : ''}Día: ${etiquetaDeFecha(fecha, hoy)}.`;

  // Con búsqueda por cercanía el orden es por proximidad al monto, no por fecha.
  const visibles = porCercania ? resultado : [...resultado].sort(masRecientePrimero);

  return { visibles, aviso, total: visibles.reduce((a, g) => a + g.monto, 0) };
}

/**
 * Agrupa los gastos visibles en bloques por día, con su subtotal.
 *
 * Respeta el orden en que vienen —que ya es del más reciente al más antiguo—,
 * así que el bloque de hoy queda arriba y el más viejo hasta abajo. Se usa un
 * Map y no "el último bloque" porque en la búsqueda por cercanía el orden es
 * por monto y un mismo día puede volver a aparecer más abajo.
 */
export function agruparPorDia(gastos, ranked, hoy) {
  const porFecha = new Map();

  for (const gasto of gastos) {
    let dia = porFecha.get(gasto.fecha);
    if (!dia) {
      dia = { fecha: gasto.fecha, label: etiquetaDeFecha(gasto.fecha, hoy), items: [], total: 0 };
      porFecha.set(gasto.fecha, dia);
    }
    dia.items.push({
      ...gasto,
      color: colorDeCategoria(gasto.categoria, ranked),
      etiquetaVibra: ETIQUETA_VIBRA[vibraDeGasto(gasto)] || '',
    });
    dia.total += gasto.monto;
  }

  return [...porFecha.values()];
}
