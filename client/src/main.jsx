import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { iniciarInstalacion } from './lib/instalacion';
import { iniciarConexion } from './lib/conexion';
import { iniciarActualizacion } from './lib/actualizacion';
import './estilos/global.css';

// Los tres, antes de pintar nada y fuera de React a propósito: los eventos que
// escuchan —que se puede instalar, que se cayó la red, que hay un service
// worker nuevo— los lanza el navegador cuando le parece, muchas veces antes de
// que React haya montado un solo componente, y si nadie los está escuchando en
// ese momento se pierden sin más.
iniciarInstalacion();
iniciarConexion();
iniciarActualizacion();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
