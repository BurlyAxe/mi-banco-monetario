import Nivis from './Nivis.jsx';

export default function Encabezado({ usuario, mes, onAbrirAjustes }) {
  return (
    <header className="encabezado">
      <div className="encabezado__logo">
        <Nivis pose="cara" ancho={34} alto={34} />
      </div>

      <div className="encabezado__marca">
        <span className="encabezado__titulo">Mi banco monetario</span>
        <span className="encabezado__lema">¿POR QUÉ ME QUEDÉ SIN DINERO?</span>
      </div>

      <button
        type="button"
        className="encabezado__usuario"
        onClick={onAbrirAjustes}
        aria-label="Abrir ajustes de la cuenta"
      >
        <span className="encabezado__datos">
          <span className="encabezado__nombre">{usuario.nombre}</span>
          <span className="encabezado__mes">{mes}</span>
        </span>
        <span className="encabezado__avatar">{usuario.iniciales}</span>
      </button>
    </header>
  );
}
