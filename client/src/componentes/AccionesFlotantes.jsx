export default function AccionesFlotantes({ onIngreso, onGasto, onTicket }) {
  return (
    <div className="acciones">
      <div className="acciones__grupo">
        <button type="button" className="flotante flotante--ingreso" onClick={onIngreso}>
          <span className="flotante__signo">+</span> Ingresos
        </button>
        <button type="button" className="flotante flotante--gasto" onClick={onGasto}>
          <span className="flotante__signo">−</span> Gasté en
        </button>
        {/* Solo el icono: es un atajo para registrar un gasto, no una tercera
            cosa que anotar, y con texto competiría con los dos de al lado. */}
        <button
          type="button"
          className="flotante flotante--ticket"
          onClick={onTicket}
          aria-label="Leer un ticket con la cámara"
          title="Leer un ticket"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
