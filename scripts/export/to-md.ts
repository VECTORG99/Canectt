#!/usr/bin/env tsx
/**
 * CLI: exporta un Schedule (JSON) a Markdown.
 * Uso: pnpm run export:md -- <horario.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { exportSchedule } from '@canectt/export-engine';
import type { Schedule } from '@canectt/schema';

const file = process.argv[2];
if (!file) {
  console.error('Uso: pnpm run export:md -- <horario.json>');
  process.exit(1);
}

const schedule = JSON.parse(readFileSync(file, 'utf8')) as Schedule;
const result = await exportSchedule(schedule, 'md');
const outPath = file.replace(/\.json$/, '.md');
writeFileSync(outPath, result.data);
console.log(`Markdown generado: ${outPath}`);
