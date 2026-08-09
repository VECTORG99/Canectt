#!/usr/bin/env tsx
/**
 * CLI: reconoce un .docx y devuelve el Schedule canónico (JSON).
 * Uso: pnpm run recognize:docx -- <archivo.docx>
 */
import { readFileSync } from 'node:fs';
import { parseDocx } from '@canectt/recognition-engine';

const file = process.argv[2];
if (!file) {
  console.error('Uso: pnpm run recognize:docx -- <archivo.docx>');
  process.exit(1);
}

const data = new Uint8Array(readFileSync(file));
const result = await parseDocx(data, { title: file });
console.log(JSON.stringify(result.schedule, null, 2));
