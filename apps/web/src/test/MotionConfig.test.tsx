import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MotionConfig } from 'framer-motion';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Verifica que la app envuelve el árbol con <MotionConfig reducedMotion="user">
 * para que Framer Motion respete prefers-reduced-motion: reduce.
 *
 * El test de integración completa (renderizar main.tsx) requiere un DOM con
 * #root y BrowserRouter, lo cual es frágil en unit tests. En su lugar:
 * 1. Verificamos que MotionConfig acepta reducedMotion="user" en runtime.
 * 2. Verificamos que main.tsx contiene el import y el JSX de MotionConfig
 *    (test de regresión: si alguien lo quita, este test falla).
 */
describe('MotionConfig reducedMotion', () => {
  it('MotionConfig acepta reducedMotion="user" sin errores', () => {
    const { container } = render(
      <MotionConfig reducedMotion="user">
        <div>test</div>
      </MotionConfig>,
    );
    expect(container.textContent).toContain('test');
  });

  it('main.tsx importa y usa MotionConfig con reducedMotion="user"', () => {
    const mainPath = join(__dirname, '..', 'main.tsx');
    const source = readFileSync(mainPath, 'utf8');
    expect(source).toContain("import { MotionConfig } from 'framer-motion'");
    expect(source).toContain('reducedMotion="user"');
    expect(source).toContain('<MotionConfig reducedMotion="user">');
  });
});
