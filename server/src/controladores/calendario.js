/**
 * Volver a días que ya pasaron.
 *
 * Un día es exactamente `fecha === "YYYY-MM-DD"`: de las 00:00 a las 23:59 de
 * ese día, en el reloj de quien anotó. No hay ventana que recortar porque la
 * fecha se guarda aparte de la hora (ver dominio/fechas.js), así que un gasto
 * de las 23:50 nunca se recorre al día siguiente.
 */
import { Gasto } from '../modelos/Gasto.js';
import { Ingreso } from '../modelos/Ingreso.js';
import { asincrono } from '../middleware/errores.js';
import {
  INICIO_DEL_DIA,
  FIN_DEL_DIA,
  hoyISO,
  sumarDias,
  rangoDeMes,
  mesDeFecha,
} from '../dominio/fechas.js';
import { vibraDeGasto } from '../dominio/constantes.js';
import { medir, construirResumenDeDia } from '../dominio/analisis.js';
import { etiquetaLargaDeFecha, etiquetaDeMes } from '../dominio/formato.js';
import { ETIQUETA_DIA } from '../dominio/voz.js';

/** Días que se miran hacia atrás para saber cómo es un día normal de esta persona. */
const VENTANA_PROMEDIO = 30;

/**
 * Lo que gasta esta persona en un día cualquiera, mirando los 30 días que
 * terminan en la fecha consultada. Es la única referencia honesta para decir
 * "ese día te saliste de lo tuyo": comparar contra un número inventado no dice nada.
 */
async function promedioDiario(usuarioId, fecha) {
  const [fila] = await Gasto.aggregate([
    {
      $match: {
        usuario: usuarioId,
        fecha: { $gte: sumarDias(fecha, -(VENTANA_PROMEDIO - 1)), $lte: fecha },
      },
    },
    { $group: { _id: null, total: { $sum: '$monto' } } },
  ]);

  return (fila?.total || 0) / VENTANA_PROMEDIO;
}

/** Todo lo que pasó en un día concreto, más lo que Nivis opina de él. */
export const dia = asincrono(async (req, res) => {
  const { fecha } = req.datosConsulta;
  const usuarioId = req.usuario._id;

  const [gastosDoc, ingresosDoc, promedio] = await Promise.all([
    // Dentro del mismo día el orden también es del más reciente al más viejo.
    Gasto.find({ usuario: usuarioId, fecha }).sort({ hora: -1, _id: -1 }),
    Ingreso.find({ usuario: usuarioId, fecha }).sort({ _id: -1 }),
    promedioDiario(usuarioId, fecha),
  ]);

  const gastos = gastosDoc.map((g) => ({ ...g.aJSON(), vibra: vibraDeGasto(g) }));
  const ingresos = ingresosDoc.map((i) => i.aJSON());

  const metricas = medir({ gastos, ingresos, dias: 1 });
  const { totales, ranked, ...resto } = metricas;

  res.json({
    fecha,
    hoy: hoyISO(),
    // El día completo, explícito: quien lea la respuesta no tiene que adivinarlo.
    inicio: INICIO_DEL_DIA,
    fin: FIN_DEL_DIA,
    etiqueta: etiquetaLargaDeFecha(fecha),
    gastos,
    ingresos,
    totales,
    ranked,
    metricas: { ...resto, promedioDiario: promedio },
    etiquetaResumen: ETIQUETA_DIA[req.usuario.tono],
    resumen: construirResumenDeDia({ tono: req.usuario.tono, fecha, metricas, promedio }),
  });
});

/**
 * El mes entero para pintar la cuadrícula: cuánto se gastó cada día y cuántos
 * movimientos hubo. Se agrega en Mongo y no en el cliente porque el calendario
 * navega meses que ni siquiera están en el periodo cargado.
 */
export const mes = asincrono(async (req, res) => {
  const { mes: mesPedido } = req.datosConsulta;
  const usuarioId = req.usuario._id;
  const hoy = hoyISO();
  const mesElegido = mesPedido || mesDeFecha(hoy);
  const rango = rangoDeMes(mesElegido);
  const filtro = { usuario: usuarioId, fecha: { $gte: rango.desde, $lte: rango.hasta } };
  const porDia = [{ $match: filtro }, { $group: { _id: '$fecha', total: { $sum: '$monto' }, movimientos: { $sum: 1 } } }];

  // El día más viejo con algo anotado —gasto o ingreso—: el calendario no deja
  // retroceder más allá, porque atrás no hay nada que ver.
  const [gastosPorDia, ingresosPorDia, primerGasto, primerIngreso] = await Promise.all([
    Gasto.aggregate(porDia),
    Ingreso.aggregate(porDia),
    Gasto.findOne({ usuario: usuarioId }).sort({ fecha: 1 }).select('fecha').lean(),
    Ingreso.findOne({ usuario: usuarioId }).sort({ fecha: 1 }).select('fecha').lean(),
  ]);

  const primerMovimiento =
    [primerGasto?.fecha, primerIngreso?.fecha].filter(Boolean).sort()[0] || null;

  const gasto = new Map(gastosPorDia.map((d) => [d._id, d]));
  const ingreso = new Map(ingresosPorDia.map((d) => [d._id, d]));

  const dias = Array.from({ length: rango.dias }, (_, i) => {
    const fecha = sumarDias(rango.desde, i);
    return {
      fecha,
      total: gasto.get(fecha)?.total || 0,
      movimientos: gasto.get(fecha)?.movimientos || 0,
      ingresos: ingreso.get(fecha)?.total || 0,
    };
  });

  const conGasto = dias.filter((d) => d.total > 0);

  res.json({
    mes: mesElegido,
    etiqueta: etiquetaDeMes(mesElegido),
    hoy,
    rango,
    dias,
    total: conGasto.reduce((a, d) => a + d.total, 0),
    totalIngresos: dias.reduce((a, d) => a + d.ingresos, 0),
    diasConGasto: conGasto.length,
    // El pico del mes, para poder graduar la intensidad de cada cuadrito.
    maximo: conGasto.reduce((a, d) => Math.max(a, d.total), 0),
    primerMovimiento,
  });
});
