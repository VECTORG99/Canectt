/**
 * Genera tokens.css (variables CSS) y tokens.json (consumible por JS) a partir
 * de `tokens.ts`. Única fuente de verdad: `tokens.ts`.
 *
 * Ejecutar: `pnpm --filter @canectt/design-tokens build`
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokens, type DesignTokens, type ThemeName } from './tokens.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'dist');

function toKebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function emitColorVars(theme: ThemeName): string[] {
  const lines: string[] = [];
  const c = tokens.color[theme];
  for (const [key, value] of Object.entries(c)) {
    lines.push(`  --color-${toKebab(key)}: ${value};`);
  }
  // block colors
  const bc = tokens.blockColor[theme];
  for (const [token, pair] of Object.entries(bc)) {
    lines.push(`  --color-${token}-bg: ${pair.bg};`);
    lines.push(`  --color-${token}-on-bg: ${pair.onBg};`);
  }
  // elevation
  const e = tokens.elevation[theme];
  for (const [key, value] of Object.entries(e)) {
    lines.push(`  --elevation-${toKebab(key)}: ${value};`);
  }
  return lines;
}

function emitStaticVars(): string[] {
  const lines: string[] = [];
  // shape
  for (const [key, value] of Object.entries(tokens.shape)) {
    lines.push(`  --radius-${toKebab(key).replace('radius-', '')}: ${value}px;`);
  }
  // typography
  const t = tokens.typography;
  lines.push(`  --font-primary: ${t.primaryTypeface};`);
  lines.push(`  --font-ui: ${t.uiTypeface};`);
  lines.push(`  --font-mono: ${t.monoTypeface};`);
  lines.push(`  --font-fallback: ${t.fallbackStack};`);
  for (const [key, value] of Object.entries(t.scale)) {
    lines.push(`  --font-size-${key}: ${value}px;`);
  }
  for (const [key, value] of Object.entries(t.weights)) {
    lines.push(`  --font-weight-${toKebab(key)}: ${value};`);
  }
  // motion
  const m = tokens.motion;
  lines.push(`  --motion-duration-fast: ${m.durationFastMs}ms;`);
  lines.push(`  --motion-duration-normal: ${m.durationNormalMs}ms;`);
  lines.push(`  --motion-duration-slow: ${m.durationSlowMs}ms;`);
  lines.push(`  --motion-easing-standard: ${m.easingStandard};`);
  lines.push(`  --motion-easing-emphasized: ${m.easingEmphasized};`);
  return lines;
}

function buildCss(): string {
  const staticVars = emitStaticVars().join('\n');
  const lightVars = emitColorVars('light').join('\n');
  const darkVars = emitColorVars('dark').join('\n');
  return `/* AUTOGENERADO por packages/design-tokens/src/build.ts — NO editar a mano. */
:root {
${staticVars}
${lightVars}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${darkVars}
  }
}

[data-theme='dark'] {
${darkVars}
}

/* Soporte para prefers-reduced-motion: desactivar animaciones no esenciales. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;
}

function buildJson(): string {
  const serializable: DesignTokens = tokens;
  return JSON.stringify(serializable, null, 2);
}

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'tokens.css'), buildCss(), 'utf8');
  await writeFile(join(outDir, 'tokens.json'), buildJson(), 'utf8');
  // Re-exportar tokens TS para consumo programático.
  await writeFile(
    join(outDir, 'index.js'),
    `export { tokens } from '../src/tokens.ts';\nexport * from '../src/tokens.ts';\n`,
    'utf8',
  );
  await writeFile(
    join(outDir, 'index.d.ts'),
    `export { tokens, type DesignTokens, type ThemeName, type ColorTokens, type BlockColorTokens, type ShapeTokens, type ElevationTokens, type TypographyTokens, type MotionTokens } from '../src/tokens.ts';\n`,
    'utf8',
  );
  console.log('Tokens generados en', outDir);
}

await main();
