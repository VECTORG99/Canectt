#!/usr/bin/env tsx
/**
 * CLI: exporta un Schedule (JSON) a .xlsx.
 * Uso: pnpm run export:xlsx -- <horario.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { exportSchedule } from '@canectt/export-engine';
import type { Schedule } from '@canectt/schema';

const file = process.argv[2];
if (!file) {
  console.error('Uso: pnpm run export:xlsx -- <horario.json>');
  process.exit(1);
}

const schedule = JSON.parse(readFileSync(file, 'utf8')) as Schedule;
const result = await exportSchedule(schedule, 'xlsx');
const outPath = file.replace(/\.json$/, '.xlsx');
writeFileSync(outPath, result.data);
console.log(`XLSX generado: ${outPath}`);
