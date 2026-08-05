import { env } from './config/env.js';
import { conectarBaseDeDatos, cerrarBaseDeDatos } from './config/db.js';
import { crearApp } from './app.js';

async function arrancar() {
  await conectarBaseDeDatos();

  const servidor = crearApp().listen(env.puerto, () => {
    console.log(`API de Mi banco monetario escuchando en http://localhost:${env.puerto}/api`);
  });

  const apagar = async (senal) => {
    console.log(`\n${senal} recibido, cerrando…`);
    servidor.close(async () => {
      await cerrarBaseDeDatos();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => apagar('SIGINT'));
  process.on('SIGTERM', () => apagar('SIGTERM'));
}

arrancar().catch((err) => {
  console.error('No se pudo arrancar el servidor:', err.message);
  process.exit(1);
});
