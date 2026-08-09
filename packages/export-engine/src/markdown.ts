/**
 * Exportador Markdown: genera un .md con tabla GFM de horario.
 * Reimportable: el resultado puede volver a alimentar el recognition-engine.
 */
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
    const title = block.title || 'Bloque';
    const notes = (block.notes ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    lines.push(`| ${time} | ${title} | ${notes} |`);
  }

  return lines.join('\n') + '\n';
}
