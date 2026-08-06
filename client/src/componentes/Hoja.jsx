import { useEffect, useRef } from 'react';

/**
 * Hoja que sube desde abajo. Se cierra con Escape, tocando el fondo o la ✕,
 * y mientras está abierta el fondo no hace scroll (si no, en el celular se
 * mueve la página detrás del formulario).
 */
export default function Hoja({ titulo, subtitulo, onCerrar, children }) {
  const panel = useRef(null);

  // `onCerrar` llega casi siempre como una función escrita en el JSX del
  // padre, así que cambia de identidad en cada render suyo. Guardarla en una
  // referencia deja que el efecto de abajo corra UNA vez: si dependiera de
  // ella, cada re-render del panel (borrar un ingreso, por ejemplo) volvería a
  // enfocar el primer control de la hoja y le arrancaría el cursor al usuario.
  const alCerrar = useRef(onCerrar);
  useEffect(() => {
    alCerrar.current = onCerrar;
  });

  useEffect(() => {
    const alTeclear = (e) => {
      if (e.key === 'Escape') alCerrar.current();
    };
    document.addEventListener('keydown', alTeclear);

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    panel.current?.querySelector('input, button, select')?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflowPrevio;
    };
  }, []);

  return (
    <div className="hoja__fondo" onClick={onCerrar} role="presentation">
      <div
        ref={panel}
        className="hoja__panel"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hoja__cabecera">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <h3 className="hoja__titulo">{titulo}</h3>
            {subtitulo && <span className="hoja__sub">{subtitulo}</span>}
          </div>
          <button type="button" className="hoja__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
