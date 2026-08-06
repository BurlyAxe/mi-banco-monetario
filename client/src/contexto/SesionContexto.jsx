import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, guardarToken, borrarToken, leerToken } from '../lib/api';

const SesionContexto = createContext(null);

export function ProveedorDeSesion({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(Boolean(leerToken()));

  // Al abrir la app, si hay token guardado revalidamos contra el servidor.
  useEffect(() => {
    if (!leerToken()) return;
    let vigente = true;
    api
      .yo()
      .then(({ usuario }) => vigente && setUsuario(usuario))
      .catch((err) => {
        // Solo un 401 significa que el token dejó de servir, y en ese caso ya
        // lo borró `pedir`. Que no haya internet, o que el servidor esté
        // caído, no es motivo para cerrarle la sesión a nadie: antes bastaba
        // con abrir la app sin señal una vez para tener que volver a teclear
        // la contraseña. El token se queda y la sesión revive al reconectar.
        if (err.estado === 401) borrarToken();
      })
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, []);

  const entrar = useCallback(async (credenciales) => {
    const { token, usuario } = await api.login(credenciales);
    guardarToken(token);
    setUsuario(usuario);
  }, []);

  const registrarse = useCallback(async (datos) => {
    const { token, usuario } = await api.registro(datos);
    guardarToken(token);
    setUsuario(usuario);
  }, []);

  const salir = useCallback(() => {
    borrarToken();
    setUsuario(null);
  }, []);

  const guardarAjustes = useCallback(async (cambios) => {
    const { usuario } = await api.guardarAjustes(cambios);
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
