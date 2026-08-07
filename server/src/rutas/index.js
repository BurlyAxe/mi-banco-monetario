import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { autenticar } from '../middleware/autenticar.js';
import { validar } from '../middleware/validar.js';
import {
  esquemaRegistro,
  esquemaLogin,
  esquemaAjustes,
  esquemaGasto,
  esquemaIngreso,
  esquemaEdicionMovimiento,
  esquemaConsultaPeriodo,
  esquemaConsultaDia,
  esquemaConsultaMes,
  esquemaConsultaHoy,
  esquemaChat,
} from '../esquemas.js';
import { recibirImagen } from '../middleware/subidaDeImagen.js';
import { estadoDeLaBase } from '../config/db.js';
import { faltanVariables } from '../config/env.js';

import * as auth from '../controladores/autenticacion.js';
import * as gastos from '../controladores/gastos.js';
import * as ingresos from '../controladores/ingresos.js';
import * as calendario from '../controladores/calendario.js';
import * as chat from '../controladores/chat.js';
import { resumen } from '../controladores/resumen.js';
import {
  CATEGORIAS,
  FUENTES,
  TONOS,
  DESCRIPCION_TONO,
  GRAFICAS,
  ETIQUETAS_PERIODO,
} from '../dominio/constantes.js';

export const rutas = Router();

// Fuerza bruta contra el login: 20 intentos cada 15 minutos por IP.
const limiteAcceso = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos.' },
});

// Cada mensaje del chat es una llamada a Gemini, y esas se pagan. 30 turnos
// cada 10 minutos alcanzan de sobra para una plática y frenan un bucle suelto.
const limiteChat = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Nivis necesita un respiro. Vuelve a escribirle en unos minutos.' },
});

// Leer un ticket cuesta más que un mensaje de chat: viaja una foto entera y el
// modelo la procesa completa. 15 lecturas cada 10 minutos son muchas más de
// las que hace alguien anotando compras de verdad, y frenan a quien quiera
// usar la llave del servidor como si fuera suya.
const limiteTicket = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas lecturas seguidas. Espera unos minutos o anota el gasto a mano.' },
});

/**
 * ¿Está vivo esto, y puede hacer su trabajo?
 *
 * Son dos preguntas y antes solo contestaba la primera, siempre que sí. Un
 * "ok: true" mientras la base estaba caída no es que fuera inútil: es que
 * despistaba, porque parecía la prueba de que todo iba bien justo cuando nada
 * funcionaba. Ahora `ok` sigue diciendo que el API responde —para eso existe,
 * para poder contestar cuando lo demás falla— y `base` dice si además se
 * puede usar la app, con el motivo cuando no.
 */
rutas.get('/salud', (_req, res) => {
  const faltan = faltanVariables();
  res.json({
    ok: true,
    servicio: 'mi-banco-monetario',
    base: estadoDeLaBase(),
    // Se dice el NOMBRE de lo que falta, nunca el valor de lo que sí está.
    // Un "ECONNREFUSED 127.0.0.1" hay que saber traducirlo; "falta
    // MONGODB_URI" ya es la instrucción.
    ...(faltan.length ? { configuracion: { faltan } } : {}),
  });
});

/** Catálogos que el cliente usa para armar los chips y selectores. */
rutas.get('/catalogos', (_req, res) =>
  res.json({
    categorias: CATEGORIAS,
    fuentes: FUENTES,
    tonos: TONOS,
    descripcionTono: DESCRIPCION_TONO,
    graficas: GRAFICAS,
    periodos: ETIQUETAS_PERIODO,
  }),
);

rutas.post('/auth/registro', limiteAcceso, validar(esquemaRegistro), auth.registrar);
rutas.post('/auth/login', limiteAcceso, validar(esquemaLogin), auth.iniciarSesion);
rutas.get('/auth/yo', autenticar, auth.yo);
rutas.patch('/auth/ajustes', autenticar, validar(esquemaAjustes), auth.actualizarAjustes);

rutas.get('/gastos', autenticar, validar(esquemaConsultaPeriodo, 'query'), gastos.listar);
rutas.post('/gastos', autenticar, validar(esquemaGasto), gastos.crear);
/**
 * Lee la foto de un ticket y devuelve un BORRADOR. No crea ningún gasto: para
 * eso está el POST de arriba, y solo cuando el usuario lo confirme.
 *
 * El orden de los middleware importa: primero se comprueba la sesión y el
 * límite —ambos baratos— y solo después se acepta la subida del archivo. Al
 * revés, un invitado podría hacernos tragar 4.5 MB antes del primer rechazo.
 */
rutas.post(
  '/gastos/desde-ticket',
  autenticar,
  limiteTicket,
  validar(esquemaConsultaHoy, 'query'),
  recibirImagen,
  gastos.desdeTicket,
);
// PATCH y no PUT: se manda solo lo que cambió (el nombre, el monto o los dos).
rutas.patch('/gastos/:id', autenticar, validar(esquemaEdicionMovimiento), gastos.actualizar);
rutas.delete('/gastos/:id', autenticar, gastos.eliminar);

rutas.get('/ingresos', autenticar, validar(esquemaConsultaPeriodo, 'query'), ingresos.listar);
rutas.post('/ingresos', autenticar, validar(esquemaIngreso), ingresos.crear);
rutas.patch('/ingresos/:id', autenticar, validar(esquemaEdicionMovimiento), ingresos.actualizar);
rutas.delete('/ingresos/:id', autenticar, ingresos.eliminar);

rutas.get('/resumen', autenticar, validar(esquemaConsultaPeriodo, 'query'), resumen);

// Volver a días que ya pasaron: la cuadrícula del mes y el detalle de un día.
rutas.get('/calendario', autenticar, validar(esquemaConsultaMes, 'query'), calendario.mes);
rutas.get('/dia', autenticar, validar(esquemaConsultaDia, 'query'), calendario.dia);

// El chat de apoyo con Nivis (plan de ahorro, gastos y permisos).
rutas.get('/nivis/inicio', autenticar, validar(esquemaConsultaPeriodo, 'query'), chat.inicio);
rutas.post('/nivis/chat', autenticar, limiteChat, validar(esquemaChat), chat.responder);
