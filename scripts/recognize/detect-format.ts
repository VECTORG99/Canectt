#!/usr/bin/env tsx
/**
 * CLI: detecta el formato real de un archivo por su firma binaria (magic bytes).
 * Uso: pnpm run recognize:detect -- <archivo>
 */
import { readFileSync } from 'node:fs';
import { detectFormat } from '@canectt/recognition-engine';

const file = process.argv[2];
if (!file) {
  console.error('Uso: pnpm run recognize:detect -- <archivo>');
  process.exit(1);
}

const data = new Uint8Array(readFileSync(file));
const format = detectFormat(data, file);
console.log(format);
