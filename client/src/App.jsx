import { Navigate, Route, Routes } from 'react-router-dom';
import { ProveedorDeSesion, useSesion } from './contexto/SesionContexto.jsx';
import Acceso from './paginas/Acceso.jsx';
import Panel from './paginas/Panel.jsx';
import Cargando from './componentes/Cargando.jsx';

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
