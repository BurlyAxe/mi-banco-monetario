import mongoose from 'mongoose';
import { FUENTES } from '../dominio/constantes.js';
import { esFechaISO } from '../dominio/fechas.js';

const ingresoSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    fuente: { type: String, required: true, enum: FUENTES },
    monto: { type: Number, required: true, min: 0.01 },
    fecha: { type: String, required: true, validate: { validator: esFechaISO, message: 'Fecha inválida' } },
  },
  { timestamps: true },
);

ingresoSchema.index({ usuario: 1, fecha: -1 });

ingresoSchema.methods.aJSON = function () {
  return {
    id: this._id.toString(),
    label: this.label,
    fuente: this.fuente,
    monto: this.monto,
    fecha: this.fecha,
  };
};

export const Ingreso = mongoose.model('Ingreso', ingresoSchema);
