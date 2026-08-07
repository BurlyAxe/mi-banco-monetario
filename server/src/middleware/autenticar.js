import jwt from 'jsonwebtoken';
import { env, faltanVariables } from '../config/env.js';
import { Usuario } from '../modelos/Usuario.js';
import { ErrorHttp, asincrono } from './errores.js';

/**
 * En producción sin `JWT_SECRET` puesto, el secreto es el de desarrollo: una
 * cadena escrita en el repositorio. Cualquiera que lo lea puede fabricarse una
 * sesión a nombre de quien quiera y entrar a las cuentas ajenas.
 *
 * Así que aquí se cierra la puerta en lugar de dejarla entornada. Quedarse sin
 * poder entrar es un problema; poder entrar a la cuenta de otro es un problema
 * mucho peor, y el mensaje dice exactamente qué configurar para arreglarlo.
 */
const secretoInseguro = () => faltanVariables().includes('JWT_SECRET');

const exigirSecreto = () => {
  if (secretoInseguro()) {
    throw new ErrorHttp(
      503,
      'El servidor no tiene configurada JWT_SECRET, así que no puede abrir sesiones de forma segura. Ponla en las variables de entorno del despliegue.',
    );
  }
};

export const firmarToken = (usuarioId) => {
  exigirSecreto();
  return jwt.sign({ sub: usuarioId }, env.jwtSecret, { expiresIn: env.jwtExpiraEn });
};

/** Exige un `Authorization: Bearer <token>` válido y deja el usuario en req.usuario. */
export const autenticar = asincrono(async (req, _res, next) => {
  // Antes que nada: un token firmado con el secreto público vale lo mismo que
  // ninguno, y aceptarlo es justo lo que no se puede permitir.
  exigirSecreto();

  const encabezado = req.headers.authorization || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7).trim() : null;
  if (!token) throw new ErrorHttp(401, 'Necesitas iniciar sesión');

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ErrorHttp(401, 'Tu sesión expiró, vuelve a entrar');
  }

  const usuario = await Usuario.findById(payload.sub);
  if (!usuario) throw new ErrorHttp(401, 'Tu sesión ya no es válida');

  req.usuario = usuario;
  next();
});
