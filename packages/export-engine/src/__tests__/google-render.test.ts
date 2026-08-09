import { describe, it, expect } from 'vitest';
import { buildGoogleCalendarRenderUrl, buildGoogleCalendarRenderUrls } from '../google-render.js';
import { createEmptySchedule, createEmptyBlock, type Weekday } from '@canectt/schema';

function makeSchedule(timezone = 'America/Santiago') {
  const schedule = createEmptySchedule({ title: 'Test', timezone });
  const b1 = createEmptyBlock({ title: 'Mañana', startTime: '07:00', endTime: '08:00' });
  const b2 = createEmptyBlock({
    title: 'Desayuno',
    startTime: '08:00',
    endTime: '08:30',
    notes: 'Café y tostadas',
  });
  return { ...schedule, blocks: [b1, b2] };
}

describe('buildGoogleCalendarRenderUrl', () => {
  it('genera una URL de Google Calendar render con los parámetros correctos', () => {
    const schedule = makeSchedule();
    const block = schedule.blocks[0]!;
    const url = buildGoogleCalendarRenderUrl(block, schedule, { startDate: '2025-01-06' });
    expect(url).toContain('https://calendar.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('text=Ma%C3%B1ana');
    expect(url).toContain('dates=20250106T070000/20250106T080000');
    expect(url).toContain('ctz=America%2FSantiago');
  });

  it('incluye las notas en el parámetro details', () => {
    const schedule = makeSchedule();
    const block = schedule.blocks[1]!;
    const url = buildGoogleCalendarRenderUrl(block, schedule, { startDate: '2025-01-06' });
    expect(url).toContain('details=Caf%C3%A9+y+tostadas');
  });

  it('usa el título "Bloque" si el bloque no tiene título', () => {
    const schedule = makeSchedule();
    const block = { ...schedule.blocks[0]!, title: '' };
    const url = buildGoogleCalendarRenderUrl(block, schedule, { startDate: '2025-01-06' });
    expect(url).toContain('text=Bloque');
  });

  it('incluye recur con RRULE cuando hay recurrencia daily', () => {
    const schedule = makeSchedule();
    const block = schedule.blocks[0]!;
    const url = buildGoogleCalendarRenderUrl(block, schedule, {
      startDate: '2025-01-06',
      recurrence: 'daily',
      count: 7,
    });
    expect(url).toContain('recur=RRULE%3AFREQ%3DDAILY%3BCOUNT%3D7');
  });

  it('incluye recur con RRULE WEEKLY+BYDAY para weekdays', () => {
    const schedule = makeSchedule();
    const block = schedule.blocks[0]!;
    const url = buildGoogleCalendarRenderUrl(block, schedule, {
      startDate: '2025-01-06',
      recurrence: 'weekdays',
      count: 30,
    });
    expect(url).toContain(
      'recur=RRULE%3AFREQ%3DWEEKLY%3BBYDAY%3DMO%2CTU%2CWE%2CTH%2CFR%3BCOUNT%3D30',
    );
  });

  it('incluye recur con BYDAY custom cuando se especifica byDay', () => {
    const schedule = makeSchedule();
    const block = schedule.blocks[0]!;
    const byDay: Weekday[] = ['MO', 'WE', 'FR'];
    const url = buildGoogleCalendarRenderUrl(block, schedule, {
      startDate: '2025-01-06',
      recurrence: 'custom',
      count: 10,
      byDay,
    });
    expect(url).toContain('recur=RRULE%3AFREQ%3DWEEKLY%3BBYDAY%3DMO%2CWE%2CFR%3BCOUNT%3D10');
  });

  it('no incluye recur cuando recurrence es none', () => {
    const schedule = makeSchedule();
    const block = schedule.blocks[0]!;
    const url = buildGoogleCalendarRenderUrl(block, schedule, {
      startDate: '2025-01-06',
      recurrence: 'none',
    });
    expect(url).not.toContain('recur=');
  });

  it('no incluye recur cuando recurrence es custom pero byDay está vacío', () => {
    const schedule = makeSchedule();
    const block = schedule.blocks[0]!;
    const url = buildGoogleCalendarRenderUrl(block, schedule, {
      startDate: '2025-01-06',
      recurrence: 'custom',
      byDay: [],
    });
    expect(url).not.toContain('recur=');
  });

  it('usa la fecha de hoy si no se especifica startDate', () => {
    const schedule = makeSchedule();
    const block = schedule.blocks[0]!;
    const url = buildGoogleCalendarRenderUrl(block, schedule);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    expect(url).toContain(`dates=${today}T070000/${today}T080000`);
  });

  it('respeta la timezone del schedule en el parámetro ctz', () => {
    const schedule = makeSchedule('Europe/Madrid');
    const block = schedule.blocks[0]!;
    const url = buildGoogleCalendarRenderUrl(block, schedule, { startDate: '2025-01-06' });
    expect(url).toContain('ctz=Europe%2FMadrid');
  });
});

describe('buildGoogleCalendarRenderUrls', () => {
  it('genera una URL por cada bloque del horario', () => {
    const schedule = makeSchedule();
    const urls = buildGoogleCalendarRenderUrls(schedule, { startDate: '2025-01-06' });
    expect(urls).toHaveLength(2);
    expect(urls[0]).toContain('text=Ma%C3%B1ana');
    expect(urls[1]).toContain('text=Desayuno');
  });

  it('devuelve array vacío para un horario sin bloques', () => {
    const schedule = createEmptySchedule({ title: 'Vacío' });
    const urls = buildGoogleCalendarRenderUrls(schedule, { startDate: '2025-01-06' });
    expect(urls).toHaveLength(0);
  });
});
