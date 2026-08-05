import { dinero } from '../lib/formato';

/**
 * El veredicto del periodo. El texto lo redacta el servidor con el tono que el
 * usuario eligió; aquí solo se arma el titular y las tres métricas.
 *
 * Con cero gastos (cuenta recién creada, típicamente) no hay nada que echar en
 * cara: el titular cambia por completo y celebra el arranque limpio.
 */
export default function TarjetaVeredicto({ metricas, etiquetas, veredicto }) {
  const {
    totalGastado,
    porcentajeTop,
    categoriaTop,
    porDia,
    numeroDeGastos,
    puroGusto,
    porcentajeGusto,
    esencial,
  } = metricas;

  const sinGastos = totalGastado === 0;

  return (
    <section className="tarjeta veredicto">
      <p className="etiqueta-mono" style={{ margin: '0 0 10px', letterSpacing: '0.1em' }}>
        {sinGastos ? 'EL ARRANQUE' : 'EL VEREDICTO'}
      </p>

      <h1 className="veredicto__titulo">
        {sinGastos ? (
          <>
            Llevas <em>$0</em> gastados {etiquetas.label}. Buen inicio.
          </>
        ) : (
          <>
            Gastaste <em>{dinero(totalGastado)}</em> {etiquetas.label}. El{' '}
            <em>{porcentajeTop}%</em> se te fue en <em>{categoriaTop}</em>.
          </>
        )}
      </h1>

      <p className="veredicto__texto">{veredicto}</p>

      {!sinGastos && (
        <div className="metricas">
          <div className="metrica">
            <span className="metrica__etiqueta">POR DÍA</span>
            <span className="metrica__valor">{dinero(porDia)}</span>
          </div>
          <div className="metrica">
            <span className="metrica__etiqueta">MOVS.</span>
            <span className="metrica__valor">{numeroDeGastos}</span>
          </div>
          <div className="metrica">
            <span className="metrica__etiqueta">NECESARIO</span>
            <span className="metrica__valor">{dinero(esencial)}</span>
          </div>
          <div className="metrica metrica--destacada">
            <span className="metrica__etiqueta">PURO GUSTO</span>
            <span className="metrica__valor">
              {dinero(puroGusto)} · {porcentajeGusto}%
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
