import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env, esProduccion } from './config/env.js';
import { rutas } from './rutas/index.js';
import { noEncontrado, manejadorDeErrores } from './middleware/errores.js';

// En desarrollo aceptamos también la IP de la red local, para poder abrir la
// app desde el celular (http://192.168.x.x:5173) sin tocar la configuración.
const RED_LOCAL = /^http:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)[\d.]*(:\d+)?$/;

const origenPermitido = (origen, callback) => {
  if (!origen) return callback(null, true); // apps nativas, curl, health checks
  if (env.origenesCors.includes(origen)) return callback(null, true);
  if (!esProduccion && RED_LOCAL.test(origen)) return callback(null, true);
  return callback(new Error(`Origen no permitido por CORS: ${origen}`));
};

export function crearApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: origenPermitido }));
  app.use(express.json({ limit: '100kb' }));
  if (!esProduccion) app.use(morgan('dev'));

  app.use('/api', rutas);

  app.use(noEncontrado);
  app.use(manejadorDeErrores);

  return app;
}
