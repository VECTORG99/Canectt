/**
 * Esquema Zod para config/schedule-defaults.json.
 * Única fuente de verdad para los valores configurables del producto
 * (rangos de horas, duración por defecto, tamaño máximo de archivo, etc.).
 */
import { z } from 'zod';

export const ScheduleDefaultsSchema = z.object({
  $schema: z.string().optional(),
  editor: z.object({
    defaultDayRange: z.object({
      startTime: z.string(),
      endTime: z.string(),
    }),
    fullDayRange: z.object({
      startTime: z.string(),
      endTime: z.string(),
    }),
    snapMinutes: z.array(z.number()),
    defaultSnapMinutes: z.number(),
    defaultBlockDurationMinutes: z.number(),
    minBlockDurationMinutes: z.number(),
    rowHeightPx: z.number(),
    mobileRowHeightPx: z.number(),
  }),
  upload: z.object({
    maxBytes: z.number(),
    timeoutMs: z.number(),
    acceptedExtensions: z.array(z.string()),
    scannedPdfThresholdCharsPerPage: z.number(),
  }),
  export: z.object({
    defaultTimezone: z.string(),
    defaultRecurrence: z.string(),
  }),
  blockColors: z.object({
    available: z.array(z.string()),
    default: z.string(),
  }),
});

export type ScheduleDefaults = z.infer<typeof ScheduleDefaultsSchema>;
