import { esProduccion } from '../config/env.js';

/** Error con código HTTP, para lanzar desde los controladores. */
export class ErrorHttp extends Error {
  constructor(estado, mensaje, detalles) {
    super(mensaje);
    this.estado = estado;
    this.detalles = detalles;
  }
}

export const noEncontrado = (req, res) => {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars -- Express identifica el manejador de errores por sus 4 parámetros.
export const manejadorDeErrores = (err, req, res, next) => {
  let estado = err.estado || 500;
  let mensaje = err.message || 'Error inesperado';
  let detalles = err.detalles;

  if (err.name === 'ValidationError') {
    estado = 400;
    mensaje = 'Los datos enviados no son válidos';
    detalles = Object.values(err.errors).map((e) => e.message);
  } else if (err.name === 'CastError') {
    estado = 400;
    mensaje = 'Identificador inválido';
  } else if (err.code === 11000) {
    estado = 409;
    mensaje = 'Ese correo ya está registrado';
  }

  if (estado >= 500) console.error(err);

  res.status(estado).json({
    error: mensaje,
    ...(detalles ? { detalles } : {}),
    ...(esProduccion || estado < 500 ? {} : { stack: err.stack }),
  });
};

/** Envuelve un controlador async para que sus rechazos lleguen al manejador de errores. */
export const asincrono = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
