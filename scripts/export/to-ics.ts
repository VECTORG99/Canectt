#!/usr/bin/env tsx
/**
 * CLI: exporta un Schedule (JSON) a .ics (iCalendar).
 * Uso: pnpm run export:ics -- <horario.json> [--recurrence=daily|weekdays|weekly|none] [--start=YYYY-MM-DD] [--count=30]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { toIcs, type RecurrenceType } from '@canectt/export-engine';
import type { Schedule } from '@canectt/schema';

const file = process.argv[2];
if (!file) {
  console.error(
    'Uso: pnpm run export:ics -- <horario.json> [--recurrence=daily] [--start=2024-01-01] [--count=30]',
  );
  process.exit(1);
}

const flags = process.argv.slice(3).reduce<Record<string, string>>((acc, arg) => {
  const m = arg.match(/^--(\w+)=(.+)$/);
  if (m) acc[m[1]!] = m[2]!;
  return acc;
}, {});

const schedule = JSON.parse(readFileSync(file, 'utf8')) as Schedule;
const ics = toIcs(schedule, {
  recurrence: (flags.recurrence as RecurrenceType) ?? 'none',
  startDate: flags.start,
  count: flags.count ? Number(flags.count) : undefined,
});
const outPath = file.replace(/\.json$/, '.ics');
writeFileSync(outPath, ics);
console.log(`ICS generado: ${outPath}`);
