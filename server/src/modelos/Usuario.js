import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { TONOS, GRAFICAS, normalizarTono } from '../dominio/constantes.js';

const ajustesSchema = new mongoose.Schema(
  {
    // Sin `default`: así el valor legado de `nivelRoast` todavía puede ganar.
    tono: { type: String, enum: TONOS },
    // Cuentas creadas antes de los cuatro tonos. Solo se lee, nunca se escribe.
    nivelRoast: { type: String },
    colorAcento: { type: String, default: '#1F7FC4', match: /^#[0-9A-Fa-f]{6}$/ },
    graficaPorDefecto: { type: String, enum: GRAFICAS, default: 'Dona' },
  },
  { _id: false },
);

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 60 },
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    contrasenaHash: { type: String, required: true, select: false },
    ajustes: { type: ajustesSchema, default: () => ({}) },
  },
  { timestamps: true },
);

usuarioSchema.methods.verificarContrasena = function (contrasena) {
  return bcrypt.compare(contrasena, this.contrasenaHash);
};

usuarioSchema.statics.hashearContrasena = function (contrasena) {
  return bcrypt.hash(contrasena, 10);
};

/** Iniciales para el avatar del encabezado: "Ana Sofía" → "AS". */
usuarioSchema.virtual('iniciales').get(function () {
  return this.nombre
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});

/** El tono vigente, ya resolviendo las cuentas viejas con `nivelRoast`. */
usuarioSchema.virtual('tono').get(function () {
  return normalizarTono(this.ajustes.tono || this.ajustes.nivelRoast);
});

usuarioSchema.methods.aJSON = function () {
  return {
    id: this._id.toString(),
    nombre: this.nombre,
    correo: this.correo,
    iniciales: this.iniciales,
    ajustes: {
      tono: this.tono,
      colorAcento: this.ajustes.colorAcento,
      graficaPorDefecto: this.ajustes.graficaPorDefecto,
    },
  };
};

export const Usuario = mongoose.model('Usuario', usuarioSchema);
