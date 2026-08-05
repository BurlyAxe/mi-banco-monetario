/**
 * Cliente mínimo de la API de Gemini (generateContent).
 *
 *   https://ai.google.dev/gemini-api/docs/text-generation
 *   https://ai.google.dev/gemini-api/docs/structured-output
 *
 * Se habla por REST con el `fetch` que ya trae Node 20: una sola llamada, un
 * solo formato, cero dependencias nuevas que mantener.
 *
 * La llave vive SOLO aquí, en el servidor. El cliente nunca la ve: manda su
 * mensaje (o su foto) al API de la app y esta consulta a Gemini con la sesión
 * ya autenticada. Poner la llave en el navegador sería regalarla.
 *
 * La conversación se manda completa en cada llamada (`contents`), sin estado
 * del lado de Google: el historial lo tiene el cliente y el servidor solo lo
 * reenvía. Así ninguna plática queda guardada fuera de la app.
 *
 * Hay dos maneras de pedirle algo al modelo y las dos comparten transporte:
 *
 *   generarTexto → una respuesta en prosa (el chat de Nivis).
 *   generarJson  → una respuesta con forma fija, validada contra un esquema
 *                  (la lectura de tickets). Lo que vuelve NO es de fiar todavía:
 *                  el esquema disciplina al modelo, no lo garantiza. Quien
 *                  llame sigue teniendo que validar (ver dominio/ticket.js).
 */
import { env } from '../config/env.js';

export const geminiConfigurado = () => Boolean(env.gemini.apiKey);

/** Error propio, para que el llamador distinga "Gemini falló" de un bug nuestro. */
export class ErrorGemini extends Error {
  constructor(mensaje, causa) {
    super(mensaje);
    this.name = 'ErrorGemini';
    this.causa = causa;
  }
}

/** Nuestros roles → los que entiende la API: quien pregunta y quien responde. */
const ROL_API = { usuario: 'user', nivis: 'model' };

/**
 * Una llamada a generateContent, de principio a fin: manda el cuerpo, traduce
 * cualquier falla a un ErrorGemini con mensaje entendible y devuelve el texto
 * que escribió el modelo.
 *
 * Todo lo que puede salir mal se concentra aquí —red, timeout, HTTP, filtros
 * de contenido, tope de tokens— para que ni el chat ni el lector de tickets
 * tengan que repetir ese manejo.
 *
 * @param {object} cuerpo     Cuerpo JSON tal cual lo espera la API.
 * @param {number} timeoutMs  Tope de espera; distinto según lo que se pida.
 * @param {number} maxTokens  Solo para poder redactar un error útil.
 */
async function generar({ cuerpo, timeoutMs, maxTokens }) {
  if (!geminiConfigurado()) throw new ErrorGemini('Falta GEMINI_API_KEY');

  const url = `${env.gemini.urlBase}/models/${env.gemini.modelo}:generateContent`;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.gemini.apiKey,
      },
      body: JSON.stringify(cuerpo),
      // Sin tope, una API lenta deja colgada la pantalla del celular.
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const agotado = err.name === 'TimeoutError' || err.name === 'AbortError';
    const error = new ErrorGemini(
      agotado ? 'Gemini tardó demasiado en responder' : 'No se pudo contactar a Gemini',
      err,
    );
    error.agotado = agotado;
    throw error;
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const error = new ErrorGemini(datos?.error?.message || `Gemini respondió ${respuesta.status}`, datos);
    error.estado = respuesta.status;
    throw error;
  }

  // Gemini puede contestar 200 y aun así no traer texto: filtros de seguridad,
  // o el tope de tokens alcanzado antes de la primera palabra.
  const bloqueo = datos?.promptFeedback?.blockReason;
  if (bloqueo) throw new ErrorGemini(`Gemini bloqueó la petición (${bloqueo})`, datos);

  const candidato = datos?.candidates?.[0];
  const texto = (candidato?.content?.parts || [])
    .map((p) => p.text || '')
    .join('')
    .trim();

  if (!texto) {
    // Se distingue el caso del tope agotado porque tiene arreglo concreto —
    // subir el tope— y no se parece en nada a un filtro de contenido.
    const sinPresupuesto = candidato?.finishReason === 'MAX_TOKENS';
    throw new ErrorGemini(
      sinPresupuesto
        ? `El modelo agotó los ${maxTokens} tokens razonando y no alcanzó a escribir.`
        : `Gemini respondió vacío (${candidato?.finishReason || 'sin motivo'})`,
      datos,
    );
  }

  return texto;
}

/**
 * Genera una respuesta de texto.
 *
 * @param {string} instruccion  Instrucción de sistema: quién es Nivis y qué datos tiene.
 * @param {Array}  mensajes     Historial `[{ rol: 'usuario' | 'nivis', texto }]`, en orden.
 */
export function generarTexto({
  instruccion,
  mensajes,
  temperatura = 0.85,
  maxTokens = env.gemini.maxTokens,
  timeoutMs = env.gemini.timeoutMs,
}) {
  return generar({
    timeoutMs,
    maxTokens,
    cuerpo: {
      systemInstruction: { parts: [{ text: instruccion }] },
      contents: mensajes.map((m) => ({
        role: ROL_API[m.rol] || 'user',
        parts: [{ text: m.texto }],
      })),
      generationConfig: {
        temperature: temperatura,
        maxOutputTokens: maxTokens,
      },
    },
  });
}

/**
 * Genera una respuesta con forma fija: `responseMimeType: application/json`
 * más un `responseSchema` que el modelo tiene que respetar.
 *
 * `partes` va sin envolver a propósito: así el mismo método sirve para una
 * foto de ticket hoy y para un PDF de estado de cuenta mañana, sin tocar esta
 * capa. Usa `parteDeArchivo()` para armarlas.
 *
 * La temperatura arranca en 0: extraer datos de una imagen no es un trabajo
 * creativo, y la misma foto debería dar siempre el mismo resultado.
 *
 * @returns {object} El JSON ya parseado. Validarlo sigue siendo del llamador.
 */
export async function generarJson({
  instruccion,
  partes,
  esquema,
  temperatura = 0,
  maxTokens = env.gemini.maxTokens,
  timeoutMs = env.gemini.timeoutMs,
}) {
  const texto = await generar({
    timeoutMs,
    maxTokens,
    cuerpo: {
      systemInstruction: { parts: [{ text: instruccion }] },
      contents: [{ role: 'user', parts: partes }],
      generationConfig: {
        temperature: temperatura,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
        responseSchema: esquema,
      },
    },
  });

  try {
    return JSON.parse(texto);
  } catch (err) {
    // Con responseMimeType esto no debería pasar nunca, pero "no debería" no
    // es una garantía cuando el otro lado es un modelo.
    throw new ErrorGemini('Gemini devolvió algo que no es JSON válido', { texto, err });
  }
}

/**
 * Envuelve un archivo binario como parte de un mensaje. Gemini lo quiere en
 * base64 dentro del propio JSON (`inlineData`), que para archivos pequeños
 * —una foto de ticket— sale más barato que subirlo aparte con la File API.
 */
export const parteDeArchivo = (buffer, tipoMime) => ({
  inlineData: { mimeType: tipoMime, data: buffer.toString('base64') },
});
