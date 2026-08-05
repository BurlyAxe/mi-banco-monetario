import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Usuario } from '../modelos/Usuario.js';
import { ErrorHttp, asincrono } from './errores.js';

export const firmarToken = (usuarioId) =>
  jwt.sign({ sub: usuarioId }, env.jwtSecret, { expiresIn: env.jwtExpiraEn });

/** Exige un `Authorization: Bearer <token>` válido y deja el usuario en req.usuario. */
export const autenticar = asincrono(async (req, _res, next) => {
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
