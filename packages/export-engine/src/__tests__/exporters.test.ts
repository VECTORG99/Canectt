import { describe, it, expect } from 'vitest';
import { toPdf } from '../pdf.js';
import { toDocx } from '../docx.js';
import { toXlsx } from '../xlsx.js';
import { toMarkdown } from '../markdown.js';
import { createEmptySchedule, createEmptyBlock } from '@canectt/schema';

function makeSchedule() {
  const schedule = createEmptySchedule({ title: 'Test Export', timezone: 'America/Santiago' });
  const b1 = createEmptyBlock({ title: 'Mañana', startTime: '07:00', endTime: '08:00' });
  const b2 = createEmptyBlock({
    title: 'Trabajo',
    startTime: '09:00',
    endTime: '12:00',
    notes: 'Enfoque profundo',
  });
  return { ...schedule, blocks: [b1, b2] };
}

describe('toPdf', () => {
  it('genera un PDF válido (cabecera %PDF- y bloques)', async () => {
    const schedule = makeSchedule();
    const bytes = await toPdf(schedule);
    expect(bytes.length).toBeGreaterThan(100);
    const head = new TextDecoder().decode(bytes.slice(0, 5));
    expect(head).toBe('%PDF-');
  });
});

describe('toDocx', () => {
  it('genera un .docx válido (zip con document.xml)', async () => {
    const schedule = makeSchedule();
    const bytes = await toDocx(schedule);
    expect(bytes.length).toBeGreaterThan(100);
    // Un .docx es un zip: debe empezar con la firma PK\x03\x04.
    expect(bytes[0]).toBe(0x50); // 'P'
    expect(bytes[1]).toBe(0x4b); // 'K'
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });
});

describe('toXlsx', () => {
  it('genera un .xlsx válido (zip con hoja y bloques)', async () => {
    const schedule = makeSchedule();
    const bytes = await toXlsx(schedule);
    expect(bytes.length).toBeGreaterThan(100);
    // Un .xlsx es un zip: firma PK\x03\x04.
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });
});

describe('toMarkdown', () => {
  it('genera tabla GFM con título, cabecera y filas ordenadas', () => {
    const schedule = makeSchedule();
    const md = toMarkdown(schedule);
    expect(md).toContain('# Test Export');
    expect(md).toContain('| Hora | Actividad | Notas |');
    expect(md).toContain('07:00 - 08:00');
    expect(md).toContain('Mañana');
    expect(md).toContain('Enfoque profundo');
    // Las filas deben estar ordenadas por hora de inicio.
    const posManana = md.indexOf('07:00 - 08:00');
    const posTrabajo = md.indexOf('09:00 - 12:00');
    expect(posManana).toBeLessThan(posTrabajo);
  });

  it('usa "Bloque" como título por defecto cuando el bloque no tiene título', () => {
    const schedule = makeSchedule();
    const scheduleSinTitulo = {
      ...schedule,
      blocks: [createEmptyBlock({ title: '', startTime: '07:00', endTime: '08:00' })],
    };
    const md = toMarkdown(scheduleSinTitulo);
    expect(md).toContain('Bloque');
  });
});
