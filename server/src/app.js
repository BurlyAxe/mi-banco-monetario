import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env, esProduccion } from './config/env.js';
import { rutas } from './rutas/index.js';
import { ErrorHttp, noEncontrado, manejadorDeErrores } from './middleware/errores.js';

// En desarrollo aceptamos también la IP de la red local, para poder abrir la
// app desde el celular (http://192.168.x.x:5173) sin tocar la configuración.
const RED_LOCAL = /^http:\/\/(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)[\d.]*(:\d+)?$/;

/**
 * ¿La petición viene de la propia página que sirve este servidor?
 *
 * Cuando el cliente y el API comparten dominio —lo normal al desplegar en
 * Vercel— el navegador manda `Origin` en los POST aunque no esté cruzando a
 * ningún sitio. Y ese origen es el del despliegue, que no tiene por qué estar
 * en ninguna lista: CORS_ORIGIN cae por defecto en localhost:5173, así que la
 * app publicada se rechazaba a sí misma con un 403 al intentar entrar. Pedir
 * una variable más para arreglarlo seria trasladarle al de al lado una trampa
 * que se puede quitar aquí: esto no es una peticion cruzada, y CORS existe
 * para las que sí lo son.
 *
 * `x-forwarded-host` primero porque detrás de un proxy —Vercel lo es— `host`
 * es el del interior, no el que tecleó el usuario.
 */
const esElMismoSitio = (origen, req) => {
  try {
    return new URL(origen).host === (req.headers['x-forwarded-host'] || req.headers.host);
  } catch {
    return false; // un Origin que ni siquiera es una URL
  }
};

/**
 * `cors` acepta una función que recibe la petición entera, y hace falta: sin
 * ella no hay forma de comparar el origen contra el dominio por el que entró.
 */
const politicaDeCors = (req, callback) => {
  const origen = req.headers.origin;
  const permitir = () => callback(null, { origin: true, credentials: false });

  if (!origen) return permitir(); // apps nativas, curl, health checks
  if (esElMismoSitio(origen, req)) return permitir();
  if (env.origenesCors.includes(origen)) return permitir();
  if (!esProduccion && RED_LOCAL.test(origen)) return permitir();

  // Un 403, no un Error pelón: sin código propio esto terminaba contado como
  // un 500 —o sea, como si el servidor se hubiera roto— cuando en realidad es
  // una petición rechazada a propósito. Tampoco se repite el origen recibido
  // en la respuesta: es texto que eligió quien llama y no aporta nada.
  return callback(new ErrorHttp(403, 'Origen no permitido por CORS'));
};

export function crearApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors(politicaDeCors));
  app.use(express.json({ limit: '100kb' }));
  if (!esProduccion) app.use(morgan('dev'));

  app.use('/api', rutas);

  app.use(noEncontrado);
  app.use(manejadorDeErrores);

  return app;
}
