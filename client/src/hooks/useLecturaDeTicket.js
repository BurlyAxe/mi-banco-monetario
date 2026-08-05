import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { hoyISO } from '../lib/formato';
import { MAX_BYTES } from '../lib/ticket';

/**
 * El ciclo de vida de una lectura de ticket, sin nada de interfaz.
 *
 * Cuatro estados y nada más:
 *
 *   elegir  → esperando la foto.
 *   leyendo → la foto va en camino; se puede cancelar.
 *   revisar → llegó el borrador; el usuario lo revisa y decide.
 *   error   → algo falló y se puede reintentar con la MISMA foto.
 *
 * Sacarlo del componente permite que las pantallas sean tres bloques de JSX
 * casi sin lógica, y que este flujo se pruebe o se reutilice —para una factura
 * o un recibo, mañana— sin arrastrar la hoja entera.
 */
export function useLecturaDeTicket() {
  const [estado, setEstado] = useState('elegir');
  const [vistaPrevia, setVistaPrevia] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  // La foto elegida se guarda para poder reintentar sin pedirla otra vez.
  const foto = useRef(null);
  const peticion = useRef(null);

  // Cada vista previa es una URL que el navegador retiene hasta que se le
  // suelta. Sin esto, tomar cinco fotos deja cinco imágenes en memoria.
  useEffect(() => {
    if (!vistaPrevia) return undefined;
    return () => URL.revokeObjectURL(vistaPrevia);
  }, [vistaPrevia]);

  // Si la hoja se cierra a media lectura, la petición se corta: nadie va a
  // leer esa respuesta y deja de gastarse la cuota.
  useEffect(() => () => peticion.current?.abort(), []);

  const enviar = useCallback(async (archivo) => {
    peticion.current?.abort();
    const control = new AbortController();
    peticion.current = control;

    setEstado('leyendo');
    setError('');

    try {
      const respuesta = await api.leerTicket(archivo, { hoy: hoyISO(), signal: control.signal });
      setResultado(respuesta);
      setEstado('revisar');
    } catch (err) {
      // Cancelar es una decisión del usuario, no una falla: `cancelar()` ya
      // dejó la pantalla como debe y aquí no hay nada que anunciar.
      if (err.name === 'AbortError') return;
      setError(err.message);
      setEstado('error');
    }
  }, []);

  /** Recibe la foto elegida (cámara o galería) y arranca la lectura. */
  const leer = useCallback(
    (archivo) => {
      if (!archivo) return;

      // Se comprueba aquí para no hacerle subir 8 MB por datos móviles y
      // enterarse del rechazo medio minuto después. El servidor lo revisa igual.
      if (archivo.size > MAX_BYTES) {
        // Se olvida la foto anterior: si no, "Reintentar" volvería a mandar
        // aquella y parecería que la grande sí se aceptó.
        foto.current = null;
        setVistaPrevia('');
        setError('Esa foto pesa demasiado. Tómala de nuevo con menos resolución.');
        setEstado('error');
        return;
      }

      foto.current = archivo;
      setVistaPrevia(URL.createObjectURL(archivo));
      enviar(archivo);
    },
    [enviar],
  );

  /** Corta la lectura en curso y vuelve a la pantalla de elegir foto. */
  const cancelar = useCallback(() => {
    peticion.current?.abort();
    foto.current = null;
    setVistaPrevia('');
    setResultado(null);
    setError('');
    setEstado('elegir');
  }, []);

  /** Vuelve a intentar con la misma foto; si ya no hay, pide otra. */
  const reintentar = useCallback(() => {
    if (foto.current) enviar(foto.current);
    else cancelar();
  }, [enviar, cancelar]);

  return { estado, vistaPrevia, resultado, error, leer, cancelar, reintentar };
}
