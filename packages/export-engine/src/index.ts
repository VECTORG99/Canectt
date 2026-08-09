/**
 * Orquestador del export-engine: un único punto de entrada para todos
 * los formatos de archivo. El backend lo consume desde /api/export.
 */
import type { Schedule } from '@canectt/schema';
import { toIcs, type IcsOptions, type RecurrenceType } from './ics.js';
import { toMarkdown } from './markdown.js';
import { toPdf } from './pdf.js';
import { toDocx } from './docx.js';
import { toXlsx } from './xlsx.js';

export type ExportFormat = 'pdf' | 'docx' | 'xlsx' | 'md' | 'ics';

export interface ExportOptions {
  recurrence?: RecurrenceType;
  /** Días específicos para recurrencia 'custom'. */
  byDay?: string[];
  startDate?: string;
  count?: number;
}

export interface ExportResult {
  /** Contenido binario (para pdf/docx/xlsx) o texto (para md/ics). */
  data: Uint8Array;
  /** MIME type para la respuesta HTTP. */
  mimeType: string;
  /** Extensión del archivo. */
  extension: string;
}

/** Exporta un Schedule al formato solicitado. */
export async function exportSchedule(
  schedule: Schedule,
  format: ExportFormat,
  options: ExportOptions = {},
): Promise<ExportResult> {
  switch (format) {
    case 'pdf': {
      return {
        data: await toPdf(schedule),
        mimeType: 'application/pdf',
        extension: 'pdf',
      };
    }
    case 'docx': {
      return {
        data: await toDocx(schedule),
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'docx',
      };
    }
    case 'xlsx': {
      return {
        data: await toXlsx(schedule),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
      };
    }
    case 'md': {
      return {
        data: new TextEncoder().encode(toMarkdown(schedule)),
        mimeType: 'text/markdown',
        extension: 'md',
      };
    }
    case 'ics': {
      const icsOptions: IcsOptions = {
        recurrence: options.recurrence,
        byDay: options.byDay,
        startDate: options.startDate,
        count: options.count,
      };
      return {
        data: new TextEncoder().encode(toIcs(schedule, icsOptions)),
        mimeType: 'text/calendar',
        extension: 'ics',
      };
    }
    default: {
      const exhaustive: never = format;
      throw new Error(`Formato de exportación no soportado: ${String(exhaustive)}`);
    }
  }
}

// Re-exports.
export { toIcs, type IcsOptions, type RecurrenceType } from './ics.js';
export { toMarkdown } from './markdown.js';
export { toPdf } from './pdf.js';
export { toDocx } from './docx.js';
export { toXlsx } from './xlsx.js';
export {
  buildGoogleCalendarRenderUrl,
  buildGoogleCalendarRenderUrls,
  type RenderUrlOptions,
} from './google-render.js';
