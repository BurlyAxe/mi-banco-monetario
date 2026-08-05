import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { hoyISO } from '../lib/formato';

/**
 * Trae el resumen del periodo. En recargas posteriores conserva los datos
 * anteriores en pantalla: así al borrar o registrar un movimiento la vista no
 * parpadea en blanco.
 */
export function useResumen(periodo) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const vigente = useRef(true);

  useEffect(() => {
    vigente.current = true;
    return () => {
      vigente.current = false;
    };
  }, []);

  const cargar = useCallback(
    async ({ conIndicador = false } = {}) => {
      if (conIndicador) setCargando(true);
      try {
        const respuesta = await api.resumen({ periodo, hoy: hoyISO() });
        if (!vigente.current) return;
        setDatos(respuesta);
        setError('');
      } catch (err) {
        if (vigente.current) setError(err.message);
      } finally {
        if (vigente.current) setCargando(false);
      }
    },
    [periodo],
  );

  useEffect(() => {
    cargar({ conIndicador: true });
  }, [cargar]);

  return { datos, cargando, error, recargar: cargar };
}
