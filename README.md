# Mi banco monetario

> ¿Por qué me quedé sin dinero?

App de bolsillo para anotar lo que gastas y lo que te entra, y que Nivis —el
zorrito— te diga sin filtros a dónde se te fue. Pensada para usarse en el
celular: instalable como PWA, con hojas que suben desde abajo y botones al
alcance del pulgar.

Construida con **React + Express + MongoDB**, a partir del proyecto de diseño
`Mi banco monetario` de Claude Design.

---

## Qué hace

- **Periodos**: semana (últimos 7 días), quincena (últimos 15) y mes (desde el día 1).
- **Balance**: cuánto ingresaste, cuánto te queda y qué porcentaje del ingreso ya gastaste.
- **El veredicto**: un resumen del periodo que se adapta a tus números — incluido el
  caso de la cuenta recién creada, donde en vez de regañarte te celebra el arranque limpio.
- **Cuatro tonos** ("¿qué tan directo quieres que sea?"): Optimista, Normal, Realista y
  Rudo. Cambian el veredicto, los consejos y hasta las píldoras al registrar un movimiento.
- **A dónde se fue**: dona o barras por categoría; tocar una la filtra en toda la pantalla.
- **Tus ingresos**: desglose por fuente con lo que conviene seguir haciendo ("súbele al
  freelance, ahí es donde se mueve la aguja"). Es la mitad de la app que motiva, no la que regaña.
- **Buscador**: por nombre, por día, por monto y con un desplegable de categorías — si no
  hay un monto exacto, te muestra los cinco gastos más cercanos. Siempre ordenado del más
  reciente al más antiguo: lo que acabas de anotar queda hasta arriba.
- **Calendario**: la cuadrícula del mes con los días pintados según cuánto gastaste en cada
  uno. Tocas un día y ves todo lo que pasó de sus **00:00 a sus 23:59**, con el resumen que
  Nivis escribe para esa fecha. Puedes retroceder mes a mes hasta tu primer movimiento.
- **Leer un ticket**: tomas una foto del ticket y la IA rellena el gasto por ti — comercio,
  fecha, monto y categoría. **Nunca registra nada sola**: te enseña el formulario ya lleno,
  con todo editable y con qué tan segura está de lo que leyó, y el gasto se crea cuando tú
  presionas Guardar (ver abajo).
- **Habla con Nivis**: un chat conectado a **Gemini** para armar tu plan de ahorro, tu plan
  de gastos y tus **permisos** — cuánto puedes gastarte en un antojo sin tocar el ahorro ni
  lo necesario. Funciona con o sin llave de Gemini (ver abajo).
- **Consejos de Nivis**: calculados sobre tus números reales (suscripciones, delivery,
  tope semanal…), rotables y redactados en tu tono.
- **Cuentas**: registro e inicio de sesión con JWT; cada quien ve solo sus movimientos.

### Nivis nunca reclama por lo necesario

Elijas el tono que elijas —incluso Rudo— Nivis **jamás** te echa en cara la despensa, la
salud, la educación, la ropa, la higiene ni los servicios. El regaño existe solo para el
gasto prescindible. Y como un gasto puede ser esencial aunque su categoría no lo sea (el
shampoo cargado en "Compras", la despensa cargada en "Comida"), el nombre del gasto lo
rescata: ver `esGastoEsencial` en `server/src/dominio/constantes.js`.

## Requisitos

- Node.js 20 o superior
- MongoDB corriendo en local (o una URI de Atlas)

Si no tienes Mongo instalado, con Docker:

```bash
docker compose up -d
```

## Puesta en marcha

```bash
# 1. Dependencias (usa workspaces de npm: instala cliente y servidor de una vez)
npm install

# 2. Configura el servidor
cp server/.env.example server/.env      # en PowerShell: Copy-Item server\.env.example server\.env
#    y cambia JWT_SECRET por una cadena larga
#    (opcional) pon tu GEMINI_API_KEY para que el chat de Nivis platique de verdad

# 3. Datos de ejemplo (opcional pero recomendado para verla llena)
npm run seed

# 4. Arranca API y web a la vez
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000/api

Cuenta de demostración que crea el seed: **demo@mibanco.mx** / **demo1234**

### El chat de Nivis (Gemini)

El botón **Habla con Nivis** abre un chat para tres cosas: plan de ahorro, plan de gastos y
**permisos** (pequeñas libertades para darte un gusto, con número puesto: cuánto puedes
gastarte sin tocar tu ahorro ni lo que necesitas).

Está conectado a la [API de Gemini](https://ai.google.dev/gemini-api/docs/text-generation).
Consigue una llave gratis en [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
y ponla en `server/.env` — **ahí y en ningún otro lado**, porque ese archivo está en
`.gitignore` y no se sube al repo:

```bash
GEMINI_API_KEY=tu-llave-aquí
GEMINI_MODEL=gemini-flash-latest   # el alias sigue al flash más reciente
GEMINI_MAX_TOKENS=2500             # ver abajo: no lo bajes
```

> **La llave no se escribe en este README, ni en `.env.example`, ni en ningún archivo que
> el repo sí publica.** Una llave en el README queda en el historial de git para siempre y
> se filtra al primer `git push`; los rastreadores que barren GitHub la encuentran en
> minutos y la cuenta se usa a tu nombre. Si una llave se te escapó a un archivo versionado,
> revócala en AI Studio y genera otra: borrarla del archivo no la borra del historial.

**El tope de tokens no es un detalle.** Los modelos flash actuales razonan antes de
contestar, y esos tokens de pensamiento **salen del mismo `maxOutputTokens`**. Medido contra
la API real, una respuesta del chat se gasta unos 650 pensando: con 900 el modelo termina en
`MAX_TOKENS` sin haber escrito una palabra y siempre cae al respaldo local. Con 2500 responde
de sobra. (`thinkingBudget` y `thinkingLevel` devuelven 400 en `generateContent`: el único
control real es este tope.)

**La llave es opcional.** Sin ella la app arranca igual y el chat sigue abriéndose: Nivis
responde con el plan que el servidor calcula con tus propios números (`dominio/asesor.js`).
Lo mismo pasa si Gemini falla o tarda: nunca te quedas sin respuesta, y la hoja te avisa que
contestó el respaldo. La llave **nunca** llega al navegador — el cliente le habla al API de
la app y esta consulta a Gemini con la sesión ya autenticada.

### Leer un ticket con la cámara

El botón redondo con la cámara (junto a "Gasté en") abre la hoja de lectura. Tomas la foto,
la app la manda a `POST /api/gastos/desde-ticket` y **Gemini Flash** devuelve comercio,
fecha, monto y categoría sugerida. Usa la misma `GEMINI_API_KEY` del chat.

```bash
TICKET_MAX_BYTES=4718592    # 4.5 MB: el tope de cuerpo de las funciones serverless
TICKET_TIMEOUT_MS=45000     # leer una foto tarda más que contestar un mensaje
TICKET_MAX_TOKENS=2500
```

**La IA propone, tú dispones.** El endpoint devuelve un *borrador*, no un gasto: si cierras
la hoja sin guardar, no quedó nada anotado. El alta sigue pasando por el `POST /gastos` de
siempre, con lo que quedó en el formulario y no con lo que dijo el modelo.

**No se inventan datos.** Lo que no se alcanza a leer vuelve como `null` y se marca en el
formulario con un "· no detectado". Un campo vacío lo llenas en diez segundos; uno inventado
se guarda sin que nadie se dé cuenta.

**Las categorías salen del catálogo, no del prompt.** Antes de cada llamada se piden las
categorías que existen y con ellas se arma el `enum` del `responseSchema`, así que Gemini no
puede devolver una que no exista. Si ninguna encaja, contesta `"NINGUNA"` y el servidor lo
convierte en `null` — elegirla te toca a ti.

**La confianza se muestra siempre** (Muy alta / Alta / Media / Baja) y no es solo la que
reporta el modelo: si faltó el monto baja a "Baja" por seguro que se sienta, porque sin monto
no hay gasto. En "Baja" aparece además un aviso para que revises dato por dato.

Se valida el tipo de archivo por la **firma de los bytes** y no por lo que diga el navegador
(que se puede falsear), el tamaño, que la imagen no llegue truncada, los errores y el timeout
de Gemini, y que la respuesta traiga todos los campos. Cada falla trae su mensaje y su salida:
reintentar con la misma foto, elegir otra, o anotarlo a mano.

### Probarla en el celular

`npm run dev` levanta Vite con `--host`, así que desde el teléfono (en la misma
red wifi) puedes abrir `http://<ip-de-tu-pc>:5173`. El proxy de Vite manda las
llamadas al API, y en desarrollo el CORS del servidor ya acepta las IP de red
local. Desde el menú del navegador, "Agregar a pantalla de inicio" la instala
como PWA.

## Estructura

```
├── client/                    React + Vite (móvil primero)
│   ├── public/                manifest, service worker e icono
│   └── src/
│       ├── componentes/       tarjetas, gráfica, hojas, Nivis
│       ├── contexto/          sesión (token + usuario)
│       ├── estilos/global.css tokens del diseño y todas las clases
│       ├── hooks/             useResumen
│       ├── lib/               api, formato, filtrado, gajos de la dona
│       └── paginas/           Acceso y Panel
└── server/                    Express + Mongoose
    └── src/
        ├── controladores/     auth, gastos, ingresos, resumen, calendario, chat
        ├── dominio/           constantes, fechas, análisis (los números), voz (los textos)
        │                      y asesor (el plan y el prompt de Nivis)
        ├── servicios/         gemini.js — el único que habla con Google
        ├── modelos/           Usuario, Gasto, Ingreso
        ├── middleware/        autenticar, validar, errores
        ├── rutas/             tabla de rutas
        └── scripts/seed.js    datos de ejemplo
```

## API

Todas cuelgan de `/api`. Las marcadas con 🔒 piden `Authorization: Bearer <token>`.

| Método | Ruta | Qué hace |
| --- | --- | --- |
| `GET` | `/salud` | Ping del servicio |
| `GET` | `/catalogos` | Categorías, fuentes, tonos y periodos |
| `POST` | `/auth/registro` | Crear cuenta → `{ token, usuario }` |
| `POST` | `/auth/login` | Iniciar sesión → `{ token, usuario }` |
| `GET` | 🔒 `/auth/yo` | Usuario de la sesión |
| `PATCH` | 🔒 `/auth/ajustes` | Nombre, tono, color, gráfica por defecto |
| `GET` | 🔒 `/resumen?periodo=&hoy=` | **Todo lo que pinta el panel** |
| `GET` | 🔒 `/gastos?periodo=&hoy=` | Gastos del periodo |
| `POST` | 🔒 `/gastos` | Registrar gasto → incluye el mensaje de la píldora |
| `POST` | 🔒 `/gastos/desde-ticket?hoy=` | Foto (`multipart/form-data`, campo `imagen`, máx. 4.5 MB) → **borrador** de gasto. No registra nada |
| `PATCH` | 🔒 `/gastos/:id` | Corregir nombre o monto |
| `DELETE` | 🔒 `/gastos/:id` | Borrar gasto |
| `GET` | 🔒 `/ingresos?periodo=&hoy=` | Ingresos del periodo |
| `POST` | 🔒 `/ingresos` | Registrar ingreso |
| `DELETE` | 🔒 `/ingresos/:id` | Borrar ingreso |
| `GET` | 🔒 `/calendario?mes=` | Cuadrícula del mes: cuánto se gastó cada día |
| `GET` | 🔒 `/dia?fecha=` | Todo lo del día (00:00–23:59) + el resumen de Nivis |
| `GET` | 🔒 `/nivis/inicio?periodo=&hoy=` | Saludo, plan calculado y si Gemini está disponible |
| `POST` | 🔒 `/nivis/chat` | Un turno de conversación → `{ texto, plan, fuente }` |

## Decisiones que vale la pena conocer

**Las fechas se guardan como texto `"YYYY-MM-DD"`, no como `Date`.** Un gasto
ocurre en el día *local* de quien lo anota; guardado como `Date` en UTC, un
gasto de las 11 p.m. se recorre al día siguiente y arruina los totales por día.
Como texto ISO, comparar y ordenar sigue siendo trivial. Por lo mismo el cliente
manda su `hoy` en cada consulta: así "esta semana" significa lo mismo en el
celular y en el servidor.

**El veredicto y los consejos se calculan en el servidor.** El cliente solo los
pinta. Es una sola llamada (`/resumen`) para todo el panel, y el texto sale
idéntico desde cualquier dispositivo.

**El QUÉ y el CÓMO viven separados.** `dominio/analisis.js` mira los números y
decide qué situación describe el periodo (`arranque`, `excedido`, `gustoAlto`,
`comidaFuera`, `esencial`…); `dominio/voz.js` guarda las cuatro redacciones de
cada situación, una por tono. Agregar un tono es agregar una llave, no tocar la
lógica — y ninguna situación de reclamo se alcanza cuando el gasto fue esencial.

**El filtrado del buscador es del lado del cliente.** Los movimientos del
periodo ya están cargados, así que filtrar por texto, categoría o día es
instantáneo y sin ida y vuelta a la red — que es justo lo que quieres cuando
estás buscando un cargo con una mano en el camión.

**El calendario, en cambio, pregunta al servidor.** Puede navegar a meses que
no están en el periodo cargado, así que pedir los datos es la única forma de
que un día de hace tres meses muestre algo. Por eso "ver este día en el
buscador" solo aparece cuando el día cae dentro del periodo que sí está en
pantalla: ofrecer un filtro que devolvería una lista vacía sería mentir.

**Un día es de las 00:00 a las 23:59, literal.** Como la fecha se guarda
aparte de la hora, "los gastos del 14 de julio" es exactamente
`fecha === "2026-07-14"`: no hay ventana que recortar ni medianoche que se
recorra al día siguiente. Es la misma decisión de guardar fechas como texto,
cobrando otro dividendo.

**Lo más reciente va siempre arriba.** El orden es `fecha`, luego `hora`, y el
`_id` de desempate. Ese tercer criterio no es adorno: los ObjectId de Mongo
llevan la marca de creación, así que dos gastos anotados en el mismo minuto
salen en el orden en que los registraste — sin él, el gasto que acabas de
meter podía aparecer debajo del anterior.

**El chat de Nivis nunca depende de que Gemini conteste.** El plan (ahorro,
tope diario y permisos) lo calcula el servidor con `dominio/asesor.js`, y ese
mismo plan es la respuesta de respaldo cuando no hay `GEMINI_API_KEY` o la
llamada falla. Gemini agrega la conversación libre, no la utilidad. El
contexto financiero tampoco viaja desde el navegador: en cada turno el
servidor lo relee de la base, así que Nivis no puede razonar sobre saldos que
el cliente haya alterado.

**El service worker no cachea `/api`.** Guarda la cáscara para que la app abra
sin conexión, pero un saldo viejo en pantalla sería peor que un mensaje de
error.

**Los datos de ejemplo son relativos a hoy.** El seed siembra los últimos 28
días, así que "Semana" y "Quincena" siempre traen movimientos; "Mes" mostrará
solo lo que haya caído dentro del mes en curso (si corres el seed un día 3, verá
poco — es el comportamiento correcto, no un error).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | API y web a la vez |
| `npm run dev:api` / `npm run dev:web` | Uno solo |
| `npm run seed` | Carga (o recarga) la cuenta de demostración |
| `npm run build` | Compila el cliente a `client/dist` |
| `npm start` | Levanta solo el API |

## Para producción

### En Vercel (web y API en el mismo proyecto)

El repo ya viene configurado: `vercel.json` compila el cliente a `client/dist` y
`api/[...ruta].mjs` publica el MISMO Express como función serverless. Los
corchetes del nombre no son decorativos: hacen que el archivo atienda cualquier
ruta bajo `/api`, y como los archivos se resuelven antes que los `rewrites`, el
catch-all que manda todo a `index.html` —el que hace funcionar las rutas del
cliente— ya no se traga también las del API.

Web y API quedan en el mismo dominio, así que el cliente usa `/api` sin tocar
nada y no hace falta configurar CORS.

Lo único que hay que poner a mano, en **Settings → Environment Variables**:

| Variable | Valor |
| --- | --- |
| `MONGODB_URI` | La cadena de Atlas, **con el nombre de la base antes del `?`** |
| `JWT_SECRET` | Una cadena larga y aleatoria, distinta a la de desarrollo |
| `NODE_ENV` | `production` |
| `GEMINI_API_KEY` | Opcional: solo si quieres el chat y la lectura de tickets |

En Atlas hay que permitir además el acceso desde cualquier IP (`0.0.0.0/0`) en
**Network Access**: las funciones serverless no salen siempre por la misma.
Si falta o falla la conexión, el API responde un 503 diciendo justo eso, en vez
de reventar sin explicación.

### En cualquier otro lado

1. `npm run build` y sirve `client/dist` como estático.
2. En el servidor: `NODE_ENV=production`, un `JWT_SECRET` largo y aleatorio, y
   `CORS_ORIGIN` con el dominio real de la web. Si vas a usar el chat, la
   `GEMINI_API_KEY` va aquí y solo aquí.
3. Si el API queda en otro dominio, compila el cliente con
   `VITE_API_URL=https://api.tudominio.com/api`.
