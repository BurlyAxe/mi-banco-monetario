import { Navigate, Route, Routes } from 'react-router-dom';
import { ProveedorDeSesion, useSesion } from './contexto/SesionContexto.jsx';
import Acceso from './paginas/Acceso.jsx';
import Panel from './paginas/Panel.jsx';
import Cargando from './componentes/Cargando.jsx';
import AvisoDeConexion from './componentes/AvisoDeConexion.jsx';
import AvisoDeActualizacion from './componentes/AvisoDeActualizacion.jsx';

function RutaPrivada({ children }) {
  const { usuario, cargando } = useSesion();
  if (cargando) return <Cargando texto="Abriendo tu banco…" />;
  return usuario ? children : <Navigate to="/acceso" replace />;
}

function RutaPublica({ children }) {
  const { usuario, cargando } = useSesion();
  if (cargando) return <Cargando texto="Abriendo tu banco…" />;
  return usuario ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <ProveedorDeSesion>
      {/* Fuera de las rutas: valen igual en el panel que en la pantalla de
          acceso, y no tienen por qué volver a montarse al navegar. */}
      <AvisoDeConexion />
      <AvisoDeActualizacion />

      <Routes>
        <Route
          path="/acceso"
          element={
            <RutaPublica>
              <Acceso />
            </RutaPublica>
          }
        />
        <Route
          path="/"
          element={
            <RutaPrivada>
              <Panel />
            </RutaPrivada>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProveedorDeSesion>
  );
}
