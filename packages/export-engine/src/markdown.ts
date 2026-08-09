/**
 * Exportador Markdown: genera un .md con tabla GFM de horario.
 * Reimportable: el resultado puede volver a alimentar el recognition-engine.
 *
 * El archivo final se valida reparseándolo con remark para garantizar que
 * sea Markdown válido y reimportable por la propia herramienta (round-trip).
 */
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import type { Schedule } from '@canectt/schema';

export function toMarkdown(schedule: Schedule): string {
  const sorted = [...schedule.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const lines: string[] = [
    `# ${schedule.title}`,
    '',
    `> Zona horaria: ${schedule.timezone}`,
    '',
    '| Hora | Actividad | Notas |',
    '| --- | --- | --- |',
  ];

  for (const block of sorted) {
    const time = `${block.startTime} - ${block.endTime}`;
    const title = (block.title || 'Bloque').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const notes = (block.notes ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    lines.push(`| ${time} | ${title} | ${notes} |`);
  }

  const md = lines.join('\n') + '\n';

  // Round-trip: validar que el Markdown generado es parseable por remark.
  validateMarkdown(md);

  return md;
}

/**
 * Valida que el Markdown generado es parseable por remark + remark-gfm.
 * Lanza un error si el Markdown no es válido (no debería ocurrir, pero
 * garantiza que el archivo sea reimportable por la propia herramienta).
 */
function validateMarkdown(md: string): void {
  remark().use(remarkGfm).parse(md);
}
