#!/usr/bin/env tsx
/**
 * CLI: exporta un Schedule (JSON) a PDF.
 * Uso: pnpm run export:pdf -- <horario.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { exportSchedule } from '@canectt/export-engine';
import type { Schedule } from '@canectt/schema';

const file = process.argv[2];
if (!file) {
  console.error('Uso: pnpm run export:pdf -- <horario.json>');
  process.exit(1);
}

const schedule = JSON.parse(readFileSync(file, 'utf8')) as Schedule;
const result = await exportSchedule(schedule, 'pdf');
const outPath = file.replace(/\.json$/, '.pdf');
writeFileSync(outPath, result.data);
console.log(`PDF generado: ${outPath}`);
