import { colorDeCategoria } from './constantes';

const RADIO = 72;
export const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

/**
 * Convierte los totales por categoría en los gajos de la dona (y las barras).
 * El truco de la dona es dibujar cada gajo como un círculo completo con
 * stroke-dasharray: un tramo pintado del largo del gajo y el resto vacío,
 * corrido con stroke-dashoffset hasta donde termina el gajo anterior.
 */
export function calcularGajos({ ranked, totales, total, seleccion, acento }) {
  const base = total || 1;
  const maxCategoria = totales[ranked[0]] || 1;
  let acumulado = 0;

  // Una categoría sin gasto no es un gajo de grosor cero: simplemente no está.
  return ranked
    .filter((categoria) => totales[categoria] > 0)
    .map((categoria) => {
      const fraccion = totales[categoria] / base;
      // −2.5 deja un respiro entre gajos para que se distingan sin borde.
      const largo = Math.max(CIRCUNFERENCIA * fraccion - 2.5, 0);
      const desfase = -CIRCUNFERENCIA * acumulado;
      acumulado += fraccion;

      const encendido = !seleccion || seleccion === categoria;

      return {
        categoria,
        color: categoria === ranked[0] ? acento : colorDeCategoria(categoria, ranked),
        monto: totales[categoria],
        pct: Math.round(fraccion * 100),
        dash: `${largo} ${CIRCUNFERENCIA - largo}`,
        desfase,
        grosor: seleccion === categoria ? 32 : 24,
        opacidad: encendido ? 1 : 0.28,
        anchoBarra: Math.max((totales[categoria] / maxCategoria) * 100, 1.5),
      };
    });
}
