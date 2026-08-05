import Nivis from './Nivis.jsx';

/**
 * Las dos puertas que no son "registrar algo": volver a un día que ya pasó y
 * platicar con Nivis. Van juntas y arriba del panel porque las dos cambian lo
 * que estás mirando, no lo que estás anotando.
 */
export default function BarraHerramientas({ onCalendario, onChat, diaFiltrado }) {
  return (
    <div className="herramientas">
      <button type="button" className="herramienta" onClick={onCalendario}>
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" className="herramienta__icono">
          <rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8" />
          <line x1="8" y1="3" x2="8" y2="6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="16" y1="3" x2="16" y2="6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="8.5" cy="14.5" r="1.3" fill="currentColor" />
          <circle cx="12" cy="14.5" r="1.3" fill="currentColor" />
          <circle cx="15.5" cy="14.5" r="1.3" fill="currentColor" />
        </svg>
        <span className="herramienta__texto">Calendario</span>
        {diaFiltrado && <span className="herramienta__marca" aria-hidden="true" />}
      </button>

      <button type="button" className="herramienta herramienta--nivis" onClick={onChat}>
        <Nivis pose="tip" className="herramienta__icono" ancho={20} alto={20} />
        <span className="herramienta__texto">Habla con Nivis</span>
      </button>
    </div>
  );
}
