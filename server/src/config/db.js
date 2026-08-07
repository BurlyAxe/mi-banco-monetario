import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

/**
 * Por qué no se pudo conectar la última vez, en una línea.
 *
 * Existe para que `/api/salud` pueda contestarlo. Cuando el API vive en una
 * función serverless, el `console.error` del fallo se queda en los registros
 * del proveedor: para saber por qué no entra la app hay que ir a buscarlo a un
 * panel, con sesión iniciada, y eso convierte "¿ya quedó?" en una expedición.
 * Aquí se guarda lo justo para poder preguntárselo al propio servidor desde el
 * navegador, que es donde uno ya está mirando.
 */
let ultimoFallo = null;

export const anotarFalloDeConexion = (err) => {
  ultimoFallo = err ? `${err.name}: ${err.message}`.slice(0, 300) : null;
};

/**
 * Qué tan viva está la base ahora mismo.
 *
 * No devuelve la URI ni nada que lleve credenciales: el nombre del host ya va
 * en la cadena pública del cluster, y el motivo del fallo es el mensaje del
 * driver, que dice "no llegué" pero nunca con qué llave lo intentó.
 */
export function estadoDeLaBase() {
  const estados = ['desconectada', 'conectada', 'conectando', 'desconectando'];
  const estado = estados[mongoose.connection.readyState] || 'desconocido';
  return {
    estado,
    ...(mongoose.connection.host ? { host: mongoose.connection.host } : {}),
    ...(estado !== 'conectada' && ultimoFallo ? { motivo: ultimoFallo } : {}),
  };
}

export async function conectarBaseDeDatos() {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  } catch (err) {
    anotarFalloDeConexion(err);
    throw err;
  }
  anotarFalloDeConexion(null);
  const { host, name } = mongoose.connection;
  console.log(`MongoDB conectado → ${host}/${name}`);
  return mongoose.connection;
}

export async function cerrarBaseDeDatos() {
  await mongoose.connection.close();
}
