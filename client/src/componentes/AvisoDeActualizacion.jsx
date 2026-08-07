import { useSyncExternalStore } from 'react';
import { aplicarActualizacion, hayActualizacion, suscribirse } from '../lib/actualizacion';

/**
 * "Hay una versión nueva": el aviso para tomar el relevo.
 *
 * Instalada en la pantalla de inicio, la app no tiene botón de recargar, así
 * que este es el único camino por el que le llega un arreglo a quien la usa a
 * diario. Se pregunta en vez de recargar solo porque recargar tira lo que haya
 * a medio escribir, y perderle a alguien el gasto que estaba anotando para
 * darle una mejora que no pidió es un mal negocio.
 */
export default function AvisoDeActualizacion() {
  const hay = useSyncExternalStore(suscribirse, hayActualizacion, () => false);
  if (!hay) return null;

  return (
    <div className="actualizar" role="status" aria-live="polite">
      <span className="actualizar__texto">Hay una versión nueva de la app.</span>
      <button type="button" className="actualizar__boton" onClick={aplicarActualizacion}>
        Actualizar
      </button>
    </div>
  );
}
