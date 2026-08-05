import { Usuario } from '../modelos/Usuario.js';
import { firmarToken } from '../middleware/autenticar.js';
import { ErrorHttp, asincrono } from '../middleware/errores.js';

export const registrar = asincrono(async (req, res) => {
  const { nombre, correo, contrasena } = req.body;

  if (await Usuario.exists({ correo })) {
    throw new ErrorHttp(409, 'Ese correo ya está registrado. Inicia sesión.');
  }

  const usuario = await Usuario.create({
    nombre,
    correo,
    contrasenaHash: await Usuario.hashearContrasena(contrasena),
  });

  res.status(201).json({ token: firmarToken(usuario.id), usuario: usuario.aJSON() });
});

export const iniciarSesion = asincrono(async (req, res) => {
  const { correo, contrasena } = req.body;

  const usuario = await Usuario.findOne({ correo }).select('+contrasenaHash');
  // Mismo mensaje para correo inexistente y contraseña mala: no revelamos cuál falló.
  if (!usuario || !(await usuario.verificarContrasena(contrasena))) {
    throw new ErrorHttp(401, 'Correo o contraseña incorrectos');
  }

  res.json({ token: firmarToken(usuario.id), usuario: usuario.aJSON() });
});

export const yo = asincrono(async (req, res) => {
  res.json({ usuario: req.usuario.aJSON() });
});

export const actualizarAjustes = asincrono(async (req, res) => {
  const { nombre, ...ajustes } = req.body;
  const usuario = req.usuario;

  if (nombre !== undefined) usuario.nombre = nombre;
  for (const [clave, valor] of Object.entries(ajustes)) {
    if (valor !== undefined) usuario.ajustes[clave] = valor;
  }

  await usuario.save();
  res.json({ usuario: usuario.aJSON() });
});
