import { useCallback, useState } from 'react';
import { hoyISO, horaAhora } from '../lib/formato';

/** La hora que se usa cuando no hay ninguna. Es la misma que pone el servidor. */
const HORA_NEUTRA = '12:00';

/**
 * El estado de un formulario de gasto, venga de donde venga.
 *
 * Lo usan la hoja de "Gasté en…" (que arranca en blanco) y la revisión de un
 * ticket (que arranca con lo que leyó la IA). Tener una sola copia de "qué
 * campos hay, cuándo está listo y cómo se convierte en un gasto" evita que las
 * dos pantallas se vayan separando con el tiempo.
 *
 * @param {object} inicial  Valores de arranque; lo que no venga usa el default.
 */
export function useFormularioDeGasto(inicial) {
  const [valores, setValores] = useState(() => ({
    monto: '',
    // Vacía a propósito cuando no la dan: preseleccionar una categoría por el
    // usuario es decidir por él, y en un ticket eso es justo lo que no toca.
    categoria: '',
    fecha: hoyISO(),
    hora: horaAhora(),
    nota: '',
    ...inicial,
  }));

  const cambiar = useCallback((campo, valor) => {
    setValores((previos) => ({ ...previos, [campo]: valor }));
  }, []);

  const cantidad = parseFloat(valores.monto);
  const listo = cantidad > 0 && Boolean(valores.categoria) && Boolean(valores.fecha);

  /** Lo que espera POST /gastos. Solo tiene sentido llamarla si `listo`. */
  const aGasto = useCallback(
    () => ({
      label: valores.nota.trim(),
      categoria: valores.categoria,
      monto: parseFloat(valores.monto),
      fecha: valores.fecha,
      // El campo de hora se puede vaciar, y una hora en blanco no es una hora:
      // el servidor la rechazaba con un 400 por un dato que ni siquiera es
      // obligatorio. Sin ella se usa el mediodía, el mismo valor neutro que el
      // servidor pone cuando el gasto llega sin hora.
      hora: valores.hora || HORA_NEUTRA,
    }),
    [valores],
  );

  return { valores, cambiar, listo, aGasto };
}
