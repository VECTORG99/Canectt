#!/usr/bin/env tsx
/**
 * CLI unificado de Canectt.
 *
 * Uso:
 *   pnpm run cli -- recognize <archivo>          # reconoce y devuelve JSON
 *   pnpm run cli -- export <formato> <archivo>   # exporta un Schedule JSON
 *
 * Formatos: pdf, docx, xlsx, md, ics
 */
import { readFileSync, writeFileSync } from 'node:fs';
import {
  detectFormat,
  parsePdf,
  parseDocx,
  parseXlsx,
  parseMarkdown,
} from '@canectt/recognition-engine';
import { exportSchedule, toIcs, type RecurrenceType } from '@canectt/export-engine';
import type { Schedule } from '@canectt/schema';

const [command, ...rest] = process.argv.slice(2);

function usage() {
  console.log(`Canectt CLI

Uso:
  cli recognize <archivo>              Reconoce un documento y devuelve el Schedule JSON
  cli export <formato> <horario.json>  Exporta un Schedule JSON al formato indicado

Formatos soportados: pdf, docx, xlsx, md, ics
Opciones de export ics: --recurrence=daily|weekdays|weekly|none --start=YYYY-MM-DD --count=30
`);
}

async function recognize(file: string) {
  const data = new Uint8Array(readFileSync(file));
  const format = detectFormat(data, file);
  let result;
  switch (format) {
    case 'pdf':
      result = await parsePdf(data, { title: file });
      break;
    case 'docx':
      result = await parseDocx(data, { title: file });
      break;
    case 'xlsx':
      result = await parseXlsx(data, { title: file });
      break;
    case 'md':
      result = parseMarkdown(readFileSync(file, 'utf8'), { title: file });
      break;
    default:
      console.error(`Formato no soportado: ${format}`);
      process.exit(1);
  }
  console.log(JSON.stringify(result.schedule, null, 2));
}

async function exportCmd(format: string, file: string, flags: Record<string, string>) {
  const schedule = JSON.parse(readFileSync(file, 'utf8')) as Schedule;
  if (format === 'ics') {
    const ics = toIcs(schedule, {
      recurrence: (flags.recurrence as RecurrenceType) ?? 'none',
      startDate: flags.start,
      count: flags.count ? Number(flags.count) : undefined,
    });
    const outPath = file.replace(/\.json$/, '.ics');
    writeFileSync(outPath, ics);
    console.log(`ICS generado: ${outPath}`);
    return;
  }
  const result = await exportSchedule(schedule, format as 'pdf' | 'docx' | 'xlsx' | 'md');
  const outPath = file.replace(/\.json$/, `.${result.extension}`);
  writeFileSync(outPath, result.data);
  console.log(`${format.toUpperCase()} generado: ${outPath}`);
}

if (!command) {
  usage();
  process.exit(1);
}

const flags = rest.reduce<Record<string, string>>((acc, arg) => {
  const m = arg.match(/^--(\w+)=(.+)$/);
  if (m) acc[m[1]!] = m[2]!;
  return acc;
}, {});
const positional = rest.filter((a) => !a.startsWith('--'));

switch (command) {
  case 'recognize':
    if (!positional[0]) {
      console.error('Falta el archivo.');
      usage();
      process.exit(1);
    }
    await recognize(positional[0]);
    break;
  case 'export':
    if (!positional[0] || !positional[1]) {
      console.error('Falta formato o archivo.');
      usage();
      process.exit(1);
    }
    await exportCmd(positional[0], positional[1], flags);
    break;
  default:
    console.error(`Comando desconocido: ${command}`);
    usage();
    process.exit(1);
}
