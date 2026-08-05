import { useEffect, useState } from 'react';
import Hoja from './Hoja.jsx';
import Nivis from './Nivis.jsx';
import { api } from '../lib/api';
import { ETIQUETA_VIBRA, colorDeCategoria, vibraDeGasto } from '../lib/constantes';
import {
  dinero,
  etiquetaDeFecha,
  etiquetaDeMes,
  hoyISO,
  mesDeFecha,
  sumarMeses,
  huecoInicial,
  numeroDeDia,
  INICIALES_DIA,
} from '../lib/formato';

/**
 * El calendario: retroceder a cualquier día y ver qué pasó ese día.
 *
 * Un día va de las 00:00 a las 23:59 de esa fecha, y eso es literal: la fecha
 * se guarda aparte de la hora, así que el gasto de las 23:50 se queda en su
 * día en vez de saltar al siguiente (ver server/src/dominio/fechas.js).
 *
 * Los datos se piden al servidor y no se filtran de lo que ya está en
 * pantalla, porque el panel solo tiene los movimientos del periodo elegido y
 * aquí se puede navegar a meses que ni siquiera están cargados.
 */
export default function HojaCalendario({ fechaInicial, rango, onCerrar, onFiltrarDia }) {
  const hoy = hoyISO();
  const mesActual = mesDeFecha(hoy);

  const [mes, setMes] = useState(mesDeFecha(fechaInicial || hoy));
  const [datosMes, setDatosMes] = useState(null);
  const [elegido, setElegido] = useState(fechaInicial || '');
  const [dia, setDia] = useState(null);
  const [cargandoMes, setCargandoMes] = useState(true);
  const [cargandoDia, setCargandoDia] = useState(false);
  const [error, setError] = useState('');

  // La cuadrícula del mes.
  useEffect(() => {
    let vigente = true;
    setCargandoMes(true);
    api
      .calendario({ mes })
      .then((datos) => vigente && setDatosMes(datos))
      .catch((err) => vigente && setError(err.message))
      .finally(() => vigente && setCargandoMes(false));
    return () => {
      vigente = false;
    };
  }, [mes]);

  // El día elegido, con el resumen que Nivis escribe para esa fecha.
  useEffect(() => {
    if (!elegido) {
      setDia(null);
      return undefined;
    }
    let vigente = true;
    setCargandoDia(true);
    setError('');
    api
      .dia(elegido)
      .then((datos) => vigente && setDia(datos))
      .catch((err) => vigente && setError(err.message))
      .finally(() => vigente && setCargandoDia(false));
    return () => {
      vigente = false;
    };
  }, [elegido]);

  // No hay nada que ver en el futuro, ni antes de tu primer movimiento.
  const haySiguiente = mes < mesActual;
  const hayAnterior = datosMes?.primerMovimiento
    ? mes > mesDeFecha(datosMes.primerMovimiento)
    : false;

  const cambiarMes = (n) => {
    const nuevo = sumarMeses(mes, n);
    if (nuevo > mesActual) return;
    setMes(nuevo);
  };

  const elegir = (fecha) => setElegido((actual) => (actual === fecha ? '' : fecha));

  const dias = datosMes?.dias || [];
  const maximo = datosMes?.maximo || 0;

  return (
    <Hoja
      titulo="Calendario"
      subtitulo="Toca un día para ver qué pasó de sus 00:00 a sus 23:59."
      onCerrar={onCerrar}
    >
      <div className="calendario__nav">
        <button
          type="button"
          className="calendario__flecha"
          onClick={() => cambiarMes(-1)}
          disabled={!hayAnterior || cargandoMes}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="calendario__mes">{etiquetaDeMes(`${mes}-01`)}</span>
        <button
          type="button"
          className="calendario__flecha"
          onClick={() => cambiarMes(1)}
          disabled={!haySiguiente || cargandoMes}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {datosMes && (
        <div className="calendario__totales">
          <span>
            {datosMes.diasConGasto} día{datosMes.diasConGasto === 1 ? '' : 's'} con gasto
          </span>
          <span className="calendario__total">{dinero(datosMes.total)}</span>
        </div>
      )}

      <div className="calendario">
        <div className="calendario__semana" aria-hidden="true">
          {INICIALES_DIA.map((inicial, i) => (
            <span key={i} className="calendario__inicial">
              {inicial}
            </span>
          ))}
        </div>

        <div className="calendario__rejilla" aria-label={`Días de ${etiquetaDeMes(`${mes}-01`)}`}>
          {Array.from({ length: huecoInicial(mes) }, (_, i) => (
            <span key={`hueco-${i}`} className="calendario__hueco" />
          ))}

          {dias.map((d) => {
            const futuro = d.fecha > hoy;
            // Cuánto pesó ese día contra el peor del mes: el día caro se ve de
            // lejos, sin leer un solo número. Se corta en 58% porque con más
            // tinta el número del día deja de leerse sobre el azul.
            const peso = maximo > 0 ? 0.12 + (d.total / maximo) * 0.46 : 0.12;
            return (
              <button
                key={d.fecha}
                type="button"
                disabled={futuro}
                aria-pressed={elegido === d.fecha}
                onClick={() => elegir(d.fecha)}
                className={[
                  'calendario__dia',
                  elegido === d.fecha ? 'calendario__dia--elegido' : '',
                  d.fecha === hoy ? 'calendario__dia--hoy' : '',
                  d.total > 0 ? 'calendario__dia--con-gasto' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={d.total > 0 ? { '--peso': `${peso * 100}%` } : undefined}
                aria-label={`${numeroDeDia(d.fecha)}: ${d.total > 0 ? dinero(d.total) : 'sin gastos'}`}
              >
                <span className="calendario__numero">{numeroDeDia(d.fecha)}</span>
                {d.ingresos > 0 && <span className="calendario__ingreso" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="alerta">{error}</p>}

      {!elegido && (
        <p className="calendario__pista">
          Los días más oscuros son en los que más gastaste. El punto azul marca los días en que
          entró dinero.
        </p>
      )}

      {elegido && cargandoDia && <p className="calendario__pista">Nivis está repasando ese día…</p>}

      {elegido && dia && !cargandoDia && (
        <div className="dia-detalle">
          <div className="consejo">
            <Nivis pose="tip" className="consejo__cara" ancho={38} alto={38} />
            <div className="consejo__cuerpo">
              <span className="consejo__etiqueta">{dia.etiquetaResumen}</span>
              <p className="consejo__texto">{dia.resumen}</p>
            </div>
          </div>

          <div className="dia-detalle__cabecera">
            <span className="dia__label">
              {etiquetaDeFecha(dia.fecha, hoy)} · {dia.inicio}–{dia.fin}
            </span>
            <span className="dia__total">{dinero(dia.metricas.totalGastado)}</span>
          </div>

          {dia.ingresos.map((ingreso) => (
            <div key={ingreso.id} className="fila">
              <span className="fila__punto fila__punto--redondo" style={{ background: '#4B9FDD' }} />
              <div className="fila__texto">
                <span className="fila__label">{ingreso.label}</span>
                <span className="fila__detalle">{ingreso.fuente} · ingreso</span>
              </div>
              <span className="fila__monto fila__monto--ingreso">+{dinero(ingreso.monto)}</span>
            </div>
          ))}

          {dia.gastos.map((gasto) => (
            <div key={gasto.id} className="fila">
              <span
                className="fila__punto fila__punto--redondo"
                style={{ background: colorDeCategoria(gasto.categoria, dia.ranked) }}
              />
              <div className="fila__texto">
                <span className="fila__label">{gasto.label}</span>
                <span className="fila__detalle">
                  {gasto.categoria} · {gasto.hora} · {ETIQUETA_VIBRA[vibraDeGasto(gasto)]}
                </span>
              </div>
              <span className="fila__monto">{dinero(gasto.monto)}</span>
            </div>
          ))}

          {dia.gastos.length === 0 && dia.ingresos.length === 0 && (
            <p className="buscador__vacio">Ese día no quedó anotado ni un movimiento.</p>
          )}

          {/* El buscador solo tiene cargados los movimientos del periodo, así
              que el atajo aparece únicamente cuando el día cae dentro de él. */}
          {dia.gastos.length > 0 && dia.fecha >= rango.desde && dia.fecha <= rango.hasta && (
            <button
              type="button"
              className="boton-suave"
              onClick={() => {
                onFiltrarDia(dia.fecha);
                onCerrar();
              }}
            >
              Ver este día en el buscador
            </button>
          )}
        </div>
      )}
    </Hoja>
  );
}
