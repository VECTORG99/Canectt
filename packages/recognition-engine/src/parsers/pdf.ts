/**
 * Parser PDF: usa unpdf (envoltorio sobre pdf.js de Mozilla) para extraer texto.
 * Si la extracción devuelve <50 chars/página, asume PDF escaneado e intenta
 * OCR con tesseract.js (renderizando páginas a imágenes con @napi-rs/canvas).
 * Si el OCR falla o no está disponible, devuelve un aviso invitando al
 * flujo manual (no falla en silencio).
 */
import { getDocumentProxy } from 'unpdf';
import { recognizeBlocks, type RecognitionResult } from '../recognize.js';
import { normalizeToSchedule } from '../normalize.js';
import { ocrImages, type OcrProgressCallback } from '../ocr.js';
import { scheduleDefaults } from '@canectt/config';
import type { Schedule } from '@canectt/schema';

export interface ParsePdfOptions {
  title?: string;
  timezone?: string;
  scannedThreshold?: number;
  /** Si true, intenta OCR cuando se detecta PDF escaneado (default: true). */
  enableOcr?: boolean;
  /** Callback de progreso OCR (0-100). */
  onOcrProgress?: OcrProgressCallback;
}

export interface ParsePdfResult {
  schedule: Schedule;
  recognition: RecognitionResult;
  /** True si se detectó que el PDF probablemente está escaneado. */
  scanned: boolean;
  /** True si se aplicó OCR exitosamente. */
  ocrApplied: boolean;
}

/**
 * Tipos mínimos del documento PDF que usamos de unpdf.
 * Necesario porque typescript-eslint no resuelve los .d.mts de unpdf
 * (tsc sí los resuelve correctamente).
 */
interface PdfPage {
  getTextContent(): Promise<{ items: Array<{ str?: string }> }>;
  getViewport(opts: { scale: number }): { width: number; height: number };
  render(opts: { canvasContext: unknown; viewport: { width: number; height: number } }): {
    promise: Promise<void>;
  };
}
interface PdfDocument {
  numPages: number;
  getPage(n: number): Promise<PdfPage>;
}

/** Renderiza las páginas de un PDF a imágenes PNG para OCR. */
async function renderPagesToImages(pdf: PdfDocument, maxPages = 10): Promise<Uint8Array[]> {
  const { createCanvas } = await import('@napi-rs/canvas');
  const images: Uint8Array[] = [];
  const pageCount = Math.min(pdf.numPages, maxPages);

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    const renderTask = page.render({ canvasContext: ctx, viewport });
    await Promise.resolve(renderTask.promise);
    const pngBuffer = canvas.toBuffer('image/png');
    images.push(new Uint8Array(pngBuffer));
  }

  return images;
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
  const enableOcr = options.enableOcr ?? true;

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

  let fullText = pages.join('\n');
  let ocrApplied = false;

  if (scanned && enableOcr) {
    // Intentar OCR: renderizar páginas a imágenes y pasar por tesseract.js.
    try {
      options.onOcrProgress?.(0, 'Iniciando OCR…');
      const images = await renderPagesToImages(pdf);
      const ocrText = await ocrImages(images, {
        onProgress: options.onOcrProgress,
      });
      if (ocrText.trim().length > 0) {
        fullText = ocrText;
        ocrApplied = true;
        options.onOcrProgress?.(100, 'OCR completado');
      }
    } catch {
      // OCR falló: fall back al comportamiento anterior (aviso manual).
      options.onOcrProgress?.(0, 'OCR no disponible');
    }
  }

  const recognition = recognizeBlocks(fullText);

  if (scanned && !ocrApplied) {
    recognition.confidence = 0;
    recognition.warning =
      'Este PDF parece escaneado (no tiene capa de texto). Te dejamos el horario vacío para que lo armes a mano.';
  } else if (scanned && ocrApplied) {
    // OCR aplicado: confianza baja porque el OCR es imperfecto.
    recognition.confidence = Math.min(recognition.confidence, 30);
    recognition.warning =
      'Este PDF estaba escaneado y se aplicó OCR. El reconocimiento puede tener errores; revisa el horario antes de exportar.';
  }

  const schedule = normalizeToSchedule(recognition, {
    title: options.title,
    timezone: options.timezone,
  });

  return { schedule, recognition, scanned, ocrApplied };
}
