import { dinero, etiquetaDeFecha } from '../lib/formato';

export default function TarjetaBalance({
  metricas,
  etiquetas,
  ingresos,
  hoy,
  onRegistrarIngreso,
  onVerIngresos,
  onBorrarIngreso,
  borrando,
}) {
  const { totalIngresos, balance, porcentajeDelIngreso, totalGastado } = metricas;
  const enRojo = balance < 0;
  // La lista completa vive en su propia hoja; aquí solo caben los últimos.
  const recientes = ingresos.slice(0, 3);

  return (
    <section className="tarjeta balance">
      <div className="balance__fila">
        <div className="balance__bloque">
          <span className="etiqueta-mono">INGRESOS {etiquetas.corto}</span>
          <span className="balance__cifra">{dinero(totalIngresos)}</span>
        </div>
        <div className="balance__bloque balance__bloque--derecha">
          <span className="etiqueta-mono">TE QUEDA</span>
          <span
            className="balance__cifra"
            style={{ color: enRojo ? '#5C8FB0' : 'var(--azul-oscuro)' }}
          >
            {enRojo ? '−' : ''}
            {dinero(Math.abs(balance))}
          </span>
        </div>
      </div>

      <div className="balance__progreso">
        <div className="barra">
          <div
            className="barra__relleno"
            style={{ width: `${Math.min(porcentajeDelIngreso, 100)}%` }}
          />
        </div>
        <span className="balance__nota">
          {totalGastado === 0 ? (
            <>
              Todavía no gastas <strong>nada</strong> {etiquetas.label}. Intacto.
            </>
          ) : totalIngresos === 0 ? (
            <>Sin ingresos anotados {etiquetas.label}, así que no hay porcentaje que sacar.</>
          ) : (
            <>
              Gastaste el <strong>{porcentajeDelIngreso}%</strong> de tu ingreso {etiquetas.label}.
            </>
          )}
        </span>
      </div>

      <div className="balance__ingresos">
        {recientes.map((ingreso) => (
          <div key={ingreso.id} className="fila">
            <span className="fila__punto" style={{ background: '#9CCBF0' }} />
            <div className="fila__texto">
              <span className="fila__label">{ingreso.label}</span>
              <span className="fila__detalle">
                {ingreso.fuente} · {etiquetaDeFecha(ingreso.fecha, hoy)}
              </span>
            </div>
            <span className="fila__monto fila__monto--ingreso">+{dinero(ingreso.monto)}</span>
            <button
              type="button"
              className="fila__accion"
              onClick={() => onBorrarIngreso(ingreso.id)}
              disabled={borrando === ingreso.id}
              aria-label={`Borrar ingreso ${ingreso.label}`}
            >
              ✕
            </button>
          </div>
        ))}

        {ingresos.length === 0 && (
          <p className="balance__vacio">
            Sin ingresos en este periodo. Anota el primero y Nivis te dice qué conviene repetir.
          </p>
        )}

        <div className="balance__acciones">
          <button type="button" className="boton-suave" onClick={onRegistrarIngreso}>
            + Registrar ingreso
          </button>
          <button type="button" className="boton-suave boton-suave--claro" onClick={onVerIngresos}>
            Ver todos {ingresos.length > 0 && `(${ingresos.length})`}
          </button>
        </div>
      </div>
    </section>
  );
}
