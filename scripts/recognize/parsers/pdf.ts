#!/usr/bin/env tsx
/**
 * CLI: reconoce un PDF y devuelve el Schedule canónico (JSON).
 * Uso: pnpm run recognize:pdf -- <archivo.pdf>
 */
import { readFileSync } from 'node:fs';
import { parsePdf } from '@canectt/recognition-engine';

const file = process.argv[2];
if (!file) {
  console.error('Uso: pnpm run recognize:pdf -- <archivo.pdf>');
  process.exit(1);
}

const data = new Uint8Array(readFileSync(file));
const result = await parsePdf(data, { title: file });
console.log(JSON.stringify(result.schedule, null, 2));
