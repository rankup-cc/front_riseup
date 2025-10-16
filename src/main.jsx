import 'leaflet/dist/leaflet.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { PacesProvider } from './context/PacesContext.jsx'; // ⬅️ ajout

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PacesProvider>
      <App />
    </PacesProvider>
  </StrictMode>,
);
