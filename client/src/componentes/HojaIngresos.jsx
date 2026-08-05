import Hoja from './Hoja.jsx';
import Nivis from './Nivis.jsx';
import EdicionDeFila from './EdicionDeFila.jsx';
import { dinero, etiquetaDeFecha } from '../lib/formato';

/**
 * Todos los ingresos del periodo, desglosados por fuente.
 *
 * Es la mitad de la app que no regaña: en vez de señalar en qué se te fue el
 * dinero, señala de dónde viene y qué conviene seguir haciendo. Los textos los
 * redacta el servidor con el tono elegido (ver server/src/dominio/voz.js).
 */
export default function HojaIngresos({
  desglose,
  ingresos,
  etiquetas,
  hoy,
  onCerrar,
  onRegistrar,
  onBorrar,
  borrando,
  editando,
  onEditar,
  onGuardar,
}) {
  const { total, titular, fuentes, cierre } = desglose;

  return (
    <Hoja
      titulo="Tus ingresos"
      subtitulo={`Todo lo que entró ${etiquetas.label}`}
      onCerrar={onCerrar}
    >
      <div className="ingresos">
        <div className="ingresos__total">
          <span className="etiqueta-mono">TOTAL {etiquetas.corto}</span>
          <span className="ingresos__cifra">{dinero(total)}</span>
        </div>

        <div className="consejo consejo--ingresos">
          <Nivis pose="tip" ancho={36} alto={36} className="consejo__cara" />
          <div className="consejo__cuerpo">
            <span className="consejo__etiqueta">DE DÓNDE VIENE TU DINERO</span>
            <p className="consejo__texto">{titular}</p>
          </div>
        </div>

        {fuentes.length > 0 && (
          <div className="fuentes">
            {fuentes.map((f) => (
              <article key={f.fuente} className="fuente">
                <div className="fuente__cabecera">
                  <span className="fuente__nombre">{f.fuente}</span>
                  <span className="fuente__monto">{dinero(f.total)}</span>
                </div>

                <div className="barra barra--fina">
                  <div className="barra__relleno" style={{ width: `${f.porcentaje}%` }} />
                </div>

                <span className="fuente__detalle">
                  {f.porcentaje}% de tus ingresos · {f.movimientos}{' '}
                  {f.movimientos === 1 ? 'movimiento' : 'movimientos'}
                </span>

                <p className="fuente__mensaje">{f.mensaje}</p>
              </article>
            ))}
          </div>
        )}

        {cierre && <p className="ingresos__cierre">{cierre}</p>}

        <div className="ingresos__lista">
          <span className="campo__label">MOVIMIENTO POR MOVIMIENTO</span>

          {ingresos.map((ingreso) =>
            editando === ingreso.id ? (
              <EdicionDeFila
                key={ingreso.id}
                label={ingreso.label}
                monto={ingreso.monto}
                onGuardar={(cambios) => onGuardar(ingreso.id, cambios)}
                onCancelar={() => onEditar(null)}
              />
            ) : (
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
                  onClick={() => onEditar(ingreso.id)}
                  disabled={borrando === ingreso.id}
                  aria-label={`Editar ingreso ${ingreso.label}`}
                >
                  {/* Ver el comentario del mismo botón en BuscadorDeGastos. */}
                  {'✎︎'}
                </button>
                <button
                  type="button"
                  className="fila__accion"
                  onClick={() => onBorrar(ingreso.id)}
                  disabled={borrando === ingreso.id}
                  aria-label={`Borrar ingreso ${ingreso.label}`}
                >
                  ✕
                </button>
              </div>
            ),
          )}

          {ingresos.length === 0 && (
            <p className="balance__vacio">
              Todavía no hay nada anotado. El primer ingreso es el que pone todo lo demás en
              contexto.
            </p>
          )}
        </div>

        <button type="button" className="boton-primario" onClick={onRegistrar}>
          + Registrar ingreso
        </button>
      </div>
    </Hoja>
  );
}
