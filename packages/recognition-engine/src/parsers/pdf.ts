/**
 * Parser PDF: usa unpdf (envoltorio sobre pdf.js de Mozilla) para extraer texto.
 * Si la extracción devuelve <50 chars/página, asume PDF escaneado y devuelve
 * un aviso invitando al flujo manual (no falla en silencio).
 */
import { getDocumentProxy } from 'unpdf';
import { recognizeBlocks, type RecognitionResult } from '../recognize';
import { normalizeToSchedule } from '../normalize';
import type { Schedule } from '@canectt/schema';

const SCANNED_THRESHOLD_CHARS_PER_PAGE = 50;

export interface ParsePdfOptions {
  title?: string;
  timezone?: string;
  scannedThreshold?: number;
}

export interface ParsePdfResult {
  schedule: Schedule;
  recognition: RecognitionResult;
  /** True si se detectó que el PDF probablemente está escaneado. */
  scanned: boolean;
}

/** Parsea un PDF (como ArrayBuffer/Buffer/Uint8Array) a un Schedule canónico. */
export async function parsePdf(
  data: ArrayBuffer | Uint8Array,
  options: ParsePdfOptions = {},
): Promise<ParsePdfResult> {
  const buffer = data instanceof Uint8Array ? data : new Uint8Array(data);
  const pdf = await getDocumentProxy(buffer);
  const threshold = options.scannedThreshold ?? SCANNED_THRESHOLD_CHARS_PER_PAGE;

  // Iterar por página para medir chars/página (detección de escaneado).
  const pages: string[] = [];
  let totalChars = 0;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ');
    pages.push(text);
    totalChars += text.length;
  }

  const avgCharsPerPage = pdf.numPages > 0 ? totalChars / pdf.numPages : 0;
  const scanned = avgCharsPerPage < threshold;

  const fullText = pages.join('\n');
  const recognition = recognizeBlocks(fullText);

  if (scanned) {
    recognition.confidence = 0;
    recognition.warning =
      'Este PDF parece escaneado (no tiene capa de texto). Te dejamos el horario vacío para que lo armes a mano.';
  }

  const schedule = normalizeToSchedule(recognition, {
    title: options.title,
    timezone: options.timezone,
  });

  return { schedule, recognition, scanned };
}
