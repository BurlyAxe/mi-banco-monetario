import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, guardarToken, borrarToken, leerToken, leerUsuario, guardarUsuario } from '../lib/api';

const SesionContexto = createContext(null);

/** El perfil guardado solo vale si sigue habiendo token con el que usarlo. */
const sesionGuardada = () => (leerToken() ? leerUsuario() : null);

export function ProveedorDeSesion({ children }) {
  // Se arranca con lo último que se supo del usuario y se revalida por detrás.
  // Esperar a que el servidor conteste antes de dejar entrar significaba que
  // sin señal no se entraba nunca.
  const [usuario, setUsuario] = useState(sesionGuardada);
  // Solo se hace esperar a quien no tiene perfil guardado: sesiones de antes de
  // que esto existiera, que sí necesitan preguntar quiénes son.
  const [cargando, setCargando] = useState(Boolean(leerToken()) && !sesionGuardada());

  // Al abrir la app, si hay token guardado revalidamos contra el servidor.
  useEffect(() => {
    if (!leerToken()) return;
    let vigente = true;
    api
      .yo()
      .then(({ usuario }) => {
        if (!vigente) return;
        // El servidor manda: si cambiaron los ajustes desde otro aparato, esta
        // es la respuesta buena y la copia local se pone al día.
        setUsuario(usuario);
        guardarUsuario(usuario);
      })
      .catch((err) => {
        // Solo un 401 significa que el token dejó de servir, y en ese caso ya
        // lo borró `pedir`. Que no haya internet, o que el servidor esté
        // caído, no es motivo para cerrarle la sesión a nadie: antes bastaba
        // con abrir la app sin señal una vez para tener que volver a teclear
        // la contraseña. El token se queda y la sesión revive al reconectar.
        if (err.estado === 401 && vigente) {
          borrarToken();
          // Ahora que la sesión empieza con el perfil guardado puesto, hay que
          // quitarlo a mano: si no, el token muere pero la app sigue enseñando
          // el panel de alguien que ya no puede pedir nada.
          setUsuario(null);
        }
      })
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, []);

  const entrar = useCallback(async (credenciales) => {
    const { token, usuario } = await api.login(credenciales);
    guardarToken(token);
    guardarUsuario(usuario);
    setUsuario(usuario);
  }, []);

  const registrarse = useCallback(async (datos) => {
    const { token, usuario } = await api.registro(datos);
    guardarToken(token);
    guardarUsuario(usuario);
    setUsuario(usuario);
  }, []);

  const salir = useCallback(() => {
    borrarToken();
    setUsuario(null);
  }, []);

  const guardarAjustes = useCallback(async (cambios) => {
    const { usuario } = await api.guardarAjustes(cambios);
    guardarUsuario(usuario);
    setUsuario(usuario);
    return usuario;
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, entrar, registrarse, salir, guardarAjustes }),
    [usuario, cargando, entrar, registrarse, salir, guardarAjustes],
  );

  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

export function useSesion() {
  const contexto = useContext(SesionContexto);
  if (!contexto) throw new Error('useSesion debe usarse dentro de <ProveedorDeSesion>');
  return contexto;
}
