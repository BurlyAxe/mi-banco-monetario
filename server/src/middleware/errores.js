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

/**
 * Con qué código responder.
 *
 * `estado` es el nuestro, pero Express y body-parser marcan sus propios fallos
 * con `status`/`statusCode`, y esos hay que respetarlos: un JSON mal escrito o
 * un cuerpo demasiado grande son culpa de quien pide, no del servidor. Tomarlos
 * por 500 ensucia la bitácora con errores que no lo son y esconde los de verdad.
 */
const codigoDeError = (err) => {
  if (Number.isInteger(err.estado)) return err.estado;
  const heredado = err.status ?? err.statusCode;
  return Number.isInteger(heredado) && heredado >= 400 && heredado < 600 ? heredado : 500;
};

/** Los fallos de body-parser dichos en español y sin jerga de librería. */
const MENSAJE_DE_CUERPO = {
  'entity.parse.failed': 'El cuerpo de la petición no es JSON válido',
  'entity.too.large': 'La petición es demasiado grande',
};

// eslint-disable-next-line no-unused-vars -- Express identifica el manejador de errores por sus 4 parámetros.
export const manejadorDeErrores = (err, req, res, next) => {
  let estado = codigoDeError(err);
  let mensaje = MENSAJE_DE_CUERPO[err.type] || err.message || 'Error inesperado';
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
