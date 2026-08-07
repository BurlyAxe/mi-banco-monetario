import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSesion } from '../contexto/SesionContexto.jsx';
import { useResumen } from '../hooks/useResumen.js';
import { api } from '../lib/api';
import { hayConexion, suscribirse as suscribirseAConexion } from '../lib/conexion';
import { dinero, etiquetaDeMes, hoyISO } from '../lib/formato';

import Encabezado from '../componentes/Encabezado.jsx';
import SelectorDePeriodo from '../componentes/SelectorDePeriodo.jsx';
import BarraHerramientas from '../componentes/BarraHerramientas.jsx';
import TarjetaBalance from '../componentes/TarjetaBalance.jsx';
import TarjetaVeredicto from '../componentes/TarjetaVeredicto.jsx';
import TarjetaConsejo from '../componentes/TarjetaConsejo.jsx';
import GraficaGastos from '../componentes/GraficaGastos.jsx';
import BuscadorDeGastos from '../componentes/BuscadorDeGastos.jsx';
import AccionesFlotantes from '../componentes/AccionesFlotantes.jsx';
import AvisoDeInstalacion from '../componentes/AvisoDeInstalacion.jsx';
import Nivis from '../componentes/Nivis.jsx';
import Pildora from '../componentes/Pildora.jsx';
import HojaGasto from '../componentes/HojaGasto.jsx';
import HojaTicket from '../componentes/HojaTicket.jsx';
import HojaIngreso from '../componentes/HojaIngreso.jsx';
import HojaIngresos from '../componentes/HojaIngresos.jsx';
import HojaAjustes from '../componentes/HojaAjustes.jsx';
import HojaCalendario from '../componentes/HojaCalendario.jsx';
import HojaChat from '../componentes/HojaChat.jsx';
import Cargando from '../componentes/Cargando.jsx';

/**
 * Confirmación de una corrección. Nombra solo lo que cambió: si el usuario
 * únicamente arregló un cero, repetirle el nombre no le dice nada nuevo.
 */
const textoDeCorreccion = ({ label, monto }) => {
  if (label && monto !== undefined) return `Corregido: ${label} por ${dinero(monto)}.`;
  if (label) return `Listo, ahora se llama ${label}.`;
  return `Listo, la cantidad quedó en ${dinero(monto)}.`;
};

export default function Panel() {
  const { usuario, salir, guardarAjustes } = useSesion();

  const [periodo, setPeriodo] = useState('mes');
  const { datos, cargando, error, recargar } = useResumen(periodo);

  const [seleccion, setSeleccion] = useState(null);
  const [consulta, setConsulta] = useState('');
  const [fecha, setFecha] = useState('');
  const [modo, setModo] = useState(usuario.ajustes.graficaPorDefecto);
  const [indiceConsejo, setIndiceConsejo] = useState(0);
  // 'gasto' | 'ticket' | 'ingreso' | 'ingresos' | 'ajustes' | 'calendario' | 'chat'
  const [hoja, setHoja] = useState(null);
  const [pildora, setPildora] = useState('');
  const [borrando, setBorrando] = useState(null);
  // Id del movimiento que se está corrigiendo. Uno a la vez, en su propia fila.
  const [editandoGasto, setEditandoGasto] = useState(null);
  const [editandoIngreso, setEditandoIngreso] = useState(null);

  const temporizador = useRef(null);

  const conectado = useSyncExternalStore(suscribirseAConexion, hayConexion, () => true);
  const estabaConectado = useRef(conectado);

  /**
   * Al volver la señal se piden los números otra vez, solos.
   *
   * Si no, la app se queda enseñando el error del momento en que se cayó hasta
   * que el usuario toque algo — y como el aviso de arriba acaba de desaparecer,
   * lo que ve es una app con línea que insiste en que no la tiene.
   */
  useEffect(() => {
    if (conectado && !estabaConectado.current) recargar();
    estabaConectado.current = conectado;
  }, [conectado, recargar]);

  /**
   * Atajos del icono: en Android, dejar pulsada la app ofrece "Anotar un
   * gasto", "Escanear un ticket" y "Anotar un ingreso". Cada uno entra por
   * `/?accion=…` y abre esa hoja directamente.
   *
   * La URL se limpia en cuanto se usa: si se quedara puesta, recargar la app
   * —o volver a ella días después— reabriría la hoja como si el usuario la
   * hubiera pedido otra vez.
   */
  useEffect(() => {
    const accion = new URLSearchParams(window.location.search).get('accion');
    if (!['gasto', 'ticket', 'ingreso'].includes(accion)) return;
    setHoja(accion);
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  // La píldora se va sola a los 4.2 s, como en el diseño.
  const mostrarPildora = useCallback((texto) => {
    setPildora(texto);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setPildora(''), 4200);
  }, []);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const cambiarPeriodo = (nuevo) => {
    setPeriodo(nuevo);
    setFecha('');
  };

  const limpiarFiltros = () => {
    setSeleccion(null);
    setConsulta('');
    setFecha('');
  };

  /**
   * Del calendario al buscador: deja el día elegido como único filtro y baja
   * la vista hasta la lista, que si no el filtro cambia fuera de pantalla y
   * parece que no pasó nada.
   */
  const filtrarDia = (dia) => {
    setSeleccion(null);
    setConsulta('');
    setFecha(dia);
    requestAnimationFrame(() => {
      document.getElementById('buscador')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  /**
   * Da de alta el gasto. Es el único camino: lo llaman igual la hoja de
   * "Gasté en…" y la revisión de un ticket, porque un gasto leído por la IA no
   * se registra distinto ni antes que uno tecleado a mano.
   */
  const registrarGasto = async (gasto) => {
    const { mensaje } = await api.crearGasto(gasto);
    setHoja(null);
    await recargar();
    mostrarPildora(mensaje);
  };

  const registrarIngreso = async (ingreso) => {
    const { mensaje } = await api.crearIngreso(ingreso);
    setHoja(null);
    await recargar();
    mostrarPildora(mensaje);
  };

  // El veredicto y los consejos los redacta el servidor con el tono guardado,
  // así que al cambiar ajustes hay que volver a pedirlos.
  const aplicarAjustes = async (cambios) => {
    await guardarAjustes(cambios);
    if (cambios.graficaPorDefecto) setModo(cambios.graficaPorDefecto);
    await recargar();
  };

  /**
   * Guarda una corrección de nombre o cantidad. El error se deja subir a
   * propósito: lo atrapa la fila en edición y lo enseña ahí mismo, sin cerrar
   * el formulario ni perder lo que el usuario acababa de teclear.
   */
  const guardarEdicion = async (tipo, id, cambios) => {
    if (tipo === 'gasto') {
      await api.editarGasto(id, cambios);
      setEditandoGasto(null);
    } else {
      await api.editarIngreso(id, cambios);
      setEditandoIngreso(null);
    }
    await recargar();
    mostrarPildora(textoDeCorreccion(cambios));
  };

  const borrar = async (tipo, id) => {
    setBorrando(id);
    try {
      if (tipo === 'gasto') await api.borrarGasto(id);
      else await api.borrarIngreso(id);
      await recargar();
    } catch (err) {
      mostrarPildora(err.message);
    } finally {
      setBorrando(null);
    }
  };

  if (cargando && !datos) return <Cargando texto="Contando tu dinero…" />;

  /**
   * Sin datos que enseñar. Estando sin señal se dice eso y no "algo salió
   * mal": son dos problemas distintos, con dos soluciones distintas, y en una
   * app instalada —sin barra de navegador donde ver que la página no cargó—
   * confundirlos hace que una tarde en el metro parezca la app rota.
   */
  if (!datos) {
    return (
      <main className="app app--vacia">
        <Nivis pose="cuerpo" ancho={92} alto={126} />
        <h1 className="vacia__titulo">{conectado ? 'No pudimos abrir tu banco' : 'Aquí no llega la señal'}</h1>
        <p className="vacia__texto">
          {conectado
            ? error || 'No pudimos cargar tus movimientos.'
            : 'Tus números viven en el servidor y ahorita no se puede llegar a él. En cuanto vuelva la conexión aparecen solos, sin que tengas que hacer nada.'}
        </p>
        <button type="button" className="boton-primario" onClick={() => recargar({ conIndicador: true })}>
          Reintentar
        </button>
      </main>
    );
  }

  const {
    gastos,
    ingresos,
    totales,
    ranked,
    metricas,
    etiquetas,
    veredicto,
    consejos,
    etiquetaConsejo,
    desgloseIngresos,
  } = datos;

  return (
    <main className="app" style={{ '--acento': usuario.ajustes.colorAcento }}>
      <Encabezado
        usuario={usuario}
        mes={etiquetaDeMes(datos.hoy || hoyISO())}
        onAbrirAjustes={() => setHoja('ajustes')}
      />

      <SelectorDePeriodo periodo={periodo} onCambiar={cambiarPeriodo} />

      <BarraHerramientas
        onCalendario={() => setHoja('calendario')}
        onChat={() => setHoja('chat')}
        diaFiltrado={Boolean(fecha)}
      />

      {error && <p className="alerta">{error}</p>}

      <TarjetaBalance
        metricas={metricas}
        etiquetas={etiquetas}
        ingresos={ingresos}
        hoy={datos.hoy}
        onRegistrarIngreso={() => setHoja('ingreso')}
        onVerIngresos={() => setHoja('ingresos')}
        onBorrarIngreso={(id) => borrar('ingreso', id)}
        borrando={borrando}
      />

      <TarjetaVeredicto metricas={metricas} etiquetas={etiquetas} veredicto={veredicto} />

      <TarjetaConsejo
        consejo={consejos[indiceConsejo % consejos.length]}
        etiqueta={etiquetaConsejo}
        onOtro={() => setIndiceConsejo((i) => i + 1)}
      />

      <GraficaGastos
        ranked={ranked}
        totales={totales}
        metricas={metricas}
        etiquetas={etiquetas}
        seleccion={seleccion}
        onSeleccionar={setSeleccion}
        modo={modo}
        onCambiarModo={setModo}
        acento={usuario.ajustes.colorAcento}
      />

      <BuscadorDeGastos
        gastos={gastos}
        ranked={ranked}
        hoy={datos.hoy}
        consulta={consulta}
        onConsulta={setConsulta}
        fecha={fecha}
        onFecha={setFecha}
        seleccion={seleccion}
        onSeleccion={setSeleccion}
        onLimpiar={limpiarFiltros}
        onBorrarGasto={(id) => borrar('gasto', id)}
        borrando={borrando}
        editando={editandoGasto}
        onEditarGasto={setEditandoGasto}
        onGuardarGasto={(id, cambios) => guardarEdicion('gasto', id, cambios)}
      />

      <AvisoDeInstalacion />

      <p className="pie">Mi banco monetario · los números no juzgan, solo apuntan.</p>

      <AccionesFlotantes
        onIngreso={() => setHoja('ingreso')}
        onGasto={() => setHoja('gasto')}
        onTicket={() => setHoja('ticket')}
      />

      <Pildora texto={pildora} />

      {hoja === 'gasto' && (
        <HojaGasto
          onCerrar={() => setHoja(null)}
          onGuardar={registrarGasto}
          onLeerTicket={() => setHoja('ticket')}
        />
      )}
      {hoja === 'ticket' && (
        <HojaTicket
          onCerrar={() => setHoja(null)}
          onGuardar={registrarGasto}
          onAnotarAMano={() => setHoja('gasto')}
        />
      )}
      {hoja === 'ingreso' && (
        <HojaIngreso onCerrar={() => setHoja(null)} onGuardar={registrarIngreso} />
      )}
      {hoja === 'ingresos' && (
        <HojaIngresos
          desglose={desgloseIngresos}
          ingresos={ingresos}
          etiquetas={etiquetas}
          hoy={datos.hoy}
          onCerrar={() => {
            setHoja(null);
            setEditandoIngreso(null);
          }}
          onRegistrar={() => setHoja('ingreso')}
          onBorrar={(id) => borrar('ingreso', id)}
          borrando={borrando}
          editando={editandoIngreso}
          onEditar={setEditandoIngreso}
          onGuardar={(id, cambios) => guardarEdicion('ingreso', id, cambios)}
        />
      )}
      {hoja === 'ajustes' && (
        <HojaAjustes
          usuario={usuario}
          onCerrar={() => setHoja(null)}
          onGuardar={aplicarAjustes}
          onSalir={salir}
        />
      )}
      {hoja === 'calendario' && (
        <HojaCalendario
          fechaInicial={fecha}
          rango={datos.rango}
          onCerrar={() => setHoja(null)}
          onFiltrarDia={filtrarDia}
        />
      )}
      {hoja === 'chat' && <HojaChat periodo={periodo} onCerrar={() => setHoja(null)} />}
    </main>
  );
}
