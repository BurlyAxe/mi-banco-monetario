/**
 * El API en Vercel.
 *
 * Es el MISMO Express de `server/src/app.js`: aquí no vive ni una regla de
 * negocio, solo lo que cambia entre una máquina que está siempre encendida y
 * una función que nace y muere con cada petición.
 *
 * ¿Por qué el nombre entre corchetes? Vercel enruta por archivo, y
 * `[...ruta].mjs` significa "cualquier ruta bajo /api, con los segmentos que
 * sea": /api/salud, /api/auth/login y /api/gastos/desde-ticket entran todas
 * aquí. Eso importa porque el archivo se resuelve ANTES que los `rewrites` de
 * vercel.json, así que el catch-all que manda todo a index.html —el que hace
 * funcionar las rutas del cliente— ya no se traga también las del API. Esa era
 * exactamente la razón por la que el sitio desplegado no servía: cualquier
 * /api/* devolvía la página de React con un 200, el navegador la tomaba por
 * una respuesta buena y la app se quedaba mirando al vacío.
 *
 * `.mjs` y no `.js` porque el código del servidor usa `import`, y el
 * package.json de la raíz no declara `"type": "module"`.
 */
import mongoose from 'mongoose';

import { env } from '../server/src/config/env.js';
import { crearApp } from '../server/src/app.js';

/**
 * La conexión a Mongo, compartida entre invocaciones.
 *
 * Una función serverless se congela entre peticiones en vez de morir, así que
 * la conexión que abrió la anterior sigue viva y hay que reaprovecharla:
 * conectar de cero en cada petición añadiría medio segundo a todas y agotaría
 * el tope de conexiones de Atlas en cuanto entraran dos usuarios a la vez.
 *
 * Se guarda la PROMESA, no la conexión: si llegan tres peticiones juntas con
 * la función recién despierta, las tres esperan el mismo intento en lugar de
 * abrir tres.
 */
let conexion = null;

function conectar() {
  if (!conexion) {
    conexion = mongoose
      .connect(env.mongoUri, {
        serverSelectionTimeoutMS: 8000,
        // El pool se queda corto a propósito: cada instancia de la función
        // abre el suyo, y Atlas cuenta el total. Más de un puñado por
        // instancia no acelera nada y sí agota el plan.
        maxPoolSize: 5,
      })
      // Un intento fallido no se guarda: si se cachea el rechazo, la función
      // se queda envenenada hasta que Vercel decida reciclarla.
      .catch((err) => {
        conexion = null;
        throw err;
      });
  }
  return conexion;
}

const app = crearApp();

/**
 * El 503 se escribe con las funciones de Node de toda la vida y no con los
 * atajos `res.status().json()` que añade Vercel: el resto de la app no depende
 * de ese envoltorio y esto tampoco debería, porque es justo la respuesta que
 * hay que poder probar fuera de Vercel — el día que la base no conteste, la
 * diferencia entre este mensaje y una función que revienta es que uno explica
 * qué revisar y la otra no.
 */
const responder503 = (res) => {
  const cuerpo = JSON.stringify({
    error:
      'La base de datos no está disponible. Revisa MONGODB_URI en las variables de entorno y que Atlas permita el acceso desde la red del servidor.',
  });
  res.writeHead(503, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
    'Cache-Control': 'no-store',
  });
  res.end(cuerpo);
};

export default async function handler(req, res) {
  try {
    await conectar();
  } catch (err) {
    console.error('[api] no se pudo conectar a MongoDB:', err.message);
    return responder503(res);
  }

  return app(req, res);
}
