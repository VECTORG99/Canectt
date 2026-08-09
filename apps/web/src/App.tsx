import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { NotFoundPage } from './pages/NotFoundPage';

// Code splitting por ruta: la landing no carga el editor de arrastrar-y-soltar.
const LandingPage = lazy(() => import('./pages/LandingPage'));
const CreationHubPage = lazy(() => import('./pages/CreationHubPage'));
const ScheduleEditorPage = lazy(() => import('./pages/ScheduleEditorPage'));

function PageFallback() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex min-h-[60vh] items-center justify-center text-text-secondary"
    >
      Cargando…
    </div>
  );
}

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-text-primary">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/crear" element={<CreationHubPage />} />
            <Route path="/horario/:id" element={<ScheduleEditorPage />} />
            <Route path="/horario/:id/exportar" element={<ScheduleEditorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
