/**
 * Genera una URL pública de Google Calendar "render" para agregar un evento
 * suelto sin necesidad de OAuth.
 *
 * Formato de la URL:
 *   https://calendar.google.com/calendar/render?action=TEMPLATE
 *     &text=<titulo>
 *     &dates=<start>/<end>  (formato YYYYMMDDTHHMMSS)
 *     &ctz=<timezone IANA>
 *     &details=<notas>
 *     &recur=RRULE:...  (si hay recurrencia)
 *
 * Referencia (no oficial pero ampliamente documentada):
 *   https://github.com/InteractionDesignFoundation/add-event-to-calendar-button
 */
import type { Schedule, Block, Weekday } from '@canectt/schema';

/** Tipo de recurrencia para la URL render (mismo enum que ICS). */
export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom';

export interface RenderUrlOptions {
  /** Fecha de inicio en formato YYYY-MM-DD. Si no se especifica, usa hoy. */
  startDate?: string;
  /** Tipo de recurrencia. */
  recurrence?: RecurrenceType;
  /** Días específicos para recurrencia 'custom' o 'weekly'. */
  byDay?: Weekday[];
  /** Número de repeticiones (para RRULE). */
  count?: number;
}

/**
 * Convierte una fecha YYYY-MM-DD y una hora HH:mm a formato iCalendar
 * YYYYMMDDTHHMMSS (wall time, sin sufijo Z — Google interpreta la zona
 * via el parámetro ctz).
 */
function toIcalDateTime(dateStr: string, time: string): string {
  const [year, month, day] = dateStr.split('-');
  const [hour, minute] = time.split(':');
  return `${year}${month}${day}T${hour}${minute}00`;
}

/**
 * Genera una RRULE para la URL render de Google Calendar.
 * Sintaxis: RRULE:FREQ=DAILY;COUNT=7
 */
function buildRrule(
  recurrence: RecurrenceType,
  count: number,
  byDay?: Weekday[],
): string | undefined {
  switch (recurrence) {
    case 'daily':
      return `RRULE:FREQ=DAILY;COUNT=${count}`;
    case 'weekdays':
      return `RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=${count}`;
    case 'weekly':
      return `RRULE:FREQ=WEEKLY;COUNT=${count}`;
    case 'custom': {
      if (!byDay || byDay.length === 0) return undefined;
      return `RRULE:FREQ=WEEKLY;BYDAY=${byDay.join(',')};COUNT=${count}`;
    }
    default:
      return undefined;
  }
}

/**
 * Genera una URL pública de Google Calendar "render" para un bloque
 * individual del horario.
 *
 * El usuario puede hacer clic en la URL y Google Calendar abrirá una
 * página de "crear evento" con los datos pre-rellenados, sin necesidad
 * de OAuth ni conexión previa.
 */
export function buildGoogleCalendarRenderUrl(
  block: Block,
  schedule: Schedule,
  options: RenderUrlOptions = {},
): string {
  const startDate = options.startDate ?? new Date().toISOString().slice(0, 10);
  const recurrence = options.recurrence ?? 'none';
  const count = options.count ?? 30;

  const start = toIcalDateTime(startDate, block.startTime);
  const end = toIcalDateTime(startDate, block.endTime);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: block.title || 'Bloque',
    dates: `${start}/${end}`,
    ctz: schedule.timezone,
  });

  if (block.notes) {
    params.set('details', block.notes);
  }

  const rrule = buildRrule(recurrence, count, options.byDay);
  if (rrule) {
    params.set('recur', rrule);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera URLs públicas de Google Calendar "render" para todos los bloques
 * de un horario. Devuelve un array de URLs, una por bloque.
 */
export function buildGoogleCalendarRenderUrls(
  schedule: Schedule,
  options: RenderUrlOptions = {},
): string[] {
  return schedule.blocks.map((block) => buildGoogleCalendarRenderUrl(block, schedule, options));
}
