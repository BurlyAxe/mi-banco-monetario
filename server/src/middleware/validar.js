import { ErrorHttp } from './errores.js';

/**
 * Valida req.body / req.query con un esquema de zod y reemplaza el original
 * por el valor ya parseado (con defaults y coerciones aplicados).
 */
export const validar = (esquema, fuente = 'body') => (req, _res, next) => {
  const resultado = esquema.safeParse(req[fuente]);
  if (!resultado.success) {
    const detalles = resultado.error.issues.map((i) => `${i.path.join('.') || fuente}: ${i.message}`);
    return next(new ErrorHttp(400, 'Los datos enviados no son válidos', detalles));
  }
  if (fuente === 'query') req.datosConsulta = resultado.data;
  else req[fuente] = resultado.data;
  next();
};
