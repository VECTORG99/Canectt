import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MotionConfig } from 'framer-motion';
import type { ReactElement } from 'react';

/**
 * Verifica que main.tsx envuelve el árbol de React con
 * <MotionConfig reducedMotion="user"> para que Framer Motion respete
 * prefers-reduced-motion: reduce del SO del usuario.
 *
 * Estrategia: mockear createRoot para capturar el elemento JSX que se
 * pasa a render(), y verificar que la estructura incluye MotionConfig
 * con reducedMotion="user" en el nivel correcto (fuera de ThemeProvider
 * y BrowserRouter).
 */

interface TreeElement {
  type: unknown;
  props: { children?: TreeElement; reducedMotion?: string };
}

let capturedElement: TreeElement | null = null;

vi.mock('react-dom/client', () => ({
  createRoot: () => ({
    render: (el: ReactElement) => {
      capturedElement = el as unknown as TreeElement; // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
    },
  }),
}));

// Mock global.css para no cargar estilos en el test.
vi.mock('../styles/global.css', () => ({}));

// Mock del elemento #root en el DOM.
beforeEach(() => {
  document.body.innerHTML = '<div id="root"></div>';
  capturedElement = null;
});

describe('MotionConfig reducedMotion', () => {
  it('MotionConfig acepta reducedMotion="user" y renderiza children', () => {
    const { container } = render(
      <MotionConfig reducedMotion="user">
        <div>test-content</div>
      </MotionConfig>,
    );
    expect(container.textContent).toContain('test-content');
  });

  it('main.tsx envuelve el árbol con MotionConfig reducedMotion="user"', async () => {
    // Importar main.tsx dinámicamente para que el mock de createRoot se aplique.
    await import('../main');

    expect(capturedElement).not.toBeNull();
    const tree = capturedElement!;

    // StrictMode > MotionConfig > ThemeProvider > BrowserRouter > App
    const motionConfig = tree.props.children;
    expect(motionConfig).toBeDefined();
    expect(motionConfig!.type).toBe(MotionConfig);
    expect(motionConfig!.props.reducedMotion).toBe('user');

    // ThemeProvider dentro de MotionConfig.
    const themeProvider = motionConfig!.props.children;
    expect(themeProvider).toBeDefined();

    // BrowserRouter dentro de ThemeProvider.
    const browserRouter = themeProvider!.props.children;
    expect(browserRouter).toBeDefined();
  });
});
