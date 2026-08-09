import { describe, it, expect } from 'vitest';
import { tokens } from '../tokens';

describe('design tokens', () => {
  it('define ambos temas (light y dark)', () => {
    expect(tokens.color.light).toBeDefined();
    expect(tokens.color.dark).toBeDefined();
  });

  it('el degradado de marca es un linear-gradient, no un color sólido', () => {
    expect(tokens.color.light.brandGradient).toMatch(/^linear-gradient/);
    expect(tokens.color.dark.brandGradient).toMatch(/^linear-gradient/);
  });

  it('los radios siguen la escala 4/12/20/28', () => {
    expect(tokens.shape.radiusSm).toBe(4);
    expect(tokens.shape.radiusMd).toBe(12);
    expect(tokens.shape.radiusLg).toBe(20);
    expect(tokens.shape.radiusXl).toBe(28);
  });

  it('la escala tipográfica tiene 8 pasos', () => {
    expect(Object.keys(tokens.typography.scale)).toHaveLength(8);
  });

  it('los pesos son solo 400/500/700', () => {
    const weights = Object.values(tokens.typography.weights).sort((a, b) => a - b);
    expect(weights).toEqual([400, 500, 700]);
  });

  it('cada color de bloque define bg y onBg con contraste (distintos)', () => {
    for (const theme of ['light', 'dark'] as const) {
      for (const [name, pair] of Object.entries(tokens.blockColor[theme])) {
        expect(pair.bg, `${theme}/${name} bg`).toBeDefined();
        expect(pair.onBg, `${theme}/${name} onBg`).toBeDefined();
        expect(pair.bg).not.toBe(pair.onBg);
      }
    }
  });
});
