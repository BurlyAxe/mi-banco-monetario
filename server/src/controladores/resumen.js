import { Gasto } from '../modelos/Gasto.js';
import { Ingreso } from '../modelos/Ingreso.js';
import { asincrono } from '../middleware/errores.js';
import { rangoDePeriodo, hoyISO } from '../dominio/fechas.js';
import { ETIQUETAS_PERIODO, vibraDeGasto } from '../dominio/constantes.js';
import { medir, construirVeredicto, construirConsejos, construirIngresos } from '../dominio/analisis.js';
import { ETIQUETA_CONSEJO } from '../dominio/voz.js';

/**
 * Todo lo que el panel necesita en una sola llamada: movimientos del periodo,
 * totales por categoría, el veredicto, los consejos y el desglose de ingresos.
 *
 * El análisis se hace aquí (y no en el cliente) para que el veredicto sea el
 * mismo desde cualquier dispositivo; el cliente solo lo pinta y filtra.
 */
export const resumen = asincrono(async (req, res) => {
  const { periodo, hoy: hoyCliente } = req.datosConsulta;
  const hoy = hoyCliente || hoyISO();
  const rango = rangoDePeriodo(periodo, hoy);
  const etiquetas = ETIQUETAS_PERIODO[periodo];
  const filtro = { usuario: req.usuario.id, fecha: { $gte: rango.desde, $lte: rango.hasta } };
  const tono = req.usuario.tono;

  // Del más reciente al más antiguo, con el _id de desempate: así el gasto
  // recién anotado aparece encima del anterior aunque compartan hora.
  const [gastosDoc, ingresosDoc] = await Promise.all([
    Gasto.find(filtro).sort({ fecha: -1, hora: -1, _id: -1 }),
    Ingreso.find(filtro).sort({ fecha: -1, _id: -1 }),
  ]);

  // La vibra viaja con cada gasto para que el cliente no tenga que recalcular
  // el rescate por nombre (la despensa cargada en "Comida" sigue siendo despensa).
  const gastos = gastosDoc.map((g) => ({ ...g.aJSON(), vibra: vibraDeGasto(g) }));
  const ingresos = ingresosDoc.map((i) => i.aJSON());

  const metricas = medir({ gastos, ingresos, dias: rango.dias });
  const { totales, ranked, ...resto } = metricas;

  res.json({
    hoy,
    periodo,
    rango,
    etiquetas,
    tono,
    gastos,
    ingresos,
    totales,
    ranked,
    metricas: resto,
    veredicto: construirVeredicto({ tono, metricas, etiquetaPeriodo: etiquetas.label }),
    etiquetaConsejo: ETIQUETA_CONSEJO[tono],
    consejos: construirConsejos({ tono, metricas, gastos }),
    desgloseIngresos: construirIngresos({
      tono,
      ingresos,
      totalGastado: metricas.totalGastado,
    }),
  });
});
