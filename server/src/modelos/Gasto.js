import mongoose from 'mongoose';
import { CATEGORIAS } from '../dominio/constantes.js';
import { esFechaISO, esHoraISO } from '../dominio/fechas.js';

const gastoSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    categoria: { type: String, required: true, enum: CATEGORIAS },
    monto: { type: Number, required: true, min: 0.01 },
    // Texto "YYYY-MM-DD" / "HH:mm": ver el comentario en dominio/fechas.js.
    fecha: { type: String, required: true, validate: { validator: esFechaISO, message: 'Fecha inválida' } },
    hora: { type: String, required: true, default: '12:00', validate: { validator: esHoraISO, message: 'Hora inválida' } },
  },
  { timestamps: true },
);

// El acceso siempre es "los gastos de este usuario en esta ventana de fechas".
gastoSchema.index({ usuario: 1, fecha: -1, hora: -1 });

gastoSchema.methods.aJSON = function () {
  return {
    id: this._id.toString(),
    label: this.label,
    categoria: this.categoria,
    monto: this.monto,
    fecha: this.fecha,
    hora: this.hora,
  };
};

export const Gasto = mongoose.model('Gasto', gastoSchema);
