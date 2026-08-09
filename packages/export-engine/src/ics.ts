/**
 * Generador .ics (iCalendar RFC 5545) usando la librería 'ics'.
 * Cada bloque del horario se convierte en un VEVENT con DTSTART/DTEND
 * y RRULE para recurrencia diaria/semanal/laborable.
 *
 * Los bloques anidados (parentId) se exportan como VEVENTs independientes
 * (el calendario no soporta "eventos dentro de eventos").
 * Los bloques solapados (overlapGroupId) se exportan como eventos separados
 * — el usuario ya decidió en el paso de revisión del ExportFlow.
 *
 * Timezone: las horas del Schedule son "wall time" en schedule.timezone
 * (IANA). Se convierten a un instante UTC absoluto y se emiten como
 * DTSTART:YYYYMMDDTHHMMSSZ, de modo que cualquier cliente de calendario
 * (Apple/Outlook/Google) las sitúe en el instante correcto sin depender
 * del huso horario del dispositivo que importa el archivo. Esto evita
 * el bug clásico de "la rutina de 7am aparece a las 4am" al importar
 * desde otro huso horario.
 */
import { createEvents, type EventAttributes, type DateArray } from 'ics';
import type { Schedule, Block } from '@canectt/schema';

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom';

export interface IcsOptions {
  /** Tipo de recurrencia para todos los eventos. */
  recurrence?: RecurrenceType;
  /** Días específicos para recurrencia 'custom' (estándar iCalendar: MO,TU,...). */
  byDay?: string[];
  /** Fecha de inicio (YYYY-MM-DD). Si no se especifica, usa hoy. */
  startDate?: string;
  /** Número de repeticiones para la recurrencia (COUNT). Default 30. */
  count?: number;
}

/** Genera la RRULE según el tipo de recurrencia. */
function rrule(recurrence: RecurrenceType, count: number, byDay?: string[]): string | undefined {
  switch (recurrence) {
    case 'daily':
      return `FREQ=DAILY;COUNT=${count}`;
    case 'weekdays':
      return `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=${count}`;
    case 'weekly':
      return `FREQ=WEEKLY;COUNT=${count}`;
    case 'custom': {
      if (!byDay || byDay.length === 0) return undefined;
      return `FREQ=WEEKLY;BYDAY=${byDay.join(',')};COUNT=${count}`;
    }
    default:
      return undefined;
  }
}

/**
 * Convierte una fecha+hora "wall time" en una zona IANA dada a un instante
 * UTC, devolviendo sus componentes UTC [año, mes, día, hora, minuto].
 *
 * Usa la Intl API (disponible en Node 20+ y navegadores) para obtener el
 * offset real en la zona objetivo, sin dependencias adicionales. Maneja
 * DST correctamente porque consulta el offset en el instante cercano al
 * objetivo.
 */
function zonedWallTimeToUtcArray(date: string, time: string, timeZone: string): DateArray {
  const dateParts = date.split('-').map(Number);
  const timeParts = time.split(':').map(Number);
  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];
  const hour = timeParts[0];
  const minute = timeParts[1];
  // Validación defensiva: las entradas vienen de strings 'YYYY-MM-DD' y 'HH:mm'
  // validados por Zod, pero noUncheckedIndexedAccess exige afirmar la presencia.
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    throw new Error(`Fecha u hora inválida en zonedWallTimeToUtcArray: ${date} ${time}`);
  }

  // 1. Construir un instante "candidato" tratando la wall time como UTC.
  //    Date.UTC evita interpretar los argumentos en el huso local del host.
  const candidate = Date.UTC(year, month - 1, day, hour, minute, 0);

  // 2. Obtener las partes de wall-clock que el candidato produce en la
  //    zona objetivo. Esto nos da el offset real (incluido DST) en ese
  //    instante.
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(new Date(candidate));
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const zonedHour = get('hour') === 24 ? 0 : get('hour'); // hour12:false puede dar 24 en algunos runtimes
  const zonedMinute = get('minute');

  // 3. Diferencia en minutos entre la wall time del candidato (en la zona)
  //    y la wall time deseada. Aplicamos esa corrección al candidato.
  const candidateWallMinutes = zonedHour * 60 + zonedMinute;
  const desiredWallMinutes = hour * 60 + minute;
  let deltaMinutes = desiredWallMinutes - candidateWallMinutes;
  // Asumir que la diferencia es < 24h; normalizar al rango [-12h, 12h].
  if (deltaMinutes > 720) deltaMinutes -= 1440;
  if (deltaMinutes < -720) deltaMinutes += 1440;

  const corrected = new Date(candidate + deltaMinutes * 60_000);

  // 4. Devolver componentes UTC del instante corregido.
  return [
    corrected.getUTCFullYear(),
    corrected.getUTCMonth() + 1,
    corrected.getUTCDate(),
    corrected.getUTCHours(),
    corrected.getUTCMinutes(),
  ];
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
  const rule = rrule(recurrence, count, options.byDay);
  const tz = schedule.timezone;

  const events: EventAttributes[] = schedule.blocks.map((block) => {
    const event: EventAttributes = {
      // Interpretamos los componentes como UTC y los emitimos con sufijo Z.
      start: zonedWallTimeToUtcArray(startDate, block.startTime, tz),
      startInputType: 'utc',
      startOutputType: 'utc',
      end: zonedWallTimeToUtcArray(startDate, block.endTime, tz),
      endInputType: 'utc',
      endOutputType: 'utc',
      title: block.title || 'Bloque',
      uid: eventUid(schedule, block),
      productId: 'Canectt//Horario//ES',
    };
    if (block.notes) {
      event.description = block.notes;
    }
    if (rule) {
      event.recurrenceRule = rule;
    }
    return event;
  });

  const result = createEvents(events, {
    productId: 'Canectt//Horario//ES',
    calName: schedule.title,
  });
  if (result.error || !result.value) {
    throw new Error(`Error al generar .ics: ${result.error?.message ?? 'desconocido'}`);
  }
  return result.value;
}
