import { test, expect, type Page } from '@playwright/test';

/**
 * E2E de los 3 flujos críticos de Canectt.
 *
 * 1. importar → editar → exportar archivo
 * 2. importar → editar → exportar al calendario (.ics; el flujo OAuth de
 *    Google no se puede e2e sin credenciales reales, así que cubrimos la
 *    exportación .ics que es la vía calendario sin OAuth)
 * 3. crear manualmente → exportar
 *
 * Los endpoints del backend se mockean con page.route para que los tests
 * corran sin levantar la API y sean deterministas.
 */

const MOCK_SCHEDULE = {
  id: 'e2e-schedule',
  title: 'Rutina e2e',
  timezone: 'America/Santiago',
  dayRange: { startTime: '06:00', endTime: '23:00' },
  blocks: [
    {
      id: 'b1',
      title: 'Mañana',
      startTime: '07:00',
      endTime: '08:00',
      colorToken: 'block-blue',
      parentId: null,
      overlapGroupId: null,
      notes: null,
    },
    {
      id: 'b2',
      title: 'Desayuno',
      startTime: '08:00',
      endTime: '08:30',
      colorToken: 'block-green',
      parentId: null,
      overlapGroupId: null,
      notes: null,
    },
  ],
  recurrence: { freq: 'NONE' },
};

/** Mockea /api/recognize y los endpoints de exportación. */
async function mockApi(page: Page) {
  await page.route('**/api/recognize', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        schedule: MOCK_SCHEDULE,
        format: 'markdown',
        warning: null,
        confidence: 1,
        scanned: false,
      }),
    });
  });
  await page.route('**/api/export/**', async (route) => {
    // Devolvemos un binario pequeño; al frontend solo le importa recibir el blob.
    await route.fulfill({
      status: 200,
      contentType: route.request().url().includes('ics')
        ? 'text/calendar'
        : 'application/octet-stream',
      body: 'contenido-mock',
    });
  });
}

test.describe('Flujo 1: importar → editar → exportar archivo', () => {
  test('sube un archivo, edita el título y exporta a PDF', async ({ page }) => {
    await mockApi(page);
    await page.goto('/crear');

    // Subir un archivo .md a través del input oculto.
    const fileInput = page.getByLabel(/adelante/i).first();
    await fileInput.setInputFiles({
      name: 'rutina.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('07:00 - 08:00 Mañana\n08:00 - 08:30 Desayuno'),
    });

    // Debe llegar al editor con el horario reconocido.
    await expect(page).toHaveURL(/\/horario\//);
    await expect(page.getByRole('textbox', { name: /editor de horario/i })).toHaveValue(
      'Rutina e2e',
    );

    // Editar el título.
    const titleInput = page.getByRole('textbox', { name: /editor de horario/i });
    await titleInput.fill('Rutina editada');

    // Exportar a PDF (descarga).
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /^pdf$/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});

test.describe('Flujo 2: importar → editar → exportar al calendario (.ics)', () => {
  test('sube un archivo y descarga un .ics', async ({ page }) => {
    await mockApi(page);
    await page.goto('/crear');

    const fileInput = page.getByLabel(/adelante/i).first();
    await fileInput.setInputFiles({
      name: 'rutina.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('07:00 - 08:00 Mañana'),
    });

    await expect(page).toHaveURL(/\/horario\//);

    // El botón de descarga .ics está en la sección de calendario.
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /descargar archivo \.ics/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.ics$/);
  });

  test('muestra el botón de conectar con Google Calendar', async ({ page }) => {
    await mockApi(page);
    await page.goto('/crear');
    const fileInput = page.getByLabel(/adelante/i).first();
    await fileInput.setInputFiles({
      name: 'rutina.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('07:00 - 08:00 Mañana'),
    });
    await expect(page).toHaveURL(/\/horario\//);
    await expect(page.getByRole('button', { name: /conectar con google calendar/i })).toBeVisible();
  });
});

test.describe('Flujo 3: crear manualmente → exportar', () => {
  test('crea un horario vacío, agrega un bloque y exporta a Markdown', async ({ page }) => {
    await mockApi(page);
    await page.goto('/crear');

    // Click en "Manual" → "Adelante" dentro de la sección manual.
    const manualSection = page
      .getByRole('region', { name: /manual/i })
      .or(page.locator('section').filter({ hasText: 'Manual' }));
    await manualSection.getByRole('button', { name: /adelante/i }).click();

    await expect(page).toHaveURL(/\/horario\//);

    // Agregar un bloque.
    await page.getByRole('button', { name: /agregar bloque/i }).click();

    // Exportar a Markdown (descarga).
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /markdown/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.md$/);
  });
});
