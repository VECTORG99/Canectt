import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from './theme/ThemeProvider';
import { App } from './App';
// Las @font-face de las fuentes autohospedadas (Roboto / Roboto Mono,
// Apache-2.0) viven en global.css y apuntan a /fonts/*.woff2.
import './styles/global.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Elemento #root no encontrado');

createRoot(rootEl).render(
  <StrictMode>
    {/* reducedMotion="user" hace que Framer Motion respete
        prefers-reduced-motion: reduce del SO del usuario y desactive
        las animaciones JS-driven (transiciones de pagina, layout,
        AnimatePresence). Complementa la regla CSS global de tokens.css
        que desactiva animaciones CSS. */}
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>,
);
