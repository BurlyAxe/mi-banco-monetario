import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function conectarBaseDeDatos() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  const { host, name } = mongoose.connection;
  console.log(`MongoDB conectado → ${host}/${name}`);
  return mongoose.connection;
}

export async function cerrarBaseDeDatos() {
  await mongoose.connection.close();
}
