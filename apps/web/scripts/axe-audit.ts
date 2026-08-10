/**
 * Auditoría de accesibilidad con axe-core sobre el build de producción.
 *
 * Sirve `dist/` con un servidor estático mínimo, lanza Chromium via
 * Playwright y ejecuta AxeBuilder sobre las rutas principales.
 * Falla (exit 1) si hay violaciones critical o serious.
 *
 * Uso: pnpm --filter @canectt/web run a11y
 * Requiere: `pnpm build:web` ejecutado previamente (dist/ debe existir).
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PORT = 4180;
const DIST_DIR = join(import.meta.dirname, '..', 'dist');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

async function fileExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/** Servidor estático con fallback a index.html para SPA routing. */
function startStaticServer(): Promise<ReturnType<typeof createServer>> {
  return new Promise((resolve) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      handleRequest(req, res).catch((err) => {
        res.writeHead(500).end(`Internal error: ${err}`);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const urlPath = decodeURIComponent(req.url?.split('?')[0] ?? '/');
  // Prevenir path traversal fuera de dist/.
  const safePath = normalize(join(DIST_DIR, urlPath));
  if (!safePath.startsWith(DIST_DIR)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  let filePath = safePath;
  if (urlPath.endsWith('/')) {
    filePath = join(safePath, 'index.html');
  } else if (!extname(safePath)) {
    // Sin extensión: probar archivo exacto, luego index.html (SPA fallback).
    if (!(await fileExists(safePath))) {
      filePath = join(DIST_DIR, 'index.html');
    }
  }

  try {
    const content = await readFile(filePath);
    const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  } catch {
    res.writeHead(404).end('Not found');
  }
}

interface RouteResult {
  route: string;
  violations: number;
  details: string[];
}

const ROUTES = ['/', '/crear'];

async function auditRoute(page: Page, route: string): Promise<RouteResult> {
  await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' });

  // Esperar a que el ThemeProvider inicialice (data-theme en <html>).
  await page.waitForSelector('html[data-theme]', { timeout: 5000 });
  await page.evaluate(() => document.fonts.ready);

  // Esperar a que terminen las animaciones de Framer Motion (opacity 0→1).
  await page.waitForFunction(
    () => {
      const sections = document.querySelectorAll('section');
      if (sections.length === 0) return true;
      return Array.from(sections).every((s) => window.getComputedStyle(s).opacity === '1');
    },
    { timeout: 5000 },
  );

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  const critical = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );

  const details = critical.map((v) => `  [${v.impact}] ${v.id}: ${v.description}`);
  return { route, violations: critical.length, details };
}

async function main(): Promise<void> {
  // Verificar que dist/ existe.
  if (!(await fileExists(join(DIST_DIR, 'index.html')))) {
    console.error('dist/index.html no encontrado. Ejecuta `pnpm build:web` antes de la auditoría.');
    process.exit(1);
  }

  const server = await startStaticServer();
  const browser = await chromium.launch();
  const context = await browser.newContext();

  let totalViolations = 0;
  const allResults: RouteResult[] = [];

  try {
    for (const route of ROUTES) {
      const page = await context.newPage();
      try {
        const result = await auditRoute(page, route);
        allResults.push(result);
        totalViolations += result.violations;
      } finally {
        await page.close();
      }
    }
  } finally {
    await context.close();
    await browser.close();
    server.close();
  }

  // Reportar resultados.
  console.info('\n=== Auditoría de accesibilidad (axe-core) ===\n');
  for (const result of allResults) {
    const status = result.violations === 0 ? '✓' : '✗';
    console.info(`${status} ${result.route}: ${result.violations} violación(es) critical/serious`);
    for (const detail of result.details) {
      console.info(detail);
    }
  }

  if (totalViolations > 0) {
    console.error(`\n❌ ${totalViolations} violación(es) de accesibilidad encontrada(s).`);
    process.exit(1);
  }
  console.info('\n✅ Sin violaciones critical/serious de accesibilidad.');
}

main().catch((err) => {
  console.error('Error durante la auditoría a11y:', err);
  process.exit(1);
});
