import { useState } from 'react';
import Nivis from '../componentes/Nivis.jsx';
import { useSesion } from '../contexto/SesionContexto.jsx';

export default function Acceso() {
  const { entrar, registrarse } = useSesion();
  const [esRegistro, setEsRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    setError('');
    try {
      if (esRegistro) await registrarse({ nombre: nombre.trim(), correo, contrasena });
      else await entrar({ correo, contrasena });
    } catch (err) {
      setError(err.detalles?.length ? `${err.message}: ${err.detalles.join(', ')}` : err.message);
      setEnviando(false);
    }
  };

  const cambiarModo = () => {
    setEsRegistro((v) => !v);
    setError('');
  };

  return (
    <main className="acceso">
      <div className="acceso__marca">
        <Nivis pose="cara" ancho={72} alto={72} />
        <h1 className="acceso__titulo">Mi banco monetario</h1>
        <span className="acceso__lema">¿POR QUÉ ME QUEDÉ SIN DINERO?</span>
      </div>

      <form className="acceso__formulario" onSubmit={enviar}>
        {esRegistro && (
          <div className="campo">
            <label className="campo__label" htmlFor="acceso-nombre">
              CÓMO TE LLAMAS
            </label>
            <input
              id="acceso-nombre"
              className="campo__entrada"
              type="text"
              autoComplete="name"
              maxLength={60}
              placeholder="Ana Sofía"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
        )}

        <div className="campo">
          <label className="campo__label" htmlFor="acceso-correo">
            CORREO
          </label>
          <input
            id="acceso-correo"
            className="campo__entrada"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label className="campo__label" htmlFor="acceso-contrasena">
            CONTRASEÑA
          </label>
          <input
            id="acceso-contrasena"
            className="campo__entrada"
            type="password"
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            placeholder={esRegistro ? 'Mínimo 8 caracteres' : '••••••••'}
            minLength={esRegistro ? 8 : undefined}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </div>

        {error && <p className="alerta">{error}</p>}

        <button type="submit" className="boton-primario" disabled={enviando}>
          {enviando ? 'Un momento…' : esRegistro ? 'Crear mi cuenta' : 'Entrar'}
        </button>
      </form>

      <p className="acceso__cambio">
        {esRegistro ? '¿Ya tienes cuenta?' : '¿Primera vez por aquí?'}{' '}
        <button type="button" className="acceso__enlace" onClick={cambiarModo}>
          {esRegistro ? 'Inicia sesión' : 'Crea tu cuenta'}
        </button>
      </p>
    </main>
  );
}
