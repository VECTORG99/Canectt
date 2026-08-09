/**
 * Parser Excel (.xlsx): usa exceljs para leer hojas y celdas, construye
 * texto tabulado y delega al reconocedor compartido.
 */
import ExcelJS from 'exceljs';
import { recognizeBlocks, type RecognitionResult } from '../recognize.js';
import { normalizeToSchedule } from '../normalize.js';
import type { Schedule } from '@canectt/schema';

export interface ParseXlsxOptions {
  title?: string;
  timezone?: string;
}

/** Convierte un valor de celda de exceljs a string. */
function cellToString(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (Array.isArray(obj['richText'])) {
      return (obj['richText'] as { text: string }[]).map((r) => r.text).join('');
    }
    if ('result' in obj) {
      const r = obj['result'];
      if (r == null) return '';
      if (typeof r === 'string') return r;
      if (typeof r === 'number' || typeof r === 'boolean') return String(r);
      return '';
    }
    if ('text' in obj && typeof obj['text'] === 'string') {
      return obj['text'];
    }
  }
  return '';
}

/** Parsea un .xlsx (como Buffer) a un Schedule canónico. */
export async function parseXlsx(
  buffer: Uint8Array,
  options: ParseXlsxOptions = {},
): Promise<{ schedule: Schedule; recognition: RecognitionResult }> {
  const wb = new ExcelJS.Workbook();
  // exceljs espera un Buffer de Node; lo creamos desde el Uint8Array.
  const nodeBuf = Buffer.from(buffer) as unknown as ExcelJS.Buffer;
  await wb.xlsx.load(nodeBuf);

  const lines: string[] = [];
  wb.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      // row.values es 1-indexed con undefined en [0].
      const values = row.values as unknown[];
      const cells: string[] = [];
      for (let i = 1; i < values.length; i++) {
        cells.push(cellToString(values[i]).trim());
      }
      if (cells.some((c) => c !== '')) {
        // Usamos tabulador como separador (no 2 espacios) para preservar
        // celdas vacías: splitRow con \t mantiene las columnas vacías en
        // su posición, mientras que splitRow con 2+ espacios las colapsa.
        lines.push(cells.join('\t'));
      }
    });
  });

  const text = lines.join('\n');
  const recognition = recognizeBlocks(text);
  const schedule = normalizeToSchedule(recognition, {
    title: options.title,
    timezone: options.timezone,
  });
  return { schedule, recognition };
}
