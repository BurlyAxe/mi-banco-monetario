import { useEffect, useRef, useState } from 'react';
import Hoja from './Hoja.jsx';
import Nivis from './Nivis.jsx';
import { api } from '../lib/api';
import { dinero, hoyISO } from '../lib/formato';

/** Cuántos turnos se le reenvían a Nivis. El servidor no acepta más de 24. */
const MEMORIA = 20;

/**
 * El chat de apoyo con Nivis: plan de ahorro, plan de gastos y permisos.
 *
 * La conversación vive aquí y se manda completa en cada mensaje; el servidor
 * no guarda pláticas. El contexto financiero NO se manda desde el navegador:
 * el servidor lo vuelve a leer de la base en cada turno, así que Nivis siempre
 * razona con los números de verdad.
 */
export default function HojaChat({ periodo, onCerrar }) {
  const [mensajes, setMensajes] = useState([]);
  const [plan, setPlan] = useState(null);
  const [sugerencias, setSugerencias] = useState([]);
  const [conGemini, setConGemini] = useState(true);
  const [borrador, setBorrador] = useState('');
  const [pensando, setPensando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const hilo = useRef(null);
  const campo = useRef(null);

  useEffect(() => {
    let vigente = true;
    api
      .inicioChat({ periodo, hoy: hoyISO() })
      .then((datos) => {
        if (!vigente) return;
        setMensajes([{ rol: 'nivis', texto: datos.saludo }]);
        setPlan(datos.plan);
        setSugerencias(datos.sugerencias);
        setConGemini(datos.conGemini);
      })
      .catch((err) => vigente && setError(err.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [periodo]);

  // Cada mensaje nuevo baja el hilo: en el celular lo último es lo que importa.
  useEffect(() => {
    hilo.current?.scrollTo({ top: hilo.current.scrollHeight, behavior: 'smooth' });
  }, [mensajes, pensando]);

  const enviar = async (texto) => {
    const limpio = texto.trim();
    if (!limpio || pensando) return;

    const historial = [...mensajes, { rol: 'usuario', texto: limpio }];
    setMensajes(historial);
    setBorrador('');
    setPensando(true);
    setError('');
    setAviso('');

    try {
      const respuesta = await api.chat({
        mensajes: historial.slice(-MEMORIA),
        periodo,
        hoy: hoyISO(),
      });
      setMensajes([...historial, { rol: 'nivis', texto: respuesta.texto }]);
      setPlan(respuesta.plan);
      if (respuesta.aviso) setAviso(respuesta.aviso);
    } catch (err) {
      setError(err.message);
      // El mensaje se devuelve al campo: perder lo que escribiste sería peor.
      setMensajes(mensajes);
      setBorrador(limpio);
    } finally {
      setPensando(false);
      campo.current?.focus();
    }
  };

  // Enter manda, Shift+Enter hace salto de línea (en el celular no estorba).
  const alTeclear = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar(borrador);
    }
  };

  const soloSaludo = mensajes.length <= 1;

  return (
    <Hoja
      titulo="Habla con Nivis"
      subtitulo="Tu plan de ahorro, de gastos y tus permisos."
      onCerrar={onCerrar}
    >
      {plan && plan.hayIngresos && !plan.enRojo && (
        <div className="plan">
          <div className="plan__dato">
            <span className="plan__label">AHORRO</span>
            <span className="plan__valor">{dinero(plan.ahorroMeta)}</span>
          </div>
          <div className="plan__dato">
            <span className="plan__label">AL DÍA</span>
            <span className="plan__valor">{dinero(plan.topeDiario)}</span>
          </div>
          <div className="plan__dato">
            <span className="plan__label">PERMISO</span>
            <span className="plan__valor">{dinero(plan.permisos.mediano)}</span>
          </div>
        </div>
      )}

      <div className="chat" ref={hilo}>
        {cargando && <p className="chat__estado">Nivis está revisando tus números…</p>}

        {mensajes.map((m, i) => (
          <div key={i} className={`burbuja burbuja--${m.rol}`}>
            {m.rol === 'nivis' && <Nivis pose="tip" className="burbuja__cara" ancho={26} alto={26} />}
            <p className="burbuja__texto">{m.texto}</p>
          </div>
        ))}

        {pensando && (
          <div className="burbuja burbuja--nivis">
            <Nivis pose="tip" className="burbuja__cara" ancho={26} alto={26} />
            <p className="burbuja__texto chat__estado">Nivis está pensando…</p>
          </div>
        )}
      </div>

      {!cargando && soloSaludo && (
        <div className="chips chips--envueltos">
          {sugerencias.map((s) => (
            <button
              key={s}
              type="button"
              className="chip chip--grande"
              onClick={() => enviar(s)}
              disabled={pensando}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {aviso && <p className="chat__nota">{aviso}</p>}
      {!cargando && !conGemini && !aviso && (
        <p className="chat__nota">
          Nivis responde con el plan que calcula la app. Para platicar libre, configura
          GEMINI_API_KEY en el servidor.
        </p>
      )}
      {error && <p className="alerta">{error}</p>}

      <form
        className="chat__envio"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(borrador);
        }}
      >
        <textarea
          ref={campo}
          className="chat__campo"
          rows={1}
          maxLength={1000}
          placeholder="¿Me alcanza para unos tenis de $900?"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={alTeclear}
          disabled={cargando}
          aria-label="Escríbele a Nivis"
        />
        <button
          type="submit"
          className="chat__enviar"
          disabled={!borrador.trim() || pensando || cargando}
          aria-label="Enviar"
        >
          ↑
        </button>
      </form>
    </Hoja>
  );
}
