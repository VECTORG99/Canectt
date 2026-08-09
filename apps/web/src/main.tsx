import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { App } from './App';
// Las @font-face de las fuentes autohospedadas (Roboto / Roboto Mono,
// Apache-2.0) viven en global.css y apuntan a /fonts/*.woff2.
import './styles/global.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Elemento #root no encontrado');

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
