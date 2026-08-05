import { useEffect, useMemo, useRef, useState } from 'react';
import EdicionDeFila from './EdicionDeFila.jsx';
import { CATEGORIAS } from '../lib/constantes';
import { dinero, hoyISO } from '../lib/formato';
import { filtrarGastos, agruparPorDia } from '../lib/filtrado';

const OPCIONES = [{ etiqueta: 'Todas las categorías', valor: null }, ...CATEGORIAS.map((c) => ({ etiqueta: c, valor: c }))];

export default function BuscadorDeGastos({
  gastos,
  ranked,
  hoy,
  consulta,
  onConsulta,
  fecha,
  onFecha,
  seleccion,
  onSeleccion,
  onLimpiar,
  onBorrarGasto,
  borrando,
  editando,
  onEditarGasto,
  onGuardarGasto,
}) {
  const [abierto, setAbierto] = useState(false);
  const desplegable = useRef(null);

  const { visibles, aviso, total } = useMemo(
    () => filtrarGastos({ gastos, seleccion, fecha, consulta, hoy }),
    [gastos, seleccion, fecha, consulta, hoy],
  );

  const dias = useMemo(() => agruparPorDia(visibles, ranked, hoy), [visibles, ranked, hoy]);

  const hayFiltro = Boolean(seleccion || consulta || fecha);
  const esHoy = fecha === hoyISO();

  // El desplegable se cierra al tocar fuera o con Escape, como cualquier menú.
  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e) => {
      if (!desplegable.current?.contains(e.target)) setAbierto(false);
    };
    const alTeclear = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('pointerdown', alTocar);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('pointerdown', alTocar);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  const elegir = (valor) => {
    onSeleccion(valor);
    setAbierto(false);
  };

  return (
    <section className="tarjeta buscador" id="buscador">
      <div className="seccion__cabecera">
        <h2 className="seccion__titulo">Buscar un gasto</h2>
        {hayFiltro && (
          <button type="button" className="boton-limpiar" onClick={onLimpiar}>
            Limpiar filtros ✕
          </button>
        )}
      </div>

      <div className="campo-busqueda">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={{ flex: 'none' }}>
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#AEBBC7" strokeWidth="2" />
          <line x1="15.5" y1="15.5" x2="20" y2="20" stroke="#AEBBC7" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          inputMode="search"
          placeholder="Nombre o monto exacto (ej. Uber o 210)"
          value={consulta}
          onChange={(e) => onConsulta(e.target.value)}
          aria-label="Buscar gastos por nombre o monto"
        />
      </div>

      <div className="desplegable" ref={desplegable}>
        <button
          type="button"
          className={`desplegable__boton${seleccion ? ' desplegable__boton--activo' : ''}`}
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-haspopup="listbox"
        >
          <span className="desplegable__etiqueta">CATEGORÍA</span>
          <span className="desplegable__valor">{seleccion || 'Todas'}</span>
          <span className={`desplegable__flecha${abierto ? ' desplegable__flecha--abierta' : ''}`}>
            ▾
          </span>
        </button>

        {abierto && (
          <ul className="desplegable__lista" role="listbox" aria-label="Filtrar por categoría">
            {OPCIONES.map(({ etiqueta, valor }) => (
              <li key={etiqueta}>
                <button
                  type="button"
                  role="option"
                  aria-selected={seleccion === valor}
                  className={`desplegable__opcion${seleccion === valor ? ' desplegable__opcion--activa' : ''}`}
                  onClick={() => elegir(valor)}
                >
                  {etiqueta}
                  {seleccion === valor && <span aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="buscador__fecha">
        <input
          type="date"
          value={fecha}
          onChange={(e) => onFecha(e.target.value)}
          aria-label="Filtrar por día"
        />
        <button
          type="button"
          className={`boton-hoy${esHoy ? ' boton-hoy--activo' : ''}`}
          onClick={() => onFecha(esHoy ? '' : hoyISO())}
        >
          Hoy
        </button>
      </div>

      {aviso && <p className="buscador__aviso">{aviso}</p>}

      <div className="buscador__resumen">
        <span className="buscador__conteo">{visibles.length} resultados</span>
        <span className="buscador__total">{dinero(total)}</span>
      </div>

      {dias.map((dia) => (
        <div key={dia.fecha} className="dia">
          <div className="dia__cabecera">
            <span className="dia__label">{dia.label}</span>
            <span className="dia__total">{dinero(dia.total)}</span>
          </div>

          {dia.items.map((gasto) =>
            editando === gasto.id ? (
              <EdicionDeFila
                key={gasto.id}
                label={gasto.label}
                monto={gasto.monto}
                onGuardar={(cambios) => onGuardarGasto(gasto.id, cambios)}
                onCancelar={() => onEditarGasto(null)}
              />
            ) : (
              <div key={gasto.id} className="fila">
                <span
                  className="fila__punto fila__punto--redondo"
                  style={{ background: gasto.color }}
                />
                <div className="fila__texto">
                  <span className="fila__label">{gasto.label}</span>
                  <span className="fila__detalle">
                    {gasto.categoria} · {gasto.hora} · {gasto.etiquetaVibra}
                  </span>
                </div>
                <span className="fila__monto">{dinero(gasto.monto)}</span>
                <button
                  type="button"
                  className="fila__accion"
                  onClick={() => onEditarGasto(gasto.id)}
                  disabled={borrando === gasto.id}
                  aria-label={`Editar gasto ${gasto.label}`}
                >
                  {/* El selector de variación fuerza el lápiz en texto: sin él
                      varias fuentes lo pintan como emoji a todo color. */}
                  {'✎︎'}
                </button>
                <button
                  type="button"
                  className="fila__accion"
                  onClick={() => onBorrarGasto(gasto.id)}
                  disabled={borrando === gasto.id}
                  aria-label={`Borrar gasto ${gasto.label}`}
                >
                  ✕
                </button>
              </div>
            ),
          )}
        </div>
      ))}

      {visibles.length === 0 && (
        <p className="buscador__vacio">Nivis buscó en todo el periodo y no encontró nada así.</p>
      )}
    </section>
  );
}
