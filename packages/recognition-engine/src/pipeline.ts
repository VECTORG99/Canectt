/**
 * Orquestador del árbol de reconocimiento: un único punto de entrada
 * detecta el formato del archivo y lo deriva al parser correspondiente.
 * Los cuatro parsers convergen en el mismo normalizador.
 */
import { detectFormat, type DetectedFormat } from './detect-format.js';
import { parseMarkdown } from './parsers/markdown.js';
import { parsePdf } from './parsers/pdf.js';
import { parseDocx } from './parsers/docx.js';
import { parseXlsx } from './parsers/xlsx.js';
import { ScheduleSchema, type Schedule } from '@canectt/schema';

export interface RecognizeInput {
  /** Contenido binario del archivo. */
  data: Uint8Array;
  /** Nombre original del archivo (para fallback de extensión). */
  filename?: string;
  /** Título sugerido para el horario. */
  title?: string;
  /** Zona horaria IANA. */
  timezone?: string;
  /** Si true, intenta OCR cuando se detecta PDF escaneado (default: true). */
  enableOcr?: boolean;
  /** Callback de progreso OCR (0-100). */
  onOcrProgress?: (progress: number, status: string) => void;
}

export interface RecognizeOutput {
  schedule: Schedule;
  format: DetectedFormat;
  /** Aviso de confianza baja o PDF escaneado (null si todo bien). */
  warning: string | null;
  /** Confianza 0-1. */
  confidence: number;
  /** True si se detectó PDF escaneado. */
  scanned: boolean;
  /** True si se aplicó OCR exitosamente. */
  ocrApplied: boolean;
}

/** Error de cliente (4xx) lanzado por el recognition engine. */
export class RecognizeError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'RecognizeError';
    this.status = status;
  }
}

/** Ejecuta el pipeline completo de reconocimiento. */
export async function recognize(input: RecognizeInput): Promise<RecognizeOutput> {
  const format = detectFormat(input.data, input.filename);

  let schedule: Schedule;
  let confidence = 1;
  let warning: string | null = null;
  let scanned = false;
  let ocrApplied = false;

  switch (format) {
    case 'markdown': {
      const text = new TextDecoder().decode(input.data);
      const r = parseMarkdown(text, { title: input.title, timezone: input.timezone });
      schedule = r.schedule;
      confidence = r.recognition.confidence;
      warning = r.recognition.warning;
      break;
    }
    case 'pdf': {
      const r = await parsePdf(input.data, {
        title: input.title,
        timezone: input.timezone,
        enableOcr: input.enableOcr,
        onOcrProgress: input.onOcrProgress,
      });
      schedule = r.schedule;
      confidence = r.recognition.confidence;
      warning = r.recognition.warning;
      scanned = r.scanned;
      ocrApplied = r.ocrApplied;
      break;
    }
    case 'docx': {
      const r = await parseDocx(input.data, { title: input.title, timezone: input.timezone });
      schedule = r.schedule;
      confidence = r.recognition.confidence;
      warning = r.recognition.warning;
      break;
    }
    case 'xlsx': {
      const r = await parseXlsx(input.data, { title: input.title, timezone: input.timezone });
      schedule = r.schedule;
      confidence = r.recognition.confidence;
      warning = r.recognition.warning;
      break;
    }
    default:
      // 400 (no 500): el usuario subió un formato no soportado.
      throw new RecognizeError(
        `Formato no soportado. Aceptamos PDF, Word (.docx), Markdown (.md) y Excel (.xlsx).`,
        400,
      );
  }

  // Validar contra el esquema canónico antes de devolver.
  const parsed = ScheduleSchema.safeParse(schedule);
  if (!parsed.success) {
    // Si la validación falla, devolvemos el horario parcial + aviso.
    warning =
      warning ??
      'El horario reconocido tiene inconsistencias. Te dejamos lo que pudimos reconocer para que lo revises a mano.';
    confidence = Math.min(confidence, 0.5);
  }

  return { schedule, format, warning, confidence, scanned, ocrApplied };
}
