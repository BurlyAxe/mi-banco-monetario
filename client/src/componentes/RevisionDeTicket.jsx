import { useState } from 'react';
import CamposDeGasto from './CamposDeGasto.jsx';
import MedidorDeConfianza from './MedidorDeConfianza.jsx';
import Nivis from './Nivis.jsx';
import { useFormularioDeGasto } from '../hooks/useFormularioDeGasto.js';
import { camposSinDetectar } from '../lib/ticket';
import { hoyISO, horaAhora } from '../lib/formato';

/**
 * Lo que la IA propuso, listo para que el usuario lo cambie.
 *
 * Todos los campos son editables y ninguno se da por bueno. Mientras esta
 * pantalla esté abierta no existe ningún gasto: se crea al presionar Guardar,
 * con el mismo POST /gastos de siempre y con lo que quedó en el formulario,
 * no con lo que dijo el modelo.
 */
export default function RevisionDeTicket({ ticket, mensaje, etiquetaConfianza, onGuardar, onOtraFoto }) {
  const hoy = hoyISO();
  const { valores, cambiar, listo, aGasto } = useFormularioDeGasto({
    monto: ticket.monto === null ? '' : String(ticket.monto),
    categoria: ticket.categoria || '',
    fecha: ticket.fecha || hoy,
    // Un ticket no trae hora. Si la compra fue hoy, la de ahora es un buen
    // supuesto; si fue otro día, poner la hora actual sería inventarla, así
    // que se usa el mediodía, que es el valor neutro que ya usa el servidor.
    hora: ticket.fecha && ticket.fecha !== hoy ? '12:00' : horaAhora(),
    nota: ticket.comercio || '',
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const invalido = !listo || guardando;

  const enviar = async (evento) => {
    evento.preventDefault();
    if (invalido) return;
    setGuardando(true);
    setError('');
    try {
      await onGuardar(aGasto());
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="ticket-revision">
      <div className="consejo">
        <Nivis pose="tip" className="consejo__cara" ancho={30} alto={30} />
        <div className="consejo__cuerpo">
          <span className="consejo__etiqueta">NIVIS LEYÓ TU TICKET</span>
          <p className="consejo__texto">{mensaje}</p>
        </div>
      </div>

      <MedidorDeConfianza nivel={ticket.nivel} etiqueta={etiquetaConfianza} />

      <CamposDeGasto
        valores={valores}
        onCambiar={cambiar}
        sinDetectar={camposSinDetectar(ticket.faltantes)}
        etiquetaNota="COMERCIO"
        notaPlaceholder="Ej. Oxxo"
        idPrefijo="ticket"
      />

      {!valores.categoria && (
        <p className="ticket-revision__pendiente">
          Elige una categoría: esa decisión es tuya, no de la IA.
        </p>
      )}

      {error && <p className="alerta">{error}</p>}

      <div className="ticket-revision__acciones">
        <button type="button" className="boton-suave" onClick={onOtraFoto} disabled={guardando}>
          Usar otra foto
        </button>
        <button type="submit" className="boton-primario" disabled={invalido}>
          {guardando ? 'Guardando…' : 'Guardar gasto'}
        </button>
      </div>
    </form>
  );
}
