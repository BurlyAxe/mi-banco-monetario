/**
 * El chat de apoyo con Nivis: plan de ahorro, plan de gastos y permisos.
 *
 * Cada mensaje se responde con el contexto financiero recién leído de la base,
 * no con lo que el cliente diga que tiene. Así Nivis nunca razona sobre saldos
 * que el navegador pudo alterar, y la conversación siempre habla de los
 * números de hoy.
 */
import { Gasto } from '../modelos/Gasto.js';
import { Ingreso } from '../modelos/Ingreso.js';
import { asincrono } from '../middleware/errores.js';
import { rangoDePeriodo, hoyISO } from '../dominio/fechas.js';
import { ETIQUETAS_PERIODO, vibraDeGasto } from '../dominio/constantes.js';
import { medir } from '../dominio/analisis.js';
import {
  construirPlan,
  instruccionNivis,
  respuestaLocal,
  saludoDeNivis,
  SUGERENCIAS,
  AVISO_SIN_GEMINI,
} from '../dominio/asesor.js';
import { generarTexto, geminiConfigurado } from '../servicios/gemini.js';

/** Lee los movimientos del periodo y arma métricas + plan de una sola vez. */
async function contextoDelUsuario(usuario, periodo, hoy) {
  const rango = rangoDePeriodo(periodo, hoy);
  const filtro = { usuario: usuario._id, fecha: { $gte: rango.desde, $lte: rango.hasta } };

  const [gastosDoc, ingresosDoc] = await Promise.all([
    Gasto.find(filtro).sort({ fecha: -1, hora: -1, _id: -1 }),
    Ingreso.find(filtro).sort({ fecha: -1, _id: -1 }),
  ]);

  const gastos = gastosDoc.map((g) => ({ ...g.aJSON(), vibra: vibraDeGasto(g) }));
  const ingresos = ingresosDoc.map((i) => i.aJSON());
  const metricas = medir({ gastos, ingresos, dias: rango.dias });

  return { rango, gastos, ingresos, metricas, plan: construirPlan({ metricas, hoy }) };
}

/**
 * Con qué abre la hoja de chat: el saludo de Nivis en el tono del usuario, el
 * plan ya calculado para pintarlo arriba y si Gemini está o no disponible.
 */
export const inicio = asincrono(async (req, res) => {
  const { periodo, hoy: hoyCliente } = req.datosConsulta;
  const hoy = hoyCliente || hoyISO();
  const { plan } = await contextoDelUsuario(req.usuario, periodo, hoy);

  res.json({
    hoy,
    periodo,
    plan,
    saludo: saludoDeNivis(req.usuario.tono),
    sugerencias: SUGERENCIAS,
    conGemini: geminiConfigurado(),
  });
});

/**
 * Un turno de conversación. El historial lo manda el cliente completo: el
 * servidor no guarda pláticas, solo las reenvía a Gemini junto al contexto.
 */
export const responder = asincrono(async (req, res) => {
  const { mensajes, periodo, hoy: hoyCliente } = req.body;
  const hoy = hoyCliente || hoyISO();
  const tono = req.usuario.tono;

  const { gastos, ingresos, metricas, plan } = await contextoDelUsuario(req.usuario, periodo, hoy);

  const responderLocal = (aviso) =>
    res.json({ texto: respuestaLocal({ tono, plan }), plan, fuente: 'local', aviso });

  if (!geminiConfigurado()) return responderLocal(AVISO_SIN_GEMINI.sinLlave);

  try {
    const texto = await generarTexto({
      instruccion: instruccionNivis({
        usuario: req.usuario.nombre,
        tono,
        plan,
        metricas,
        gastos,
        ingresos,
        hoy,
        etiquetaPeriodo: ETIQUETAS_PERIODO[periodo].label,
      }),
      mensajes,
    });

    res.json({ texto, plan, fuente: 'gemini' });
  } catch (err) {
    // Que Gemini falle no puede dejar al usuario sin respuesta: Nivis contesta
    // con el plan que calcula la app y se avisa que fue el respaldo.
    console.error('[nivis/chat]', err.message);
    responderLocal(AVISO_SIN_GEMINI.falla);
  }
});
