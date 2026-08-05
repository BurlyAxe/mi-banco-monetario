import { PERIODOS } from '../lib/constantes';

export default function SelectorDePeriodo({ periodo, onCambiar }) {
  return (
    <div className="segmentado" role="tablist" aria-label="Periodo a mostrar">
      {PERIODOS.map(({ clave, btn }) => (
        <button
          key={clave}
          type="button"
          role="tab"
          aria-selected={periodo === clave}
          className={`segmentado__btn${periodo === clave ? ' segmentado__btn--activo' : ''}`}
          onClick={() => onCambiar(clave)}
        >
          {btn}
        </button>
      ))}
    </div>
  );
}
