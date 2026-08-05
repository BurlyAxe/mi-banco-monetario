import { useState } from 'react';

/**
 * Edición en línea de un movimiento ya anotado: el nombre y la cantidad.
 *
 * Ocupa el lugar de la fila en la lista en vez de abrir otra hoja: corregir un
 * dedazo es un gesto corto y sacar al usuario de la lista para eso lo hace
 * sentir más grave de lo que es.
 *
 * Solo se manda al servidor lo que de verdad cambió; si no cambió nada, el
 * botón queda apagado y no se gasta una llamada.
 */
export default function EdicionDeFila({ label, monto, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(label);
  const [cantidad, setCantidad] = useState(String(monto));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const nombreLimpio = nombre.trim();
  const numero = parseFloat(cantidad);

  const cambios = {
    ...(nombreLimpio && nombreLimpio !== label ? { label: nombreLimpio } : {}),
    ...(numero > 0 && numero !== monto ? { monto: numero } : {}),
  };

  const valido = Boolean(nombreLimpio) && numero > 0;
  const invalido = !valido || Object.keys(cambios).length === 0 || guardando;

  const enviar = async (evento) => {
    evento.preventDefault();
    if (invalido) return;
    setGuardando(true);
    setError('');
    try {
      await onGuardar(cambios);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  // Escape cancela la edición y no llega a la hoja de atrás, que si no se
  // cerraría entera y se perdería lo tecleado.
  const alTeclear = (evento) => {
    if (evento.key !== 'Escape') return;
    evento.stopPropagation();
    onCancelar();
  };

  return (
    <form className="edicion" onSubmit={enviar} onKeyDown={alTeclear}>
      <div className="edicion__campos">
        <label className="edicion__campo">
          <span className="edicion__label">NOMBRE</span>
          <input
            type="text"
            className="edicion__entrada"
            maxLength={80}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            aria-label="Nombre del movimiento"
            autoFocus
          />
        </label>

        <label className="edicion__campo edicion__campo--monto">
          <span className="edicion__label">CANTIDAD</span>
          <div className="edicion__monto">
            <span className="edicion__signo">$</span>
            {/* step="any" y no "1": si el movimiento ya traía centavos, con
                paso entero el navegador bloquea el guardado —incluso cuando
                solo se está corrigiendo el nombre— con un aviso que no explica
                nada. */}
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              className="edicion__entrada"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              aria-label="Cantidad del movimiento"
            />
          </div>
        </label>
      </div>

      {error && <p className="edicion__error">{error}</p>}

      <div className="edicion__acciones">
        <button type="button" className="edicion__boton" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
        <button
          type="submit"
          className="edicion__boton edicion__boton--guardar"
          disabled={invalido}
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
