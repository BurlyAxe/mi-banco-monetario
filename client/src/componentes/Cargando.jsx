export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <div className="cargando__rueda" />
      <span>{texto}</span>
    </div>
  );
}
