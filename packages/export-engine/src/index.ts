/**
 * Orquestador del export-engine: un único punto de entrada para todos
 * los formatos de archivo. El backend lo consume desde /api/export.
 */
import type { Schedule } from '@canectt/schema';
import { toIcs, type IcsOptions, type RecurrenceType } from './ics';
import { toMarkdown } from './markdown';
import { toPdf } from './pdf';
import { toDocx } from './docx';
import { toXlsx } from './xlsx';

export type ExportFormat = 'pdf' | 'docx' | 'xlsx' | 'md' | 'ics';

export interface ExportOptions {
  recurrence?: RecurrenceType;
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
        data: toPdf(schedule),
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
export { toIcs, type IcsOptions, type RecurrenceType } from './ics';
export { toMarkdown } from './markdown';
export { toPdf } from './pdf';
export { toDocx } from './docx';
export { toXlsx } from './xlsx';
