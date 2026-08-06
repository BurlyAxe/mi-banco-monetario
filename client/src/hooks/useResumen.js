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
  /**
   * Número de la última petición lanzada. Sin él, cambiar de periodo dos veces
   * seguidas dejaba dos llamadas en el aire y mandaba la que contestara al
   * final: bastaba con que "semana" tardara más que "mes" para acabar viendo
   * los números de la semana con el botón de mes encendido.
   */
  const ultima = useRef(0);

  useEffect(() => {
    vigente.current = true;
    return () => {
      vigente.current = false;
    };
  }, []);

  const cargar = useCallback(
    async ({ conIndicador = false } = {}) => {
      const mia = ++ultima.current;
      const alDia = () => vigente.current && mia === ultima.current;

      if (conIndicador) setCargando(true);
      try {
        const respuesta = await api.resumen({ periodo, hoy: hoyISO() });
        if (!alDia()) return;
        setDatos(respuesta);
        setError('');
      } catch (err) {
        if (alDia()) setError(err.message);
      } finally {
        if (alDia()) setCargando(false);
      }
    },
    [periodo],
  );

  useEffect(() => {
    cargar({ conIndicador: true });
  }, [cargar]);

  return { datos, cargando, error, recargar: cargar };
}
