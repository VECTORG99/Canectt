#!/usr/bin/env tsx
/**
 * CLI: reconoce un .xlsx y devuelve el Schedule canónico (JSON).
 * Uso: pnpm run recognize:xlsx -- <archivo.xlsx>
 */
import { readFileSync } from 'node:fs';
import { parseXlsx } from '@canectt/recognition-engine';

const file = process.argv[2];
if (!file) {
  console.error('Uso: pnpm run recognize:xlsx -- <archivo.xlsx>');
  process.exit(1);
}

const data = new Uint8Array(readFileSync(file));
const result = await parseXlsx(data, { title: file });
console.log(JSON.stringify(result.schedule, null, 2));
