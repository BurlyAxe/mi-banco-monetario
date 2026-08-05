export default function Pildora({ texto }) {
  if (!texto) return null;
  return (
    <div className="pildora" role="status" aria-live="polite">
      {texto}
    </div>
  );
}
