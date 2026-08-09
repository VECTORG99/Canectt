/**
 * Parser PDF: usa unpdf (envoltorio sobre pdf.js de Mozilla) para extraer texto.
 * Si la extracción devuelve <50 chars/página, asume PDF escaneado y devuelve
 * un aviso invitando al flujo manual (no falla en silencio).
 */
import { getDocumentProxy } from 'unpdf';
import { recognizeBlocks, type RecognitionResult } from '../recognize.js';
import { normalizeToSchedule } from '../normalize.js';
import { scheduleDefaults } from '@canectt/config';
import type { Schedule } from '@canectt/schema';

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

/**
 * Tipos mínimos del documento PDF que usamos de unpdf.
 * Necesario porque typescript-eslint no resuelve los .d.mts de unpdf
 * (tsc sí los resuelve correctamente).
 */
interface PdfPage {
  getTextContent(): Promise<{ items: Array<{ str?: string }> }>;
}
interface PdfDocument {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
}

/** Parsea un PDF (como ArrayBuffer/Buffer/Uint8Array) a un Schedule canónico. */
export async function parsePdf(
  data: ArrayBuffer | Uint8Array,
  options: ParsePdfOptions = {},
): Promise<ParsePdfResult> {
  const buffer = data instanceof Uint8Array ? data : new Uint8Array(data);
  const pdf = (await getDocumentProxy(buffer)) as unknown as PdfDocument;
  const numPages = pdf.numPages;
  const threshold =
    options.scannedThreshold ?? scheduleDefaults.upload.scannedPdfThresholdCharsPerPage;

  // Iterar por página para medir chars/página (detección de escaneado).
  const pages: string[] = [];
  let totalChars = 0;
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => (typeof item.str === 'string' ? item.str : ''))
      .join(' ');
    pages.push(text);
    totalChars += text.length;
  }

  const avgCharsPerPage = numPages > 0 ? totalChars / numPages : 0;
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
