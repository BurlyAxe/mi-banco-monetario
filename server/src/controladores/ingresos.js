import { Ingreso } from '../modelos/Ingreso.js';
import { ErrorHttp, asincrono } from '../middleware/errores.js';
import { rangoDePeriodo, hoyISO } from '../dominio/fechas.js';
import { mensajeDeIngreso } from '../dominio/analisis.js';

export const listar = asincrono(async (req, res) => {
  const { periodo, hoy } = req.datosConsulta;
  const rango = rangoDePeriodo(periodo, hoy || hoyISO());

  const ingresos = await Ingreso.find({
    usuario: req.usuario.id,
    fecha: { $gte: rango.desde, $lte: rango.hasta },
  }).sort({ fecha: -1, _id: -1 });

  res.json({ periodo, rango, ingresos: ingresos.map((i) => i.aJSON()) });
});

export const crear = asincrono(async (req, res) => {
  const { label, fuente, monto, fecha } = req.body;

  const ingreso = await Ingreso.create({
    usuario: req.usuario.id,
    label: label || fuente,
    fuente,
    monto,
    fecha,
  });

  res.status(201).json({
    ingreso: ingreso.aJSON(),
    mensaje: mensajeDeIngreso({ tono: req.usuario.tono, fuente, monto }),
  });
});

/** Corrige el nombre o el monto de un ingreso ya anotado. Ver gastos.actualizar. */
export const actualizar = asincrono(async (req, res) => {
  const ingreso = await Ingreso.findOneAndUpdate(
    { _id: req.params.id, usuario: req.usuario.id },
    req.body,
    { new: true, runValidators: true },
  );
  if (!ingreso) throw new ErrorHttp(404, 'Ese ingreso ya no existe');
  res.json({ ingreso: ingreso.aJSON() });
});

export const eliminar = asincrono(async (req, res) => {
  const ingreso = await Ingreso.findOneAndDelete({ _id: req.params.id, usuario: req.usuario.id });
  if (!ingreso) throw new ErrorHttp(404, 'Ese ingreso ya no existe');
  res.json({ ok: true, id: req.params.id });
});
