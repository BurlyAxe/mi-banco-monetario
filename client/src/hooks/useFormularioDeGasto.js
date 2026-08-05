import { useCallback, useState } from 'react';
import { hoyISO, horaAhora } from '../lib/formato';

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
      hora: valores.hora,
    }),
    [valores],
  );

  return { valores, cambiar, listo, aGasto };
}
