import { useState } from 'react';
import Hoja from './Hoja.jsx';
import { FUENTES } from '../lib/constantes';
import { hoyISO } from '../lib/formato';

export default function HojaIngreso({ onCerrar, onGuardar }) {
  const [monto, setMonto] = useState('');
  const [fuente, setFuente] = useState('Sueldo');
  const [fecha, setFecha] = useState(hoyISO());
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cantidad = parseFloat(monto);
  const invalido = !(cantidad > 0) || guardando;

  const enviar = async (evento) => {
    evento.preventDefault();
    if (invalido) return;
    setGuardando(true);
    setError('');
    try {
      await onGuardar({ label: nota.trim(), fuente, monto: cantidad, fecha });
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <Hoja titulo="Nuevo ingreso" subtitulo="Lo bueno también se anota." onCerrar={onCerrar}>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="campo">
          <label className="campo__label" htmlFor="ingreso-monto">
            MONTO (MXN)
          </label>
          <div className="campo-monto">
            <span className="campo-monto__signo">$</span>
            <input
              id="ingreso-monto"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              placeholder="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="campo">
          <span className="campo__label">DE DÓNDE VINO</span>
          <div className="chips chips--envueltos">
            {FUENTES.map((f) => (
              <button
                key={f}
                type="button"
                className={`chip chip--grande${fuente === f ? ' chip--activo' : ''}`}
                onClick={() => setFuente(f)}
                aria-pressed={fuente === f}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="campos-lado-a-lado">
          <div className="campo">
            <label className="campo__label" htmlFor="ingreso-fecha">
              FECHA
            </label>
            <input
              id="ingreso-fecha"
              className="campo__entrada"
              type="date"
              max={hoyISO()}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="campo campo--ancho">
            <label className="campo__label" htmlFor="ingreso-nota">
              NOTA (OPCIONAL)
            </label>
            <input
              id="ingreso-nota"
              className="campo__entrada"
              type="text"
              maxLength={80}
              placeholder="Ej. quincena"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="alerta">{error}</p>}

        <button type="submit" className="boton-primario" disabled={invalido}>
          {guardando ? 'Guardando…' : 'Registrar ingreso'}
        </button>
      </form>
    </Hoja>
  );
}
