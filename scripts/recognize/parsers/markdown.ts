#!/usr/bin/env tsx
/**
 * CLI: reconoce un .md y devuelve el Schedule canónico (JSON).
 * Uso: pnpm run recognize:md -- <archivo.md>
 */
import { readFileSync } from 'node:fs';
import { parseMarkdown } from '@canectt/recognition-engine';

const file = process.argv[2];
if (!file) {
  console.error('Uso: pnpm run recognize:md -- <archivo.md>');
  process.exit(1);
}

const content = readFileSync(file, 'utf8');
const result = parseMarkdown(content, { title: file });
console.log(JSON.stringify(result.schedule, null, 2));
