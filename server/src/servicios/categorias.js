/**
 * De dónde salen las categorías.
 *
 * Hoy viven en una constante del dominio, pero todo lo que las consume pasa
 * por aquí. El día que sean una colección de Mongo —categorías propias de cada
 * usuario, por ejemplo— cambia esta función y nada más: el lector de tickets
 * arma su enum con lo que esto devuelva, sin enterarse de dónde vino.
 *
 * Por eso es `async` aunque hoy no espere nada: si mañana consulta la base, la
 * firma no cambia y ningún llamador se rompe.
 */
import { CATEGORIAS } from '../dominio/constantes.js';

/** @returns {Promise<string[]>} Todas las categorías disponibles, en orden. */
export async function obtenerCategorias() {
  return CATEGORIAS;
}
