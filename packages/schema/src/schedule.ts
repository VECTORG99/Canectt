/**
 * Esquema canónico de Canectt (data_model).
 * Fuente única de verdad compartida entre frontend y backend.
 *
 * Todo parser de importación y todo editor manual producen/consumen esta misma
 * forma. Cero duplicación de validación.
 */
import { z } from 'zod';

/** Formato de hora HH:mm (24h). */
export const TimeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida, formato esperado HH:mm');

/** Frecuencia de recurrencia, mapea 1:1 a una RRULE de iCalendar. */
export const RecurrenceFreqSchema = z.enum(['NONE', 'DAILY', 'WEEKDAYS', 'WEEKLY', 'CUSTOM']);

/** Días de la semana (estándar iCalendar: MO, TU, WE, TH, FR, SA, SU). */
export const WeekdaySchema = z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);

export const RecurrenceSchema = z.object({
  freq: RecurrenceFreqSchema,
  /** Días específicos para WEEKLY/CUSTOM. Vacío/undefined para NONE/DAILY/WEEKDAYS. */
  byDay: z.array(WeekdaySchema).optional(),
});

/** Ventana visible del día. */
export const DayRangeSchema = z.object({
  startTime: TimeStringSchema,
  endTime: TimeStringSchema,
});

/** Token de color de marca (referencia a packages/design-tokens), no un hex libre. */
export const BlockColorTokenSchema = z.enum([
  'block-blue',
  'block-purple',
  'block-coral',
  'block-green',
  'block-amber',
  'block-teal',
]);

/** UUID v4. */
export const UuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'UUID inválido');

/** Bloque del horario. */
export const BlockSchema = z
  .object({
    id: UuidSchema,
    title: z.string().min(1, 'El título del bloque es obligatorio'),
    startTime: TimeStringSchema,
    endTime: TimeStringSchema,
    colorToken: BlockColorTokenSchema,
    notes: z.string().nullable().default(null),
    /** ID de otro Block si este es un sub-evento anidado dentro de él. */
    parentId: UuidSchema.nullable().default(null),
    /** Calculado automáticamente por el sistema, nunca editable a mano. */
    overlapGroupId: z.string().nullable().default(null),
  })
  .superRefine((block, ctx) => {
    if (block.endTime <= block.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime debe ser mayor que startTime',
        path: ['endTime'],
      });
    }
    if (block.parentId !== null && block.parentId === block.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'parentId no puede ser igual al propio id',
        path: ['parentId'],
      });
    }
  });

/**
 * Sub-conjunto editable de un Block (sin id ni overlapGroupId, que son
 * gestionados por el sistema). Usado por el formulario de edición
 * (BlockEditPanel) con zodResolver, de modo que la validación no falle
 * por campos requeridos que no están en el formulario.
 *
 * Nota: `parentId` usa un preprocess que convierte '' (la opción "sin padre"
 * de un <select> HTML) a null, para que la validación no rechace el caso
 * válido de "bloque sin padre" cuando el formulario envía un string vacío.
 */
export const BlockEditSchema = z
  .object({
    title: z.string().min(1, 'El título del bloque es obligatorio'),
    startTime: TimeStringSchema,
    endTime: TimeStringSchema,
    colorToken: BlockColorTokenSchema,
    notes: z.string().nullable().default(null),
    parentId: z.preprocess(
      (v) => (v === '' || v === undefined ? null : v),
      UuidSchema.nullable().default(null),
    ),
  })
  .superRefine((block, ctx) => {
    if (block.endTime <= block.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime debe ser mayor que startTime',
        path: ['endTime'],
      });
    }
  });

/** Horario completo. */
export const ScheduleSchema = z
  .object({
    id: UuidSchema,
    title: z.string().min(1, 'El título del horario es obligatorio'),
    dayRange: DayRangeSchema,
    recurrence: RecurrenceSchema,
    /** Zona horaria IANA (ej. 'America/Santiago'). Imprescindible para exportación a calendario. */
    timezone: z.string().min(1, 'La zona horaria es obligatoria'),
    blocks: z.array(BlockSchema),
  })
  .superRefine((schedule, ctx) => {
    // Validar que dayRange.startTime < endTime
    if (schedule.dayRange.endTime <= schedule.dayRange.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dayRange.endTime debe ser mayor que dayRange.startTime',
        path: ['dayRange', 'endTime'],
      });
    }
    // Validar consistencia de parentId: debe existir y el rango del hijo debe caer dentro del padre.
    const byId = new Map(schedule.blocks.map((b) => [b.id, b]));
    for (const block of schedule.blocks) {
      if (block.parentId !== null) {
        const parent = byId.get(block.parentId);
        if (!parent) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `parentId ${block.parentId} no existe en el horario`,
            path: ['blocks'],
          });
          continue;
        }
        if (block.startTime < parent.startTime || block.endTime > parent.endTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `El bloque anidado "${block.title}" debe caer dentro del rango del padre "${parent.title}"`,
            path: ['blocks'],
          });
        }
      }
    }
  });

/**
 * Opciones de exportación a calendario (ICS y Google Calendar).
 * Valida los parámetros opcionales que el frontend envía al backend
 * junto con el schedule. Aplica en cada frontera de la API.
 *
 * `recurrence` aquí usa minúsculas ('none', 'daily', ...) para coincidir
 * con el tipo RecurrenceType del export-engine (que mapea a RRULE de ICS).
 * Es distinto de RecurrenceFreqSchema (mayúsculas) que es el campo
 * canónico del Schedule.
 */
export const CalendarExportRecurrenceSchema = z.enum([
  'none',
  'daily',
  'weekdays',
  'weekly',
  'custom',
]);

/**
 * Objeto base compartido entre ICS y Google Calendar push.
 * No incluye calendarId (solo relevante para Google push).
 */
const CalendarExportBaseObject = z.object({
  schedule: ScheduleSchema,
  recurrence: CalendarExportRecurrenceSchema.default('none'),
  byDay: z.array(WeekdaySchema).optional(),
  count: z.number().int().positive().max(365).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate debe tener formato YYYY-MM-DD')
    .optional(),
});

/**
 * Refinement: byDay solo tiene sentido con recurrence 'custom' o 'weekly'.
 */
function validateByDayAgainstRecurrence(
  data: { byDay?: string[]; recurrence: string },
  ctx: z.RefinementCtx,
): void {
  if (
    data.byDay &&
    data.byDay.length > 0 &&
    data.recurrence !== 'custom' &&
    data.recurrence !== 'weekly'
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `byDay solo es válido cuando recurrence es 'custom' o 'weekly', no '${data.recurrence}'`,
      path: ['byDay'],
    });
  }
}

/** Schema para exportación ICS (sin calendarId). */
export const IcsExportSchema = CalendarExportBaseObject.superRefine(validateByDayAgainstRecurrence);

/** Schema para Google Calendar push (con calendarId). */
export const GooglePushSchema = CalendarExportBaseObject.extend({
  calendarId: z.string().optional(),
}).superRefine(validateByDayAgainstRecurrence);

/** Tipos derivados. */
export type TimeString = z.infer<typeof TimeStringSchema>;
export type RecurrenceFreq = z.infer<typeof RecurrenceFreqSchema>;
export type Weekday = z.infer<typeof WeekdaySchema>;
export type Recurrence = z.infer<typeof RecurrenceSchema>;
export type DayRange = z.infer<typeof DayRangeSchema>;
export type BlockColorToken = z.infer<typeof BlockColorTokenSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type CalendarExportRecurrence = z.infer<typeof CalendarExportRecurrenceSchema>;
export type IcsExportOptions = z.infer<typeof IcsExportSchema>;
export type GooglePushOptions = z.infer<typeof GooglePushSchema>;
