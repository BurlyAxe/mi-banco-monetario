import { useState } from 'react';
import Hoja from './Hoja.jsx';
import { TONOS, DESCRIPCION_TONO, GRAFICAS, COLORES_ACENTO } from '../lib/constantes';

export default function HojaAjustes({ usuario, onCerrar, onGuardar, onSalir }) {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [tono, setTono] = useState(usuario.ajustes.tono);
  const [colorAcento, setColorAcento] = useState(usuario.ajustes.colorAcento);
  const [graficaPorDefecto, setGrafica] = useState(usuario.ajustes.graficaPorDefecto);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await onGuardar({ nombre: nombre.trim(), tono, colorAcento, graficaPorDefecto });
      onCerrar();
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  };

  return (
    <Hoja titulo="Tus ajustes" subtitulo={usuario.correo} onCerrar={onCerrar}>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="campo">
          <label className="campo__label" htmlFor="ajustes-nombre">
            CÓMO TE LLAMAS
          </label>
          <input
            id="ajustes-nombre"
            className="campo__entrada"
            type="text"
            maxLength={60}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div className="campo">
          <span className="campo__label">¿QUÉ TAN DIRECTO QUIERES QUE SEA?</span>
          <p className="campo__nota">
            Nivis siempre te cuida el gasto: lo único que cambia es cómo te lo dice. Por despensa,
            salud, educación, ropa o higiene nunca te va a reclamar, elijas el tono que elijas.
          </p>
          <div className="tonos">
            {TONOS.map((t) => (
              <button
                key={t}
                type="button"
                className={`tono${tono === t ? ' tono--activo' : ''}`}
                onClick={() => setTono(t)}
                aria-pressed={tono === t}
              >
                <span className="tono__nombre">{t}</span>
                <span className="tono__desc">{DESCRIPCION_TONO[t]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="campo">
          <span className="campo__label">GRÁFICA POR DEFECTO</span>
          <div className="chips chips--envueltos">
            {GRAFICAS.map((g) => (
              <button
                key={g}
                type="button"
                className={`chip chip--grande${graficaPorDefecto === g ? ' chip--activo' : ''}`}
                onClick={() => setGrafica(g)}
                aria-pressed={graficaPorDefecto === g}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="campo">
          <span className="campo__label">COLOR DE ACENTO</span>
          <div className="chips chips--envueltos">
            {COLORES_ACENTO.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setColorAcento(color)}
                aria-label={`Usar el color ${color}`}
                aria-pressed={colorAcento === color}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: color,
                  cursor: 'pointer',
                  border: colorAcento === color ? '3px solid #26313D' : '1px solid #DCE8F1',
                }}
              />
            ))}
          </div>
        </div>

        {error && <p className="alerta">{error}</p>}

        <button type="submit" className="boton-primario" disabled={guardando || !nombre.trim()}>
          {guardando ? 'Guardando…' : 'Guardar ajustes'}
        </button>

        <button
          type="button"
          onClick={onSalir}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--gris-boton)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            padding: 8,
          }}
        >
          Cerrar sesión
        </button>
      </form>
    </Hoja>
  );
}
