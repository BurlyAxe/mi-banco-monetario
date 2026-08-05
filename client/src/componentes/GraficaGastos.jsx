import { useMemo } from 'react';
import Nivis from './Nivis.jsx';
import { calcularGajos } from '../lib/gajos';
import { dinero } from '../lib/formato';

export default function GraficaGastos({
  ranked,
  totales,
  metricas,
  etiquetas,
  seleccion,
  onSeleccionar,
  modo,
  onCambiarModo,
  acento,
}) {
  const total = metricas.totalGastado;
  const gajos = useMemo(
    () => calcularGajos({ ranked, totales, total, seleccion, acento }),
    [ranked, totales, total, seleccion, acento],
  );

  const alternar = (categoria) => onSeleccionar(seleccion === categoria ? null : categoria);

  const centroEtiqueta = seleccion ? seleccion.toUpperCase() : `TOTAL ${etiquetas.centro}`;
  const centroMonto = dinero(seleccion ? totales[seleccion] : total);
  const centroSub = seleccion
    ? `${Math.round((totales[seleccion] / (total || 1)) * 100)}% del periodo`
    : total > 0
      ? `${ranked[0]} manda`
      : 'nada que repartir';

  return (
    <section className="tarjeta">
      <div className="seccion__cabecera">
        <h2 className="seccion__titulo">A dónde se fue</h2>
        <div className="segmentado segmentado--mini">
          {['Dona', 'Barras'].map((opcion) => (
            <button
              key={opcion}
              type="button"
              className={`segmentado__btn${modo === opcion ? ' segmentado__btn--activo' : ''}`}
              onClick={() => onCambiarModo(opcion)}
              aria-pressed={modo === opcion}
            >
              {opcion}
            </button>
          ))}
        </div>
      </div>

      {modo === 'Dona' ? (
        <div className="grafica">
          <div className="dona">
            <div className="dona__lienzo">
              <svg viewBox="0 0 200 200" className="dona__svg" role="img" aria-label={`Gastos por categoría: ${centroMonto} en total`}>
                <circle cx="100" cy="100" r="72" fill="none" stroke="#F1F5F9" strokeWidth="24" />
                {gajos.map((g) => (
                  <circle
                    key={g.categoria}
                    className="dona__gajo"
                    cx="100"
                    cy="100"
                    r="72"
                    fill="none"
                    stroke={g.color}
                    strokeWidth={g.grosor}
                    strokeDasharray={g.dash}
                    strokeDashoffset={g.desfase}
                    opacity={g.opacidad}
                    onClick={() => alternar(g.categoria)}
                  />
                ))}
              </svg>

              <div className="dona__centro">
                <span className="dona__centro-etiqueta">{centroEtiqueta}</span>
                <span className="dona__centro-monto">{centroMonto}</span>
                <span className="dona__centro-sub">{centroSub}</span>
              </div>
            </div>

            <Nivis pose="cuerpo" ancho={74} alto={100} className="dona__nivis" />
          </div>

          <div className="leyenda">
            {gajos.length === 0 && (
              <p className="buscador__vacio">
                Nada que repartir todavía. En cuanto anotes tu primer gasto, aquí aparece.
              </p>
            )}
            {gajos.map((g) => (
              <button
                key={g.categoria}
                type="button"
                className={`leyenda__fila${seleccion === g.categoria ? ' leyenda__fila--activa' : ''}`}
                onClick={() => alternar(g.categoria)}
                aria-pressed={seleccion === g.categoria}
              >
                <span className="leyenda__color" style={{ background: g.color }} />
                <span className="leyenda__cat">{g.categoria}</span>
                <span className="leyenda__pct">{g.pct}%</span>
                <span className="leyenda__monto">{dinero(g.monto)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="barras">
          <Nivis pose="asoma" className="barras__nivis" />

          <div className="barras__lista">
            {gajos.map((g) => (
              <button
                key={g.categoria}
                type="button"
                className="barra-cat"
                onClick={() => alternar(g.categoria)}
                aria-pressed={seleccion === g.categoria}
              >
                <span className="barra-cat__cabecera">
                  <span className="barra-cat__nombre">{g.categoria}</span>
                  <span className="barra-cat__pct">{g.pct}%</span>
                  <span className="barra-cat__monto">{dinero(g.monto)}</span>
                </span>
                <span className="barra-cat__pista">
                  <span
                    className="barra-cat__relleno"
                    style={{ width: `${g.anchoBarra}%`, background: g.color, opacity: g.opacidad }}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
