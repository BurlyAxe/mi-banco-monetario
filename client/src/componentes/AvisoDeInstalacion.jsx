import { useEffect, useState, useSyncExternalStore } from 'react';
import Nivis from './Nivis.jsx';
import {
  estadoDeInstalacion,
  pedirInstalacion,
  rechazarInstalacion,
  suscribirse,
} from '../lib/instalacion';

/**
 * "Ten la app a la mano": el aviso para instalarla en la pantalla de inicio.
 *
 * Va al final del panel y no como una barra encima de todo: instalar no es
 * urgente, y una app de dinero que lo primero que hace es taparte los números
 * para pedirte algo empieza con el pie izquierdo. Se cierra y no vuelve.
 *
 * Cuando no hay nada que ofrecer —ya está instalada, el navegador no puede, o
 * el usuario ya dijo que no— no se pinta absolutamente nada.
 */
export default function AvisoDeInstalacion() {
  const estado = useSyncExternalStore(suscribirse, estadoDeInstalacion, () => null);
  const [comoEnIOS, setComoEnIOS] = useState(false);

  // Cerrar el aviso de iOS al abrirlo desde otro sitio no tendría sentido, pero
  // sí conviene plegar las instrucciones si el estado cambia bajo los pies.
  useEffect(() => {
    if (!estado) setComoEnIOS(false);
  }, [estado]);

  if (!estado) return null;

  const instalar = async () => {
    if (estado === 'instruccionesIOS') return setComoEnIOS((v) => !v);
    await pedirInstalacion();
  };

  return (
    <section className="instalar">
      <Nivis pose="tip" className="instalar__cara" ancho={34} alto={34} />

      <div className="instalar__cuerpo">
        <span className="instalar__etiqueta">TENLA A LA MANO</span>
        <p className="instalar__texto">
          Instálala en tu pantalla de inicio y se abre como cualquier otra app: a pantalla completa
          y sin la barra del navegador.
        </p>

        {comoEnIOS && (
          <ol className="instalar__pasos">
            <li>
              Toca <strong>Compartir</strong> en la barra de abajo.
            </li>
            <li>
              Baja y elige <strong>Añadir a pantalla de inicio</strong>.
            </li>
            <li>
              Confirma con <strong>Añadir</strong>.
            </li>
          </ol>
        )}

        <div className="instalar__acciones">
          <button type="button" className="boton-primario instalar__boton" onClick={instalar}>
            {estado === 'instruccionesIOS' ? (comoEnIOS ? 'Entendido' : 'Cómo se instala') : 'Instalar app'}
          </button>
          <button type="button" className="instalar__no" onClick={rechazarInstalacion}>
            Ahora no
          </button>
        </div>
      </div>
    </section>
  );
}
