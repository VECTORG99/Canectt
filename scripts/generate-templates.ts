/**
 * Genera las plantillas binarias (.docx, .pdf, .xlsx) en examples/templates/
 * usando el export-engine de Canectt.
 *
 * Uso: pnpm tsx scripts/generate-templates.ts
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEmptySchedule, createEmptyBlock } from '@canectt/schema';
import { exportSchedule } from '@canectt/export-engine';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'examples', 'templates');

const schedule = createEmptySchedule({
  title: 'Rutina de gimnasio',
  timezone: 'America/Santiago',
  dayRange: { startTime: '07:00', endTime: '20:00' },
  blocks: [
    createEmptyBlock({ title: 'Rutina de mañana', startTime: '07:00', endTime: '08:00' }),
    createEmptyBlock({ title: 'Desayuno', startTime: '08:00', endTime: '08:30' }),
    createEmptyBlock({ title: 'Trabajo profundo', startTime: '09:00', endTime: '10:30' }),
    createEmptyBlock({ title: 'Almuerzo', startTime: '12:30', endTime: '13:30' }),
    createEmptyBlock({ title: 'Gimnasio', startTime: '18:00', endTime: '19:00' }),
  ],
});

async function main() {
  for (const format of ['docx', 'pdf', 'xlsx'] as const) {
    const result = await exportSchedule(schedule, format);
    const outPath = join(TEMPLATES_DIR, `rutina-gimnasio.${result.extension}`);
    writeFileSync(outPath, result.data);
    console.log(`Generado: ${outPath} (${result.mimeType})`);
  }
  console.log('Plantillas generadas correctamente.');
}

main().catch((err) => {
  console.error('Error generando plantillas:', err);
  process.exit(1);
});
