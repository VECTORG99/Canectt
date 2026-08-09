/**
 * Generador .ics (iCalendar RFC 5545).
 * Cada bloque del horario se convierte en un VEVENT con DTSTART/DTEND
 * y RRULE para recurrencia diaria/semanal/laborable.
 *
 * Los bloques anidados (parentId) se exportan como VEVENTs independientes
 * (el calendario no soporta "eventos dentro de eventos").
 * Los bloques solapados (overlapGroupId) se exportan como eventos separados
 * — el usuario ya decidió en el paso de revisión del ExportFlow.
 */
import type { Schedule, Block } from '@canectt/schema';

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly';

export interface IcsOptions {
  /** Tipo de recurrencia para todos los eventos. */
  recurrence?: RecurrenceType;
  /** Fecha de inicio (YYYY-MM-DD). Si no se especifica, usa hoy. */
  startDate?: string;
  /** Número de repeticiones para la recurrencia (COUNT). Default 30. */
  count?: number;
}

/** Escapa texto para iCalendar (comas, punto y coma, saltos de línea). */
function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Convierte "HH:mm" a "HHmmss" (formato iCalendar). */
function timeToIcs(time: string): string {
  return time.replace(':', '') + '00';
}

/** Convierte "YYYY-MM-DD" a "YYYYMMDD" (formato iCalendar). */
function dateToIcs(date: string): string {
  return date.replace(/-/g, '');
}

/** Genera la línea RRULE según el tipo de recurrencia. */
function rruleLine(recurrence: RecurrenceType, count: number): string | null {
  switch (recurrence) {
    case 'daily':
      return `RRULE:FREQ=DAILY;COUNT=${count}`;
    case 'weekdays':
      return `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=${count}`;
    case 'weekly':
      return `RRULE:FREQ=WEEKLY;COUNT=${count}`;
    default:
      return null;
  }
}

/** Genera un UID estable para un bloque (determinista). */
function eventUid(schedule: Schedule, block: Block): string {
  return `${schedule.id}-${block.id}@canectt`;
}

/** Genera el contenido .ics completo para un Schedule. */
export function toIcs(schedule: Schedule, options: IcsOptions = {}): string {
  const recurrence = options.recurrence ?? 'none';
  const count = options.count ?? 30;
  const startDate = options.startDate ?? new Date().toISOString().slice(0, 10);
  const dateIcs = dateToIcs(startDate);
  const rrule = rruleLine(recurrence, count);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Canectt//Horario//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const block of schedule.blocks) {
    const dtStart = `DTSTART;TZID=${schedule.timezone}:${dateIcs}T${timeToIcs(block.startTime)}`;
    const dtEnd = `DTEND;TZID=${schedule.timezone}:${dateIcs}T${timeToIcs(block.endTime)}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${eventUid(schedule, block)}`,
      `DTSTAMP:${dateIcs}T000000Z`,
      dtStart,
      dtEnd,
      `SUMMARY:${escapeIcs(block.title)}`,
    );
    if (block.notes) {
      lines.push(`DESCRIPTION:${escapeIcs(block.notes)}`);
    }
    if (rrule) {
      lines.push(rrule);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  // iCalendar requiere CRLF.
  return lines.join('\r\n') + '\r\n';
}
