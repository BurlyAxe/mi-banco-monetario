import { useSyncExternalStore } from 'react';
import { hayConexion, suscribirse } from '../lib/conexion';

/**
 * "Sin conexión": la barrita de arriba cuando no hay línea.
 *
 * Instalada, la app se abre sin barra de navegador: no hay ningún sitio donde
 * el usuario pueda ver que la página no cargó. Sin este aviso, quedarse sin
 * señal se veía exactamente igual que la app rota, y con dinero de por medio
 * esa confusión no es menor.
 *
 * Va arriba y fija, por encima incluso de las hojas: el momento en que más
 * importa saberlo es justo cuando estás tecleando un gasto que no se va a
 * poder guardar.
 */
export default function AvisoDeConexion() {
  const conectado = useSyncExternalStore(suscribirse, hayConexion, () => true);
  if (conectado) return null;

  return (
    <div className="sin-conexion" role="status" aria-live="polite">
      <span className="sin-conexion__punto" aria-hidden="true" />
      Sin conexión · no se puede guardar ni ver tus números
    </div>
  );
}
