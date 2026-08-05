import { useState } from 'react';
import Hoja from './Hoja.jsx';
import CamposDeGasto from './CamposDeGasto.jsx';
import { useFormularioDeGasto } from '../hooks/useFormularioDeGasto.js';

export default function HojaGasto({ onCerrar, onGuardar, onLeerTicket }) {
  const { valores, cambiar, listo, aGasto } = useFormularioDeGasto({ categoria: 'Comida' });
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
    <Hoja titulo="Gasté en…" subtitulo="Confiésalo, aquí nadie te regaña." onCerrar={onCerrar}>
      {/* Atajo para quien ya trae el ticket en la mano y no quiere teclear. */}
      {onLeerTicket && (
        <button
          type="button"
          className="boton-suave boton-suave--claro atajo-ticket"
          onClick={onLeerTicket}
        >
          <span aria-hidden="true">📷</span> Léelo de un ticket
        </button>
      )}

      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <CamposDeGasto valores={valores} onCambiar={cambiar} autoFocus />

        {error && <p className="alerta">{error}</p>}

        <button type="submit" className="boton-primario" disabled={invalido}>
          {guardando ? 'Guardando…' : 'Registrar gasto'}
        </button>
      </form>
    </Hoja>
  );
}
