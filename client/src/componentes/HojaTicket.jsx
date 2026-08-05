import Hoja from './Hoja.jsx';
import CapturaDeTicket from './CapturaDeTicket.jsx';
import RevisionDeTicket from './RevisionDeTicket.jsx';
import { useLecturaDeTicket } from '../hooks/useLecturaDeTicket.js';

const SUBTITULO = {
  elegir: 'La IA lo lee, tú decides si se guarda.',
  leyendo: 'Dame un segundo, estoy leyendo.',
  revisar: 'Revisa y corrige lo que haga falta.',
  error: 'No salió a la primera.',
};

/**
 * La hoja de "Leer un ticket": una sola pantalla que cambia de cara según en
 * qué punto va la lectura.
 *
 * Aquí no hay lógica, solo reparto: el flujo lo lleva `useLecturaDeTicket` y
 * cada estado tiene su componente. Todos los caminos terminan en un formulario
 * que el usuario confirma, incluido el de error: si la IA falla, la salida
 * nunca es quedarse sin registrar el gasto, es anotarlo a mano.
 */
export default function HojaTicket({ onCerrar, onGuardar, onAnotarAMano }) {
  const { estado, vistaPrevia, resultado, error, leer, cancelar, reintentar } = useLecturaDeTicket();

  return (
    <Hoja titulo="Leer un ticket" subtitulo={SUBTITULO[estado]} onCerrar={onCerrar}>
      {estado === 'elegir' && <CapturaDeTicket onElegir={leer} />}

      {estado === 'leyendo' && (
        <div className="ticket-espera" role="status" aria-live="polite">
          {vistaPrevia && <img src={vistaPrevia} alt="Ticket que se está leyendo" className="ticket-foto" />}
          <div className="cargando">
            <div className="cargando__rueda" />
            <span>Leyendo el ticket…</span>
          </div>
          <button type="button" className="boton-suave" onClick={cancelar}>
            Cancelar
          </button>
        </div>
      )}

      {estado === 'error' && (
        <div className="ticket-espera">
          <p className="alerta">{error}</p>
          <div className="ticket-revision__acciones">
            <button type="button" className="boton-suave" onClick={cancelar}>
              Elegir otra foto
            </button>
            <button type="button" className="boton-primario" onClick={reintentar}>
              Reintentar
            </button>
          </div>
          <button type="button" className="boton-suave boton-suave--claro" onClick={onAnotarAMano}>
            Mejor lo anoto a mano
          </button>
        </div>
      )}

      {estado === 'revisar' && resultado && (
        <RevisionDeTicket
          // La `key` reinicia el formulario cuando llega otra lectura: sin
          // ella, los valores de la foto anterior se quedarían pegados.
          key={vistaPrevia}
          ticket={resultado.ticket}
          mensaje={resultado.mensaje}
          etiquetaConfianza={resultado.etiquetaConfianza}
          onGuardar={onGuardar}
          onOtraFoto={cancelar}
        />
      )}
    </Hoja>
  );
}
