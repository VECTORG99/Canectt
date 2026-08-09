import { describe, it, expect } from 'vitest';
import { toIcs } from '../ics.js';
import { toMarkdown } from '../markdown.js';
import { createEmptySchedule, createEmptyBlock } from '@canectt/schema';

function makeSchedule(timezone = 'America/Santiago') {
  const schedule = createEmptySchedule({ title: 'Test', timezone });
  const b1 = createEmptyBlock({ title: 'Mañana', startTime: '07:00', endTime: '08:00' });
  const b2 = createEmptyBlock({ title: 'Desayuno', startTime: '08:00', endTime: '08:30' });
  return { ...schedule, blocks: [b1, b2] };
}

describe('toIcs', () => {
  it('genera VCALENDAR con VEVENTs por cada bloque', () => {
    const schedule = makeSchedule();
    const ics = toIcs(schedule, { startDate: '2025-01-06' });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Mañana');
    expect(ics).toContain('SUMMARY:Desayuno');
    // Se emite en UTC con sufijo Z (no floating local).
    expect(ics).toMatch(/DTSTART:\d{8}T\d{6}Z/);
    expect(ics).toMatch(/DTEND:\d{8}T\d{6}Z/);
  });

  it('convierte la wall time de la zona IANA a UTC correctamente', () => {
    // America/Santiago en enero (verano austral) está en UTC-3.
    // 07:00 local → 10:00 UTC.
    const schedule = makeSchedule('America/Santiago');
    const ics = toIcs(schedule, { startDate: '2025-01-06' });
    expect(ics).toContain('DTSTART:20250106T100000Z');
    expect(ics).toContain('DTEND:20250106T110000Z');
  });

  it('respeta una zona sin offset UTC (UTC)', () => {
    const schedule = makeSchedule('UTC');
    const ics = toIcs(schedule, { startDate: '2025-01-06' });
    expect(ics).toContain('DTSTART:20250106T070000Z');
  });

  it('agrega RRULE cuando se especifica recurrencia', () => {
    const schedule = makeSchedule();
    const ics = toIcs(schedule, { recurrence: 'daily', count: 7, startDate: '2025-01-06' });
    expect(ics).toContain('RRULE:FREQ=DAILY;COUNT=7');
  });

  it('usa CRLF como separador de línea (RFC 5545)', () => {
    const schedule = makeSchedule();
    const ics = toIcs(schedule);
    expect(ics).toContain('\r\n');
    expect(ics.endsWith('\r\n')).toBe(true);
  });
});

describe('toMarkdown', () => {
  it('genera tabla GFM con cabecera y filas ordenadas', () => {
    const schedule = makeSchedule();
    const md = toMarkdown(schedule);
    expect(md).toContain('# Test');
    expect(md).toContain('| Hora | Actividad | Notas |');
    expect(md).toContain('07:00 - 08:00');
    expect(md).toContain('Mañana');
  });
});
