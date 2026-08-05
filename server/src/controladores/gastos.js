import { Gasto } from '../modelos/Gasto.js';
import { ErrorHttp, asincrono } from '../middleware/errores.js';
import { rangoDePeriodo, hoyISO } from '../dominio/fechas.js';
import { mensajeDeGasto, mensajeDeTicket } from '../dominio/analisis.js';
import { ETIQUETA_NIVEL } from '../dominio/ticket.js';
import { leerTicket } from '../servicios/lectorDeTickets.js';

/**
 * Gastos del periodo pedido, del más reciente al más viejo: lo último que
 * anotaste va siempre arriba. El `_id` desempata dentro del mismo minuto —los
 * ObjectId llevan la marca de creación—, para que un gasto nuevo nunca se
 * cuele debajo de otro que ya estaba.
 */
export const listar = asincrono(async (req, res) => {
  const { periodo, hoy } = req.datosConsulta;
  const rango = rangoDePeriodo(periodo, hoy || hoyISO());

  const gastos = await Gasto.find({
    usuario: req.usuario.id,
    fecha: { $gte: rango.desde, $lte: rango.hasta },
  }).sort({ fecha: -1, hora: -1, _id: -1 });

  res.json({ periodo, rango, gastos: gastos.map((g) => g.aJSON()) });
});

export const crear = asincrono(async (req, res) => {
  const { label, categoria, monto, fecha, hora } = req.body;

  const gasto = await Gasto.create({
    usuario: req.usuario.id,
    // Sin nota, el gasto se llama como su categoría (igual que en el diseño).
    label: label || categoria,
    categoria,
    monto,
    fecha,
    hora,
  });

  res.status(201).json({
    gasto: gasto.aJSON(),
    // El nombre importa: "Compras: shampoo" es una necesidad, no un antojo.
    mensaje: mensajeDeGasto({
      tono: req.usuario.tono,
      categoria,
      label: gasto.label,
      monto,
    }),
  });
});

/**
 * Lee la foto de un ticket y devuelve un borrador de gasto. NO REGISTRA NADA.
 *
 * Esto es a propósito y es la decisión central de la función: la IA propone,
 * el usuario dispone. Lo que vuelve es exactamente lo mismo que el usuario
 * habría tecleado, para que lo revise, lo corrija y —si quiere— lo mande por
 * el POST /gastos de siempre. Si nunca presiona Guardar, aquí no pasó nada.
 *
 * El controlador se queda en lo suyo: leer la petición, delegar y responder.
 * Los pasos de verdad viven en servicios/lectorDeTickets.js.
 */
export const desdeTicket = asincrono(async (req, res) => {
  const hoy = req.datosConsulta?.hoy || hoyISO();
  const borrador = await leerTicket({ archivo: req.file, hoy });

  res.json({
    ticket: borrador,
    etiquetaConfianza: ETIQUETA_NIVEL[borrador.nivel],
    // Nivis acompaña la revisión en el tono del usuario; no decide por él.
    mensaje: mensajeDeTicket({ tono: req.usuario.tono, borrador }),
  });
});

/**
 * Corrige el nombre o el monto de un gasto que ya estaba anotado.
 *
 * El filtro lleva el usuario además del id: sin eso, cualquiera con un id
 * ajeno podría editar el gasto de otro. Al no encontrar nada no se distingue
 * entre "no existe" y "no es tuyo", que es justo lo que se quiere.
 *
 * No devuelve mensaje de Nivis: corregir un dedazo no es un gasto nuevo y no
 * merece otro comentario sobre el mismo dinero.
 */
export const actualizar = asincrono(async (req, res) => {
  const gasto = await Gasto.findOneAndUpdate(
    { _id: req.params.id, usuario: req.usuario.id },
    req.body,
    { new: true, runValidators: true },
  );
  if (!gasto) throw new ErrorHttp(404, 'Ese gasto ya no existe');
  res.json({ gasto: gasto.aJSON() });
});

export const eliminar = asincrono(async (req, res) => {
  const gasto = await Gasto.findOneAndDelete({ _id: req.params.id, usuario: req.usuario.id });
  if (!gasto) throw new ErrorHttp(404, 'Ese gasto ya no existe');
  res.json({ ok: true, id: req.params.id });
});
