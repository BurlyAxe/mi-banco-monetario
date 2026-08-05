/**
 * Carga una cuenta de demostración con movimientos de los últimos 28 días.
 *
 *   npm run seed
 *
 * Es idempotente: vuelve a dejar la cuenta demo exactamente igual cada vez.
 * Las fechas son relativas a hoy, así que "Semana" y "Quincena" siempre traen
 * datos; "Mes" trae lo que haya caído dentro del mes en curso.
 */
import { conectarBaseDeDatos, cerrarBaseDeDatos } from '../config/db.js';
import { Usuario } from '../modelos/Usuario.js';
import { Gasto } from '../modelos/Gasto.js';
import { Ingreso } from '../modelos/Ingreso.js';
import { hoyISO, sumarDias } from '../dominio/fechas.js';

const CORREO_DEMO = 'demo@mibanco.mx';
const CONTRASENA_DEMO = 'demo1234';

// [label, categoría, monto, días atrás, hora]
const GASTOS = [
  ['Rappi', 'Comida', 210, 1, '22:40'],
  ['Uber', 'Transporte', 68, 1, '09:12'],
  ['Soriana despensa', 'Despensa', 680, 2, '13:05'],
  ['Starbucks', 'Comida', 95, 2, '10:22'],
  ['Shampoo y detergente', 'Higiene y hogar', 240, 2, '13:20'],
  ['Boletos concierto', 'Entretenimiento', 620, 3, '20:15'],
  ['Shein', 'Compras', 399, 3, '01:38'],
  ['Netflix', 'Servicios', 219, 4, '06:00'],
  ['Gasolina Pemex', 'Transporte', 500, 4, '08:41'],
  ['Sushi con los cuates', 'Comida', 420, 5, '21:30'],
  ['Bar de la esquina', 'Entretenimiento', 168, 5, '23:50'],
  ['Amazon audífonos', 'Compras', 449, 6, '16:20'],
  ['Uber', 'Transporte', 112, 6, '19:05'],
  ['Rappi', 'Comida', 265, 7, '23:12'],
  ['Curso Domestika', 'Educación', 149, 7, '11:00'],
  ['CFE luz', 'Servicios', 620, 8, '09:30'],
  ['Tacos del puesto', 'Comida', 180, 9, '22:05'],
  ['Cinépolis', 'Entretenimiento', 260, 9, '18:40'],
  ['Farmacia', 'Salud', 158, 10, '12:15'],
  ['Oxxo antojo', 'Comida', 120, 11, '15:48'],
  ['Metro y camión', 'Transporte', 45, 11, '07:50'],
  ['Internet Totalplay', 'Servicios', 449, 12, '10:00'],
  ['Spotify', 'Entretenimiento', 129, 13, '06:00'],
  ['Soriana despensa', 'Despensa', 540, 14, '17:22'],
  ['Zara playera', 'Ropa', 210, 15, '18:10'],
  ['Libros de la escuela', 'Educación', 119, 16, '13:40'],
  ['Didi Food', 'Comida', 313, 17, '21:55'],
  ['Didi', 'Transporte', 96, 18, '20:30'],
  ['Dentista', 'Salud', 100, 19, '11:20'],
  ['Cafetería del campus', 'Comida', 85, 20, '08:35'],
  ['Torta ahogada', 'Comida', 90, 21, '14:10'],
  ['Gasolina Pemex', 'Transporte', 480, 22, '09:05'],
  ['Starbucks', 'Comida', 190, 25, '16:45'],
  ['Uber', 'Transporte', 48, 26, '23:20'],
];

// [label, fuente, monto, días atrás]
const INGRESOS = [
  ['Quincena', 'Sueldo', 3500, 13],
  ['Quincena', 'Sueldo', 3500, 27],
  ['Diseño de logo', 'Freelance', 1500, 6],
  ['Tenis que ya no uso', 'Venta', 800, 4],
];

async function sembrar() {
  await conectarBaseDeDatos();
  const hoy = hoyISO();

  let usuario = await Usuario.findOne({ correo: CORREO_DEMO });
  if (!usuario) {
    usuario = await Usuario.create({
      nombre: 'Ana Sofía',
      correo: CORREO_DEMO,
      contrasenaHash: await Usuario.hashearContrasena(CONTRASENA_DEMO),
    });
    console.log(`Usuario demo creado: ${CORREO_DEMO} / ${CONTRASENA_DEMO}`);
  } else {
    console.log(`Usuario demo ya existía: ${CORREO_DEMO}`);
  }

  await Promise.all([
    Gasto.deleteMany({ usuario: usuario.id }),
    Ingreso.deleteMany({ usuario: usuario.id }),
  ]);

  await Gasto.insertMany(
    GASTOS.map(([label, categoria, monto, atras, hora]) => ({
      usuario: usuario.id,
      label,
      categoria,
      monto,
      fecha: sumarDias(hoy, -atras),
      hora,
    })),
  );

  await Ingreso.insertMany(
    INGRESOS.map(([label, fuente, monto, atras]) => ({
      usuario: usuario.id,
      label,
      fuente,
      monto,
      fecha: sumarDias(hoy, -atras),
    })),
  );

  console.log(`Sembrados ${GASTOS.length} gastos y ${INGRESOS.length} ingresos (últimos 28 días).`);
  await cerrarBaseDeDatos();
}

sembrar().catch(async (err) => {
  console.error('Falló el seed:', err.message);
  await cerrarBaseDeDatos().catch(() => {});
  process.exit(1);
});
