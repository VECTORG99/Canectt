#!/usr/bin/env tsx
/**
 * Genera los fixtures binarios (PDF, DOCX, XLSX) usados por los tests
 * unitarios de los parsers. Se ejecuta con `pnpm run fixtures:generate`.
 *
 * Usa el propio export-engine para construir los archivos, lo que además
 * ejercita el ciclo exportar→re-importar (round-trip). Los fixtures se
 * commitean en /fixtures para que los tests sean reproducibles sin red.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { exportSchedule } from '@canectt/export-engine';
import { createEmptySchedule, createEmptyBlock, type Schedule } from '@canectt/schema';

const FIXTURES_DIR = join(process.cwd(), 'fixtures');
mkdirSync(FIXTURES_DIR, { recursive: true });

// Datos de ejemplo compartidos por todos los fixtures.
const ROWS: { start: string; end: string; activity: string; notes: string }[] = [
  { start: '07:00', end: '08:00', activity: 'Rutina de mañana', notes: 'Estiramiento + cardio' },
  { start: '08:00', end: '08:30', activity: 'Desayuno', notes: '' },
  { start: '09:00', end: '12:00', activity: 'Trabajo enfocado', notes: 'Sin notificaciones' },
  { start: '12:00', end: '13:00', activity: 'Almuerzo', notes: '' },
  { start: '13:00', end: '14:00', activity: 'Pausa activa', notes: 'Caminar 20 min' },
];

function buildSchedule(): Schedule {
  const base = createEmptySchedule({ title: 'Rutina gimnasio' });
  // IDs estables deterministas para que el fixture sea reproducible.
  const blocks = ROWS.map((r, i) => ({
    ...createEmptyBlock({
      title: r.activity,
      startTime: r.start,
      endTime: r.end,
      notes: r.notes || null,
    }),
    id: `fixture-block-${i + 1}`,
  }));
  return { ...base, id: 'fixture-schedule', blocks };
}

async function main() {
  const schedule = buildSchedule();

  for (const fmt of ['pdf', 'docx', 'xlsx'] as const) {
    const result = await exportSchedule(schedule, fmt);
    const ext = result.extension;
    writeFileSync(join(FIXTURES_DIR, `rutina-gimnasio.${ext}`), Buffer.from(result.data));
    console.log(`Generado: fixtures/rutina-gimnasio.${ext}`);
  }
  console.log('Fixtures listos en /fixtures');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
