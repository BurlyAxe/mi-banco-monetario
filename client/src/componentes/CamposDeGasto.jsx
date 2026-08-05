import { CATEGORIAS } from '../lib/constantes';
import { hoyISO } from '../lib/formato';

/**
 * Los campos de un gasto: monto, categoría, fecha, hora y nota.
 *
 * Los comparten la hoja de "Gasté en…" y la revisión de un ticket leído por la
 * IA. Son el mismo formulario a propósito: que el gasto salga de la cámara o
 * del teclado no debería cambiar lo que el usuario ve ni cómo lo corrige.
 *
 * El componente no guarda nada ni valida: solo muestra los valores que le dan
 * y avisa de los cambios. Quién decide si se puede guardar es de quien lo usa.
 *
 * @param {object}   valores      { monto, categoria, fecha, hora, nota }.
 * @param {Function} onCambiar    (campo, valor) => void.
 * @param {string[]} sinDetectar  Campos que la IA no logró leer, para marcarlos.
 */
export default function CamposDeGasto({
  valores,
  onCambiar,
  sinDetectar = [],
  etiquetaNota = 'NOTA (OPCIONAL)',
  notaPlaceholder = 'Ej. Rappi de las 2 a.m.',
  idPrefijo = 'gasto',
  autoFocus = false,
}) {
  const id = (campo) => `${idPrefijo}-${campo}`;

  // Marca discreta en lo que la IA no encontró: le dice al usuario dónde poner
  // los ojos sin llenar la pantalla de advertencias.
  const marca = (campo) =>
    sinDetectar.includes(campo) ? <em className="campo__pendiente"> · no detectado</em> : null;

  return (
    <>
      <div className="campo">
        <label className="campo__label" htmlFor={id('monto')}>
          MONTO (MXN){marca('monto')}
        </label>
        <div className="campo-monto">
          <span className="campo-monto__signo">$</span>
          <input
            id={id('monto')}
            type="number"
            min="0"
            // "any" y no "1": un ticket trae centavos y con paso entero el
            // navegador bloquea el guardado con un aviso que no explica nada.
            step="any"
            inputMode="decimal"
            placeholder="0"
            value={valores.monto}
            onChange={(e) => onCambiar('monto', e.target.value)}
            autoFocus={autoFocus}
          />
        </div>
      </div>

      <div className="campo">
        <span className="campo__label">CATEGORÍA{marca('categoria')}</span>
        <div className="chips chips--envueltos">
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip chip--grande${valores.categoria === c ? ' chip--activo' : ''}`}
              onClick={() => onCambiar('categoria', c)}
              aria-pressed={valores.categoria === c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="campos-lado-a-lado">
        <div className="campo">
          <label className="campo__label" htmlFor={id('fecha')}>
            FECHA{marca('fecha')}
          </label>
          <input
            id={id('fecha')}
            className="campo__entrada"
            type="date"
            max={hoyISO()}
            value={valores.fecha}
            onChange={(e) => onCambiar('fecha', e.target.value)}
          />
        </div>
        <div className="campo">
          <label className="campo__label" htmlFor={id('hora')}>
            HORA
          </label>
          <input
            id={id('hora')}
            className="campo__entrada"
            type="time"
            value={valores.hora}
            onChange={(e) => onCambiar('hora', e.target.value)}
          />
        </div>
      </div>

      <div className="campo">
        <label className="campo__label" htmlFor={id('nota')}>
          {etiquetaNota}
          {marca('nota')}
        </label>
        <input
          id={id('nota')}
          className="campo__entrada"
          type="text"
          maxLength={80}
          placeholder={notaPlaceholder}
          value={valores.nota}
          onChange={(e) => onCambiar('nota', e.target.value)}
        />
      </div>
    </>
  );
}
